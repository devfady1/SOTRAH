from datetime import timedelta

from django.apps import apps
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import IsSuperAdmin
from apps.core.models import Organization
from apps.core.pagination import OwnerPagination
from apps.owner_tenants.models import (
    SubscriptionInvoice,
    SubscriptionPlan,
    TenantSubscription,
)
from apps.owner_tenants.serializers import (
    MarkInvoicePaidSerializer,
    OrganizationStatusActionSerializer,
    OwnerOrganizationCreateSerializer,
    OwnerOrganizationDetailSerializer,
    OwnerOrganizationListSerializer,
    OwnerOrganizationUpdateSerializer,
    OwnerUserCreateSerializer,
    OwnerUserSerializer,
    OwnerUserUpdateSerializer,
    SubscriptionInvoiceSerializer,
    SubscriptionPlanSerializer,
)


def _audit(request, *, action, target_type, target_id, target_label, metadata=None):
    """تسجيل الحدث في سجل التدقيق المركزي بأمان."""
    if not apps.is_installed('apps.owner_fleet'):
        return
    from apps.owner_fleet.services import record_audit_log

    record_audit_log(
        actor=request.user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_label=target_label,
        metadata=metadata,
        request=request,
    )


class OwnerOrganizationViewSet(viewsets.ModelViewSet):
    """
    إدارة المنشآت والشركات المشتركة (Tenants) لمالك النظام.
    /api/v1/owner/organizations/
    """
    permission_classes = [IsSuperAdmin]
    pagination_class = OwnerPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = Organization.objects.select_related('subscription_profile', 'subscription_profile__plan').annotate(
            users_count_annotated=Count('users', distinct=True),
        )
        if apps.is_installed('apps.owner_fleet'):
            qs = qs.annotate(
                vests_count_annotated=Count(
                    'vests',
                    filter=~Q(vests__status='DECOMMISSIONED'),
                    distinct=True,
                )
            )

        params = self.request.query_params
        if params.get('industry'):
            qs = qs.filter(industry=params['industry'])
        if params.get('subscription_tier'):
            qs = qs.filter(subscription_tier=params['subscription_tier'])
        if params.get('subscription_status'):
            qs = qs.filter(subscription_status=params['subscription_status'])
        if params.get('is_active') in ('true', 'false'):
            qs = qs.filter(is_active=(params['is_active'] == 'true'))
        if params.get('search'):
            s = params['search'].strip()
            qs = qs.filter(
                Q(name__icontains=s)
                | Q(slug__icontains=s)
                | Q(contact_email__icontains=s)
                | Q(commercial_registration__icontains=s)
            )
        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'list':
            return OwnerOrganizationListSerializer
        if self.action == 'create':
            return OwnerOrganizationCreateSerializer
        if self.action == 'partial_update':
            return OwnerOrganizationUpdateSerializer
        return OwnerOrganizationDetailSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'تعذر إنشاء المنشأة، يرجى مراجعة البيانات.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = serializer.save()
        org = result['organization']
        admin_user = result['admin_user']

        _audit(
            request,
            action='ORG_CREATED',
            target_type='Organization',
            target_id=org.id,
            target_label=org.name,
            metadata={'tier': org.subscription_tier, 'admin_email': admin_user.email},
        )

        return Response(
            {
                'success': True,
                'message': f'تم إنشاء المنشأة "{org.name}" وحساب مدير الشركة بنجاح.',
                'organization': OwnerOrganizationDetailSerializer(org).data,
                'admin_user': OwnerUserSerializer(admin_user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        org = self.get_object()
        serializer = self.get_serializer(org, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات التعديل غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated_org = serializer.save()
        _audit(
            request,
            action='ORG_UPDATED',
            target_type='Organization',
            target_id=updated_org.id,
            target_label=updated_org.name,
            metadata={'updated_fields': list(request.data.keys())},
        )
        return Response({
            'success': True,
            'message': 'تم تحديث بيانات المنشأة بنجاح.',
            'organization': OwnerOrganizationDetailSerializer(updated_org).data,
        })

    @action(detail=True, methods=['post'], url_path='status')
    def change_status(self, request, pk=None):
        org = self.get_object()
        serializer = OrganizationStatusActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات الإجراء غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action_type = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '').strip()

        with transaction.atomic():
            sub = getattr(org, 'subscription_profile', None)
            if action_type == 'suspend':
                org.is_active = False
                org.subscription_status = Organization.SubscriptionStatus.SUSPENDED
                if sub:
                    sub.suspended_at = timezone.now()
                    sub.suspension_reason = reason or 'تم التعليق من قبل مالك النظام.'
                    sub.save(update_fields=['suspended_at', 'suspension_reason', 'updated_at'])
                audit_action = 'ORG_SUSPENDED'
                msg = f'تم تعليق منشأة "{org.name}" بنجاح.'
            else:
                org.is_active = True
                org.subscription_status = Organization.SubscriptionStatus.ACTIVE
                if sub:
                    sub.suspended_at = None
                    sub.suspension_reason = None
                    sub.save(update_fields=['suspended_at', 'suspension_reason', 'updated_at'])
                audit_action = 'ORG_ACTIVATED'
                msg = f'تم تفعيل منشأة "{org.name}" بنجاح.'

            org.save(update_fields=['is_active', 'subscription_status', 'updated_at'])

        _audit(
            request,
            action=audit_action,
            target_type='Organization',
            target_id=org.id,
            target_label=org.name,
            metadata={'reason': reason},
        )

        return Response({
            'success': True,
            'message': msg,
            'organization': OwnerOrganizationDetailSerializer(org).data,
        })


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    إدارة خطط وباقات الاشتراك في منصة سُترة.
    /api/v1/owner/plans/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SubscriptionPlanSerializer
    queryset = SubscriptionPlan.objects.all()
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def perform_create(self, serializer):
        plan = serializer.save()
        _audit(
            self.request,
            action='PLAN_CREATED',
            target_type='SubscriptionPlan',
            target_id=plan.id,
            target_label=f'{plan.name_ar} ({plan.tier})',
        )

    def perform_update(self, serializer):
        plan = serializer.save()
        _audit(
            self.request,
            action='PLAN_UPDATED',
            target_type='SubscriptionPlan',
            target_id=plan.id,
            target_label=f'{plan.name_ar} ({plan.tier})',
        )


class SubscriptionInvoiceViewSet(viewsets.ModelViewSet):
    """
    إدارة فواتير اشتراكات المنشآت.
    /api/v1/owner/invoices/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SubscriptionInvoiceSerializer
    pagination_class = OwnerPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = SubscriptionInvoice.objects.select_related('organization', 'plan').all()
        params = self.request.query_params
        if params.get('status'):
            qs = qs.filter(status=params['status'])
        if params.get('organization'):
            qs = qs.filter(organization_id=params['organization'])
        if params.get('search'):
            s = params['search'].strip()
            qs = qs.filter(Q(invoice_number__icontains=s) | Q(organization__name__icontains=s))
        return qs

    def perform_create(self, serializer):
        inv = serializer.save()
        _audit(
            self.request,
            action='INVOICE_CREATED',
            target_type='SubscriptionInvoice',
            target_id=inv.id,
            target_label=f'{inv.invoice_number} - {inv.organization.name}',
            metadata={'amount_egp': str(inv.amount_egp)},
        )

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == SubscriptionInvoice.Status.PAID:
            return Response(
                {'success': False, 'message': 'الفاتورة مسددة بالفعل.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if invoice.status == SubscriptionInvoice.Status.CANCELLED:
            return Response(
                {'success': False, 'message': 'لا يمكن تأكيد سداد فاتورة ملغاة.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MarkInvoicePaidSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات السداد غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        with transaction.atomic():
            invoice.status = SubscriptionInvoice.Status.PAID
            invoice.paid_at = timezone.now()
            invoice.payment_method = data.get('payment_method', invoice.payment_method)
            if data.get('notes'):
                invoice.notes = data['notes']
            invoice.save(update_fields=['status', 'paid_at', 'payment_method', 'notes', 'updated_at'])

            if data.get('extend_subscription', True):
                sub = getattr(invoice.organization, 'subscription_profile', None)
                if sub:
                    default_days = 365 if sub.billing_cycle == TenantSubscription.BillingCycle.ANNUAL else 30
                    days = data.get('extend_days', default_days)
                    base_dt = max(sub.expires_at, timezone.now())
                    sub.expires_at = base_dt + timedelta(days=days)
                    sub.plan = invoice.plan
                    sub.save(update_fields=['expires_at', 'plan', 'updated_at'])

                org = invoice.organization
                org.subscription_status = Organization.SubscriptionStatus.ACTIVE
                org.is_active = True
                org.save(update_fields=['subscription_status', 'is_active', 'updated_at'])

        _audit(
            request,
            action='INVOICE_PAID',
            target_type='SubscriptionInvoice',
            target_id=invoice.id,
            target_label=f'{invoice.invoice_number} - {invoice.organization.name}',
            metadata={'amount_egp': str(invoice.amount_egp), 'payment_method': invoice.payment_method},
        )

        return Response({
            'success': True,
            'message': f'تم تأكيد سداد الفاتورة {invoice.invoice_number} بنجاح.',
            'invoice': SubscriptionInvoiceSerializer(invoice).data,
        })


class OwnerUserViewSet(viewsets.ModelViewSet):
    """
    إدارة كافة مستخدمي المنصة عبر المنشآت لمالك النظام.
    /api/v1/owner/users/
    """
    permission_classes = [IsSuperAdmin]
    pagination_class = OwnerPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = User.objects.select_related('organization').all()
        params = self.request.query_params
        if params.get('organization'):
            qs = qs.filter(organization_id=params['organization'])
        if params.get('role'):
            qs = qs.filter(role=params['role'])
        if params.get('is_active') in ('true', 'false'):
            qs = qs.filter(is_active=(params['is_active'] == 'true'))
        if params.get('is_verified') in ('true', 'false'):
            qs = qs.filter(is_verified=(params['is_verified'] == 'true'))
        if params.get('search'):
            s = params['search'].strip()
            qs = qs.filter(
                Q(email__icontains=s)
                | Q(first_name__icontains=s)
                | Q(last_name__icontains=s)
                | Q(phone_number__icontains=s)
                | Q(organization__name__icontains=s)
            )
        return qs.order_by('-date_joined')

    def get_serializer_class(self):
        if self.action == 'create':
            return OwnerUserCreateSerializer
        if self.action == 'partial_update':
            return OwnerUserUpdateSerializer
        return OwnerUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'تعذر إنشاء المستخدم.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        _audit(
            request,
            action='USER_CREATED',
            target_type='User',
            target_id=user.id,
            target_label=user.email,
            metadata={'role': user.role, 'organization_id': str(user.organization_id) if user.organization_id else None},
        )
        return Response(
            {
                'success': True,
                'message': 'تم إنشاء حساب المستخدم بنجاح.',
                'user': OwnerUserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        target_user = self.get_object()
        serializer = self.get_serializer(
            target_user,
            data=request.data,
            partial=True,
            context={'request': request},
        )
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'تعذر تعديل بيانات المستخدم.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated_user = serializer.save()
        _audit(
            request,
            action='USER_UPDATED',
            target_type='User',
            target_id=updated_user.id,
            target_label=updated_user.email,
            metadata={'updated_fields': list(request.data.keys()), 'is_active': updated_user.is_active},
        )
        return Response({
            'success': True,
            'message': 'تم تحديث بيانات المستخدم بنجاح.',
            'user': OwnerUserSerializer(updated_user).data,
        })
