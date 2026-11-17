from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, views, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsSuperAdmin
from apps.core.models import Organization
from apps.core.pagination import OwnerPagination
from apps.owner_fleet.models import (
    EdgeGateway,
    PlatformAuditLog,
    SmartVest,
    SystemAnnouncement,
)
from apps.owner_fleet.serializers import (
    EdgeGatewaySerializer,
    GatewayUnassignSerializer,
    HardwareAssignSerializer,
    PlatformAuditLogSerializer,
    SmartVestSerializer,
    SystemAnnouncementSerializer,
    VestUnassignSerializer,
)
from apps.owner_fleet.services import (
    build_growth_analytics,
    build_owner_overview,
    build_system_health,
    record_audit_log,
)


def _apply_hardware_filters(queryset, params, search_fields):
    """فلترة موحدة لقوائم العتاد (السترات والبوابات)."""
    status_filter = params.get('status')
    org_id = params.get('organization')
    unassigned = params.get('unassigned')
    firmware = params.get('firmware_version')
    search = params.get('search', '').strip()

    if status_filter:
        queryset = queryset.filter(status=status_filter)
    if org_id:
        queryset = queryset.filter(organization_id=org_id)
    if unassigned and unassigned.lower() in ('true', '1', 'yes'):
        queryset = queryset.filter(organization__isnull=True)
    if firmware:
        queryset = queryset.filter(firmware_version__iexact=firmware.strip())
    if search:
        query = Q()
        for field in search_fields:
            query |= Q(**{f'{field}__icontains': search})
        queryset = queryset.filter(query)
    return queryset


