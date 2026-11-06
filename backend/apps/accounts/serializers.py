from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import Organization
from apps.accounts.models import User


class OrganizationSummarySerializer(serializers.ModelSerializer):
    """
    سيريالايزر مختصر للمنشأة / الشركة التابع لها المستخدم.
    """
    industry_display = serializers.CharField(source='get_industry_display', read_only=True)
    subscription_tier_display = serializers.CharField(source='get_subscription_tier_display', read_only=True)

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
            'max_vests',
            'max_users',
            'is_active',
        ]


class UserSerializer(serializers.ModelSerializer):
    """
    سيريالايزر استعراض بيانات المستخدم الكاملة وصلاحياته في المنظومة.
    """
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    organization = OrganizationSummarySerializer(read_only=True)

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
            'phone_number',
            'national_id',
            'employee_id',
            'job_title',
            'blood_type',
            'emergency_contact_name',
            'emergency_contact_phone',
            'is_verified',
            'created_at',
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.Serializer):
    """
    سيريالايزر إنشاء حساب جديد (Registration API).
    يدعم تسجيل مدير منشأة جديدة (SaaS Company Admin) مع إنشاء شركته تلقائياً،
    أو الانضمام لمنشأة قائمة باستخدام معرف الشركة.
    """
    first_name = serializers.CharField(max_length=150, required=True, label="الاسم الأول")
    last_name = serializers.CharField(max_length=150, required=True, label="اسم العائلة")
    email = serializers.EmailField(required=True, label="البريد الإلكتروني")
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, label="رقم المحمول")
    national_id = serializers.CharField(max_length=14, required=False, allow_blank=True, label="الرقم القومي")
    
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, label="كلمة المرور")
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'}, label="تأكيد كلمة المرور")
    
    # خيارات تسجيل المنشأة (SaaS Tenant)
    create_organization = serializers.BooleanField(default=True, label="إنشاء منشأة / شركة جديدة")
    organization_name = serializers.CharField(max_length=200, required=False, allow_blank=True, label="اسم الشركة / المصنع")
    organization_industry = serializers.ChoiceField(
        choices=Organization.IndustryType.choices,
        default=Organization.IndustryType.MANUFACTURING,
        required=False,
        label="مجال عمل الشركة"
    )
    
    # في حال كان المستخدم ينضم لشركة موجودة مسبقاً
    organization_id = serializers.UUIDField(required=False, allow_null=True, label="معرف الشركة الموجودة مسبقاً")
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        default=User.Role.COMPANY_ADMIN,
        required=False,
        label="نوع الحساب / الدور"
    )

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("البريد الإلكتروني مسجل بالفعل في النظام.")
        return normalized

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "كلمتا المرور غير متطابقتين."})
        
        validate_password(attrs.get('password'))

        create_org = attrs.get('create_organization', True)
        org_name = attrs.get('organization_name', '').strip()
        org_id = attrs.get('organization_id')

        if create_org and not org_name:
            raise serializers.ValidationError({"organization_name": "يرجى تحديد اسم الشركة أو المصنع لإنشاء حساب المنشأة."})
        
        if not create_org and not org_id:
            raise serializers.ValidationError({"organization_id": "يرجى تحديد معرف المنشأة التابع لها المستخدم."})

        if not create_org and org_id:
            if not Organization.objects.filter(id=org_id, is_active=True).exists():
                raise serializers.ValidationError({"organization_id": "المنشأة المحددة غير موجودة أو معلقة."})

        return attrs

    def create(self, validated_data):
        create_org = validated_data.get('create_organization', True)
        org_name = validated_data.get('organization_name')
        org_industry = validated_data.get('organization_industry', Organization.IndustryType.MANUFACTURING)
        org_id = validated_data.get('organization_id')
        role = validated_data.get('role', User.Role.COMPANY_ADMIN)

        with transaction.atomic():
            if create_org:
                organization = Organization.objects.create(
                    name=org_name,
                    industry=org_industry,
                    contact_email=validated_data['email'],
                    contact_phone=validated_data.get('phone_number', ''),
                    subscription_tier=Organization.SubscriptionTier.FREE_TRIAL,
                )
                role = User.Role.COMPANY_ADMIN
            else:
                organization = Organization.objects.get(id=org_id)

            username = validated_data['email']
            user = User.objects.create_user(
                email=validated_data['email'],
                username=username,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                phone_number=validated_data.get('phone_number', ''),
                national_id=validated_data.get('national_id', ''),
                organization=organization,
                role=role,
                password=validated_data['password'],
            )

            return user


class LoginSerializer(serializers.Serializer):
    """
    سيريالايزر تسجيل الدخول (Login API).
    يدعم الدخول بالبريد الإلكتروني أو اسم المستخدم مع توليد JWT Tokens مباشرة.
    """
    email = serializers.CharField(required=True, label="البريد الإلكتروني أو اسم المستخدم")
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'}, label="كلمة المرور")

    def validate(self, attrs):
        login_identifier = attrs.get('email', '').strip()
        password = attrs.get('password')

        if not login_identifier or not password:
            raise serializers.ValidationError("يرجى إدخال البريد الإلكتروني وكلمة المرور.")

        # التحقق إن كان المدخل بريداً إلكترونياً أو اسم مستخدم
        user_candidate = User.objects.filter(email__iexact=login_identifier).first()
        if not user_candidate:
            user_candidate = User.objects.filter(username__iexact=login_identifier).first()

        if not user_candidate:
            raise serializers.ValidationError("بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.")

        user = authenticate(username=user_candidate.email, password=password)
        if not user:
            # محاولة الدخول باسم المستخدم في حال فشل البريد
            user = authenticate(username=user_candidate.username, password=password)

        if not user:
            raise serializers.ValidationError("بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.")

        if not user.is_active:
            raise serializers.ValidationError("هذا الحساب معطل، يرجى التواصل مع إدارة النظام.")

        # إذا كانت الشركة غير نشطة
        if user.organization and not user.organization.is_active:
            raise serializers.ValidationError("اشتراك الشركة التابع لها الحساب معلق حالياً.")

        attrs['user'] = user
        return attrs
