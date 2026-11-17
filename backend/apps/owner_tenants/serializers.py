from datetime import timedelta
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User
from apps.core.models import Organization
from apps.owner_tenants.models import (
    SubscriptionInvoice,
    SubscriptionPlan,
    TenantSubscription,
)


def _get_org_vests_count(org):
    """استرجاع عدد السترات غير المخرجة من الخدمة بأمان."""
    if not hasattr(org, 'vests'):
        return 0
    return org.vests.exclude(status='DECOMMISSIONED').count()


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'tier',
            'tier_display',
            'name_ar',
            'name_en',
            'monthly_price_egp',
            'annual_price_egp',
            'default_max_vests',
            'default_max_users',
            'trial_days',
            'features',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenantSubscriptionSerializer(serializers.ModelSerializer):
    plan_name_ar = serializers.CharField(source='plan.name_ar', read_only=True)
    plan_tier = serializers.CharField(source='plan.tier', read_only=True)
    billing_cycle_display = serializers.CharField(source='get_billing_cycle_display', read_only=True)

    class Meta:
        model = TenantSubscription
        fields = [
            'id',
            'plan',
            'plan_tier',
            'plan_name_ar',
            'billing_cycle',
            'billing_cycle_display',
            'starts_at',
            'expires_at',
            'auto_renew',
            'suspension_reason',
            'suspended_at',
        ]


class SubscriptionInvoiceSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    plan_tier = serializers.CharField(source='plan.tier', read_only=True)
    plan_name_ar = serializers.CharField(source='plan.name_ar', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = SubscriptionInvoice
        fields = [
            'id',
            'invoice_number',
            'organization',
            'organization_name',
            'plan',
            'plan_tier',
            'plan_name_ar',
            'amount_egp',
            'status',
            'status_display',
            'due_date',
            'paid_at',
            'payment_method',
            'payment_method_display',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'paid_at', 'created_at', 'updated_at']


class MarkInvoicePaidSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=SubscriptionInvoice.PaymentMethod.choices,
        default=SubscriptionInvoice.PaymentMethod.BANK_TRANSFER,
        required=False,
    )
    extend_subscription = serializers.BooleanField(default=True, required=False)
    extend_days = serializers.IntegerField(min_value=1, max_value=730, required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class OwnerOrganizationListSerializer(serializers.ModelSerializer):
    industry_display = serializers.CharField(source='get_industry_display', read_only=True)
    subscription_tier_display = serializers.CharField(source='get_subscription_tier_display', read_only=True)
    subscription_status_display = serializers.CharField(source='get_subscription_status_display', read_only=True)
    users_count = serializers.SerializerMethodField()
    vests_count = serializers.SerializerMethodField()
    expires_at = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id',
            'name',
            'slug',
            'industry',
            'industry_display',
            'subscription_tier',
            'subscription_tier_display',
            'subscription_status',
            'subscription_status_display',
            'max_vests',
            'max_users',
            'users_count',
            'vests_count',
            'contact_email',
            'contact_phone',
            'is_active',
            'expires_at',
            'created_at',
        ]

    def get_users_count(self, obj):
        return getattr(obj, 'users_count_annotated', None) if hasattr(obj, 'users_count_annotated') else obj.users.count()

    def get_vests_count(self, obj):
        if hasattr(obj, 'vests_count_annotated'):
            return obj.vests_count_annotated
        return _get_org_vests_count(obj)

    def get_expires_at(self, obj):
        sub = getattr(obj, 'subscription_profile', None)
        if sub and sub.expires_at:
            return sub.expires_at.strftime('%Y-%m-%d %H:%M:%S')
        return None


class OwnerUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'organization',
            'organization_name',
            'phone_number',
            'job_title',
            'is_active',
            'is_verified',
            'last_login',
            'created_at',
        ]
        read_only_fields = ['id', 'last_login', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


class OwnerOrganizationDetailSerializer(OwnerOrganizationListSerializer):
    subscription_profile = TenantSubscriptionSerializer(read_only=True)
    recent_invoices = serializers.SerializerMethodField()
    company_admins = serializers.SerializerMethodField()

    class Meta(OwnerOrganizationListSerializer.Meta):
        fields = OwnerOrganizationListSerializer.Meta.fields + [
            'commercial_registration',
            'tax_number',
            'address',
            'updated_at',
            'subscription_profile',
            'recent_invoices',
            'company_admins',
        ]

    def get_recent_invoices(self, obj):
        invoices = obj.invoices.select_related('plan')[:5]
        return SubscriptionInvoiceSerializer(invoices, many=True).data

    def get_company_admins(self, obj):
        admins = obj.users.filter(role=User.Role.COMPANY_ADMIN)
        return OwnerUserSerializer(admins, many=True).data


class OwnerOrganizationCreateSerializer(serializers.Serializer):
    """إنشاء منشأة جديدة مع ملف اشتراكها وحساب مدير الشركة الأول ذرياً."""
    name = serializers.CharField(max_length=200)
    industry = serializers.ChoiceField(
        choices=Organization.IndustryType.choices,
        default=Organization.IndustryType.MANUFACTURING,
    )
    subscription_tier = serializers.ChoiceField(
        choices=Organization.SubscriptionTier.choices,
        default=Organization.SubscriptionTier.FREE_TRIAL,
    )
    billing_cycle = serializers.ChoiceField(
        choices=TenantSubscription.BillingCycle.choices,
        default=TenantSubscription.BillingCycle.MONTHLY,
        required=False,
    )
    max_vests = serializers.IntegerField(min_value=1, required=False)
    max_users = serializers.IntegerField(min_value=1, required=False)
    commercial_registration = serializers.CharField(max_length=50, required=False, allow_blank=True)
    tax_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    # بيانات مدير الشركة الأول
    admin_first_name = serializers.CharField(max_length=150)
    admin_last_name = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, min_length=8)
    admin_phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_admin_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("البريد الإلكتروني لمدير الشركة مسجل بالفعل.")
        return normalized

    def validate_admin_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        tier = validated_data['subscription_tier']
        plan = SubscriptionPlan.objects.filter(tier=tier).first()

        default_vests = plan.default_max_vests if plan else 5
        default_users = plan.default_max_users if plan else 15
        max_vests = validated_data.get('max_vests', default_vests)
        max_users = validated_data.get('max_users', default_users)
        billing_cycle = validated_data.get('billing_cycle', TenantSubscription.BillingCycle.MONTHLY)

        with transaction.atomic():
            org = Organization.objects.create(
                name=validated_data['name'].strip(),
                industry=validated_data['industry'],
                subscription_tier=tier,
                subscription_status=Organization.SubscriptionStatus.ACTIVE,
                max_vests=max_vests,
                max_users=max_users,
                commercial_registration=validated_data.get('commercial_registration', ''),
                tax_number=validated_data.get('tax_number', ''),
                contact_email=validated_data.get('contact_email') or validated_data['admin_email'],
                contact_phone=validated_data.get('contact_phone') or validated_data.get('admin_phone_number', ''),
                address=validated_data.get('address', ''),
                is_active=True,
            )

            if plan:
                if tier == Organization.SubscriptionTier.FREE_TRIAL:
                    days = plan.trial_days
                elif billing_cycle == TenantSubscription.BillingCycle.ANNUAL:
                    days = 365
                else:
                    days = 30

                TenantSubscription.objects.create(
                    organization=org,
                    plan=plan,
                    billing_cycle=billing_cycle,
                    starts_at=timezone.now(),
                    expires_at=timezone.now() + timedelta(days=days),
                )

            admin_user = User.objects.create_user(
                email=validated_data['admin_email'],
                username=validated_data['admin_email'],
                first_name=validated_data['admin_first_name'],
                last_name=validated_data['admin_last_name'],
                phone_number=validated_data.get('admin_phone_number', ''),
                organization=org,
                role=User.Role.COMPANY_ADMIN,
                job_title='مدير الشركة / المنشأة',
                is_verified=True,
                password=validated_data['admin_password'],
            )

        return {'organization': org, 'admin_user': admin_user}


class OwnerOrganizationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'name',
            'industry',
            'commercial_registration',
            'tax_number',
            'subscription_tier',
            'subscription_status',
            'max_vests',
            'max_users',
            'contact_email',
            'contact_phone',
            'address',
            'is_active',
        ]

    def validate_max_users(self, value):
        if self.instance and value < self.instance.users.count():
            raise serializers.ValidationError(
                f"لا يمكن تقليل الحد الأقصى للمستخدمين عن العدد الحالي ({self.instance.users.count()})."
            )
        return value

    def validate_max_vests(self, value):
        if self.instance:
            used = _get_org_vests_count(self.instance)
            if value < used:
                raise serializers.ValidationError(
                    f"لا يمكن تقليل الحد الأقصى للسترات عن العدد المخصص حالياً ({used})."
                )
        return value

    def update(self, instance, validated_data):
        new_tier = validated_data.get('subscription_tier')
        org = super().update(instance, validated_data)
        if new_tier:
            plan = SubscriptionPlan.objects.filter(tier=new_tier).first()
            sub = getattr(org, 'subscription_profile', None)
            if plan and sub and sub.plan_id != plan.id:
                sub.plan = plan
                sub.save(update_fields=['plan', 'updated_at'])
        return org


class OrganizationStatusActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['suspend', 'activate'])
    reason = serializers.CharField(required=False, allow_blank=True)


class OwnerUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices)
    organization_id = serializers.UUIDField(required=False, allow_null=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_verified = serializers.BooleanField(default=True, required=False)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("البريد الإلكتروني مسجل بالفعل.")
        return normalized

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        role = attrs['role']
        org_id = attrs.get('organization_id')

        if role != User.Role.SUPER_ADMIN and not org_id:
            raise serializers.ValidationError({"organization_id": "يجب تحديد المنشأة لهذا الدور الوظيفي."})

        if org_id:
            org = Organization.objects.filter(id=org_id).first()
            if not org:
                raise serializers.ValidationError({"organization_id": "المنشأة المحددة غير موجودة."})
            if not org.is_active:
                raise serializers.ValidationError({"organization_id": "المنشأة معلقة حالياً."})
            if org.users.count() >= org.max_users:
                raise serializers.ValidationError(
                    {"organization_id": f"وصلت المنشأة للحد الأقصى للمستخدمين ({org.max_users})."}
                )
            attrs['_organization'] = org
        else:
            attrs['_organization'] = None

        return attrs

    def create(self, validated_data):
        org = validated_data.pop('_organization', None)
        validated_data.pop('organization_id', None)
        password = validated_data.pop('password')
        role = validated_data['role']

        return User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number', ''),
            job_title=validated_data.get('job_title', ''),
            role=role,
            organization=org,
            is_verified=validated_data.get('is_verified', True),
            is_staff=(role == User.Role.SUPER_ADMIN),
            is_superuser=(role == User.Role.SUPER_ADMIN),
            password=password,
        )


class OwnerUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'role',
            'organization',
            'phone_number',
            'job_title',
            'is_active',
            'is_verified',
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        target = self.instance
        new_active = attrs.get('is_active', target.is_active)
        new_role = attrs.get('role', target.role)

        if request and request.user.id == target.id:
            if not new_active:
                raise serializers.ValidationError("لا يمكنك تعطيل حسابك الشخصي.")
            if new_role != User.Role.SUPER_ADMIN:
                raise serializers.ValidationError("لا يمكنك تخفيض صلاحية حسابك الشخصي من Super Admin.")

        if target.role == User.Role.SUPER_ADMIN and (not new_active or new_role != User.Role.SUPER_ADMIN):
            other_super_admins = User.objects.filter(
                role=User.Role.SUPER_ADMIN,
                is_active=True,
            ).exclude(id=target.id)
            if not other_super_admins.exists():
                raise serializers.ValidationError("يجب الإبقاء على حساب Super Admin نشط واحد على الأقل في النظام.")

        return attrs