class OwnerOverviewView(views.APIView):
    """
    GET /api/v1/owner/overview/
    ملخص المؤشرات التنفيذية الشاملة للوحة مالك النظام.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        overview = build_owner_overview()
        recent_logs = PlatformAuditLog.objects.select_related('actor')[:5]
        return Response({
            'success': True,
            'overview': overview,
            'recent_audit_logs': PlatformAuditLogSerializer(recent_logs, many=True).data,
        })


class OwnerGrowthAnalyticsView(views.APIView):
    """
    GET /api/v1/owner/analytics/growth/?months=6
    سلاسل زمنية شهرية للنمو التشغيلي والمالي.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        raw_months = request.query_params.get('months', '6')
        try:
            months = int(raw_months)
        except ValueError:
            return Response(
                {'success': False, 'message': 'قيمة months يجب أن تكون رقماً صحيحاً.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        months = max(1, min(months, 24))
        series = build_growth_analytics(months=months)
        return Response({
            'success': True,
            'months': months,
            'series': series,
        })


class OwnerSystemHealthView(views.APIView):
    """
    GET /api/v1/owner/health/
    فحص حالة النظام والبنية التحتية والتنبيهات التشغيلية.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        return Response({
            'success': True,
            'health': build_system_health(),
        })


class SmartVestViewSet(viewsets.ModelViewSet):
    """
    إدارة مخزون السترات الذكية وتخصيصها للمنشآت.
    /api/v1/owner/vests/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SmartVestSerializer
    pagination_class = OwnerPagination

    def get_queryset(self):
        qs = SmartVest.objects.select_related('organization').all()
        return _apply_hardware_filters(
            qs,
            self.request.query_params,
            ['serial_number', 'mac_address', 'sim_iccid', 'organization__name'],
        )

    def perform_create(self, serializer):
        vest = serializer.save()
        record_audit_log(
            actor=self.request.user,
            action='VEST_CREATED',
            target_type='SmartVest',
            target_id=vest.id,
            target_label=vest.serial_number,
            metadata={'mac_address': vest.mac_address, 'status': vest.status},
            request=self.request,
        )

    def perform_update(self, serializer):
        vest = serializer.save()
        record_audit_log(
            actor=self.request.user,
            action='VEST_UPDATED',
            target_type='SmartVest',
            target_id=vest.id,
            target_label=vest.serial_number,
            metadata={'status': vest.status, 'firmware_version': vest.firmware_version},
            request=self.request,
        )

    def destroy(self, request, *args, **kwargs):
        vest = self.get_object()
        if vest.organization is not None:
            return Response(
                {
                    'success': False,
                    'message': 'لا يمكن إخراج سترة مخصصة لمنشأة من الخدمة قبل سحبها للمخزون أولاً.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        vest.status = SmartVest.Status.DECOMMISSIONED
        vest.save(update_fields=['status', 'updated_at'])
        record_audit_log(
            actor=request.user,
            action='VEST_DECOMMISSIONED',
            target_type='SmartVest',
            target_id=vest.id,
            target_label=vest.serial_number,
            request=request,
        )
        return Response({
            'success': True,
            'message': 'تم إخراج السترة من الخدمة بنجاح.',
            'vest': SmartVestSerializer(vest).data,
        })

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        serializer = HardwareAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات التخصيص غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        org_id = serializer.validated_data['organization_id']
        with transaction.atomic():
            vest = SmartVest.objects.select_for_update().filter(pk=pk).first()
            if not vest:
                return Response({'success': False, 'message': 'السترة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

            if vest.status == SmartVest.Status.DECOMMISSIONED:
                return Response(
                    {'success': False, 'message': 'لا يمكن تخصيص سترة خارجة من الخدمة.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if vest.organization_id is not None:
                return Response(
                    {'success': False, 'message': 'السترة مخصصة بالفعل لمنشأة؛ اسحبها للمخزون أولاً.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            org = Organization.objects.filter(id=org_id).first()
            if not org:
                return Response({'success': False, 'message': 'المنشأة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

            if not org.is_active or org.subscription_status != Organization.SubscriptionStatus.ACTIVE:
                return Response(
                    {'success': False, 'message': 'لا يمكن تخصيص سترات لمنشأة معلقة أو منتهية الاشتراك.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_count = org.vests.exclude(status=SmartVest.Status.DECOMMISSIONED).count()
            if current_count >= org.max_vests:
                return Response(
                    {
                        'success': False,
                        'message': f'وصلت المنشأة للحد الأقصى المسموح للسترات ({org.max_vests}).',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            vest.organization = org
            vest.assigned_at = timezone.now()
            vest.status = SmartVest.Status.ASSIGNED
            vest.save(update_fields=['organization', 'assigned_at', 'status', 'updated_at'])

            record_audit_log(
                actor=request.user,
                action='VEST_ASSIGNED',
                target_type='SmartVest',
                target_id=vest.id,
                target_label=f'{vest.serial_number} -> {org.name}',
                metadata={'organization_id': str(org.id)},
                request=request,
            )

        return Response({
            'success': True,
            'message': f'تم تخصيص السترة {vest.serial_number} لمنشأة {org.name} بنجاح.',
            'vest': SmartVestSerializer(vest).data,
        })

    @action(detail=True, methods=['post'], url_path='unassign')
    def unassign(self, request, pk=None):
        serializer = VestUnassignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات السحب غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vest = self.get_object()
        if vest.organization is None:
            return Response(
                {'success': False, 'message': 'السترة غير مخصصة لأي منشأة حالياً.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_org_name = vest.organization.name
        prev_org_id = str(vest.organization.id)
        vest.organization = None
        vest.assigned_at = None
        vest.status = serializer.validated_data.get('target_status', SmartVest.Status.IN_STOCK)
        vest.save(update_fields=['organization', 'assigned_at', 'status', 'updated_at'])

        record_audit_log(
            actor=request.user,
            action='VEST_UNASSIGNED',
            target_type='SmartVest',
            target_id=vest.id,
            target_label=f'{vest.serial_number} <- {prev_org_name}',
            metadata={'previous_organization_id': prev_org_id, 'new_status': vest.status},
            request=request,
        )

        return Response({
            'success': True,
            'message': 'تم سحب السترة إلى المخزون بنجاح.',
            'vest': SmartVestSerializer(vest).data,
        })


class EdgeGatewayViewSet(viewsets.ModelViewSet):
    """
    إدارة بوابات الحافة المحلية (Raspberry Pi 4 Gateways).
    /api/v1/owner/gateways/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = EdgeGatewaySerializer
    pagination_class = OwnerPagination

    def get_queryset(self):
        qs = EdgeGateway.objects.select_related('organization').all()
        return _apply_hardware_filters(
            qs,
            self.request.query_params,
            ['gateway_uid', 'model_name', 'organization__name'],
        )

    def perform_create(self, serializer):
        gw = serializer.save()
        record_audit_log(
            actor=self.request.user,
            action='GATEWAY_CREATED',
            target_type='EdgeGateway',
            target_id=gw.id,
            target_label=gw.gateway_uid,
            request=self.request,
        )

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        serializer = HardwareAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات التخصيص غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gw = self.get_object()
        org = Organization.objects.filter(id=serializer.validated_data['organization_id']).first()
        if not org:
            return Response({'success': False, 'message': 'المنشأة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)
        if not org.is_active:
            return Response(
                {'success': False, 'message': 'لا يمكن تخصيص بوابة لمنشأة غير نشطة.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gw.organization = org
        if gw.status == EdgeGateway.Status.IN_STOCK:
            gw.status = EdgeGateway.Status.OFFLINE
        gw.save(update_fields=['organization', 'status', 'updated_at'])

        record_audit_log(
            actor=request.user,
            action='GATEWAY_ASSIGNED',
            target_type='EdgeGateway',
            target_id=gw.id,
            target_label=f'{gw.gateway_uid} -> {org.name}',
            metadata={'organization_id': str(org.id)},
            request=request,
        )

        return Response({
            'success': True,
            'message': f'تم ربط البوابة {gw.gateway_uid} بمنشأة {org.name} بنجاح.',
            'gateway': EdgeGatewaySerializer(gw).data,
        })

    @action(detail=True, methods=['post'], url_path='unassign')
    def unassign(self, request, pk=None):
        serializer = GatewayUnassignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'بيانات السحب غير صالحة.', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        gw = self.get_object()
        if gw.organization is None:
            return Response(
                {'success': False, 'message': 'البوابة غير مرتبطة بأي منشأة.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_org = gw.organization.name
        gw.organization = None
        gw.status = serializer.validated_data.get('target_status', EdgeGateway.Status.IN_STOCK)
        gw.save(update_fields=['organization', 'status', 'updated_at'])

        record_audit_log(
            actor=request.user,
            action='GATEWAY_UNASSIGNED',
            target_type='EdgeGateway',
            target_id=gw.id,
            target_label=f'{gw.gateway_uid} <- {prev_org}',
            request=request,
        )
        return Response({
            'success': True,
            'message': 'تم فك ارتباط البوابة وإرجاعها للمخزون بنجاح.',
            'gateway': EdgeGatewaySerializer(gw).data,
        })


class PlatformAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    استعراض سجل تدقيق عمليات مالك النظام.
    GET /api/v1/owner/audit-logs/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = PlatformAuditLogSerializer
    pagination_class = OwnerPagination

    def get_queryset(self):
        qs = PlatformAuditLog.objects.select_related('actor').all()
        params = self.request.query_params
        if params.get('action'):
            qs = qs.filter(action=params['action'])
        if params.get('target_type'):
            qs = qs.filter(target_type=params['target_type'])
        if params.get('actor'):
            qs = qs.filter(actor_id=params['actor'])
        if params.get('date_from'):
            qs = qs.filter(created_at__date__gte=params['date_from'])
        if params.get('date_to'):
            qs = qs.filter(created_at__date__lte=params['date_to'])
        if params.get('search'):
            s = params['search'].strip()
            qs = qs.filter(Q(target_label__icontains=s) | Q(action__icontains=s) | Q(actor__email__icontains=s))
        return qs


class SystemAnnouncementViewSet(viewsets.ModelViewSet):
    """
    إدارة إعلانات وإشعارات المنصة.
    /api/v1/owner/announcements/
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemAnnouncementSerializer
    pagination_class = OwnerPagination

    def get_queryset(self):
        qs = SystemAnnouncement.objects.select_related('created_by').all()
        params = self.request.query_params
        if params.get('is_active') in ('true', 'false'):
            qs = qs.filter(is_active=(params['is_active'] == 'true'))
        if params.get('severity'):
            qs = qs.filter(severity=params['severity'])
        if params.get('target_tier'):
            qs = qs.filter(target_tier=params['target_tier'])
        if params.get('search'):
            s = params['search'].strip()
            qs = qs.filter(Q(title__icontains=s) | Q(message__icontains=s))
        return qs

    def perform_create(self, serializer):
        ann = serializer.save(created_by=self.request.user)
        record_audit_log(
            actor=self.request.user,
            action='ANNOUNCEMENT_CREATED',
            target_type='SystemAnnouncement',
            target_id=ann.id,
            target_label=ann.title,
            metadata={'severity': ann.severity, 'target_tier': ann.target_tier},
            request=self.request,
        )

    def perform_update(self, serializer):
        ann = serializer.save()
        record_audit_log(
            actor=self.request.user,
            action='ANNOUNCEMENT_UPDATED',
            target_type='SystemAnnouncement',
            target_id=ann.id,
            target_label=ann.title,
            metadata={'is_active': ann.is_active},
            request=self.request,
        )
