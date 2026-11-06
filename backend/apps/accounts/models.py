import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from apps.core.models import TimeStampedModel, Organization


class UserManager(BaseUserManager):
    """
    مدير مخصص لنموذج المستخدم يتيح التسجيل والتوثيق عبر البريد الإلكتروني.
    Custom manager supporting email as the primary unique identifier.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('يجب توفير البريد الإلكتروني'))
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    نموذج المستخدم المخصص لمنظومة «سُترة» (Sotrah Custom User).
    يدعم المعمارية السحابية متعددة المستأجرين (Multi-Tenant SaaS) وتعدد الأدوار الوظيفية.
    """
    class Role(models.TextChoices):
        SUPER_ADMIN = 'SUPER_ADMIN', 'مدير عام النظام (Super Admin)'
        COMPANY_ADMIN = 'COMPANY_ADMIN', 'مدير الشركة / المنشأة (Company Admin)'
        SAFETY_OFFICER = 'SAFETY_OFFICER', 'مسؤول السلامة والصحة المهنية (HSE Officer)'
        MEDICAL_STAFF = 'MEDICAL_STAFF', 'الطبيب / المسعف المهني (Medical Officer)'
        HR_MANAGER = 'HR_MANAGER', 'مدير الموارد البشرية (HR Manager)'
        FIELD_SUPERVISOR = 'FIELD_SUPERVISOR', 'مشرف الميدان والوردية (Field Supervisor)'
        WORKER = 'WORKER', 'عامل ميداني (Smart Vest Wearer)'

    class BloodType(models.TextChoices):
        A_POS = 'A+', 'A+'
        A_NEG = 'A-', 'A-'
        B_POS = 'B+', 'B+'
        B_NEG = 'B-', 'B-'
        AB_POS = 'AB+', 'AB+'
        AB_NEG = 'AB-', 'AB-'
        O_POS = 'O+', 'O+'
        O_NEG = 'O-', 'O-'
        UNKNOWN = 'UNKNOWN', 'غير محدد'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('البريد الإلكتروني'), unique=True)
    username = models.CharField(_('اسم المستخدم'), max_length=150, unique=True)
    
    # ارتباط المستأجر (SaaS Tenant)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        verbose_name="الشركة / المنشأة التابع لها"
    )

    # الدور الوظيفي في النظام
    role = models.CharField(
        max_length=25,
        choices=Role.choices,
        default=Role.COMPANY_ADMIN,
        verbose_name="نوع الحساب / الدور الوظيفي"
    )

    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="رقم المحمول")
    national_id = models.CharField(max_length=14, blank=True, null=True, verbose_name="الرقم القومي (14 رقم)")
    employee_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="الرقم التعريفي الوظيفي")
    job_title = models.CharField(max_length=100, blank=True, null=True, verbose_name="المسمى الوظيفي")
    
    # الملف الطبي الميداني للسلامة
    blood_type = models.CharField(
        max_length=10,
        choices=BloodType.choices,
        default=BloodType.UNKNOWN,
        verbose_name="فصيلة الدم"
    )
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="اسم جهة الاتصال في الطوارئ")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="هاتف جهة الاتصال في الطوارئ")

    is_verified = models.BooleanField(default=False, verbose_name="تم التحقق من الحساب")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="الصورة الشخصية")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = "مستخدم"
        verbose_name_plural = "المستخدمين"
        ordering = ['-date_joined']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        full_name = self.get_full_name() or self.username
        org_name = self.organization.name if self.organization else "منصة سُترة العامة"
        return f"{full_name} ({self.get_role_display()}) - {org_name}"

    @property
    def is_company_admin(self):
        return self.role == self.Role.COMPANY_ADMIN or self.role == self.Role.SUPER_ADMIN

    @property
    def is_safety_officer(self):
        return self.role in [self.Role.SAFETY_OFFICER, self.Role.COMPANY_ADMIN, self.Role.SUPER_ADMIN]

    @property
    def is_medical_staff(self):
        return self.role in [self.Role.MEDICAL_STAFF, self.Role.SAFETY_OFFICER, self.Role.SUPER_ADMIN]

    @property
    def is_hr_manager(self):
        return self.role in [self.Role.HR_MANAGER, self.Role.COMPANY_ADMIN, self.Role.SUPER_ADMIN]
