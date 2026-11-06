import uuid
from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    """
    نموذج أساسي مجرد يضيف حقلي تاريخ الإنشاء وتاريخ آخر تعديل تلقائياً.
    Abstract base model that provides self-updating created_at and updated_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاريخ التحديث")

    class Meta:
        abstract = True


class Organization(TimeStampedModel):
    """
    نموذج المنشأة / الشركة (SaaS Tenant).
    يمثل كل مستأجر (Tenant) في النظام مع خطة الاشتراك ومحددات الموارد.
    """
    class IndustryType(models.TextChoices):
        CONSTRUCTION = 'CONSTRUCTION', 'المقاولات والتشييد'
        MANUFACTURING = 'MANUFACTURING', 'المصانع والإنتاج'
        OIL_AND_GAS = 'OIL_AND_GAS', 'البترول والغاز الطبيعي'
        MINING = 'MINING', 'التعدين والمحاجر'
        LOGISTICS = 'LOGISTICS', 'اللوجستيات والموانئ'
        HEALTHCARE = 'HEALTHCARE', 'الرعاية الصحية والمستشفيات'
        OTHER = 'OTHER', 'قطاعات أخرى'

    class SubscriptionTier(models.TextChoices):
        FREE_TRIAL = 'FREE_TRIAL', 'فترة تجريبية (Trial)'
        STARTER = 'STARTER', 'الباقة الأساسية (Starter)'
        PROFESSIONAL = 'PROFESSIONAL', 'باقة الأعمال (Professional)'
        ENTERPRISE = 'ENTERPRISE', 'المؤسسات الكبرى (Enterprise)'

    class SubscriptionStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'نشط'
        SUSPENDED = 'SUSPENDED', 'معلق'
        EXPIRED = 'EXPIRED', 'منتهي'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name="اسم الشركة / المنشأة")
    slug = models.SlugField(max_length=220, unique=True, blank=True, verbose_name="المعرف اللطيف (Slug)")
    
    industry = models.CharField(
        max_length=30,
        choices=IndustryType.choices,
        default=IndustryType.MANUFACTURING,
        verbose_name="القطاع الصناعي"
    )
    
    commercial_registration = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="رقم السجل التجاري"
    )
    tax_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="الرقم الضريبي"
    )
    
    # تفاصيل الاشتراك في منصة سُترة كـ SaaS
    subscription_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE_TRIAL,
        verbose_name="خطة الاشتراك"
    )
    subscription_status = models.CharField(
        max_length=20,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.ACTIVE,
        verbose_name="حالة الاشتراك"
    )
    
    max_vests = models.PositiveIntegerField(default=5, verbose_name="الحد الأقصى للسترات الذكية المسموحة")
    max_users = models.PositiveIntegerField(default=15, verbose_name="الحد الأقصى للمستخدمين المسموح")
    
    # بيانات التواصل والمقر
    contact_email = models.EmailField(blank=True, null=True, verbose_name="بريد التواصل الرسمي")
    contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="رقم الهاتف")
    address = models.TextField(blank=True, null=True, verbose_name="العنوان والمقر الرئيسي")
    
    is_active = models.BooleanField(default=True, verbose_name="الحساب نشط")

    class Meta:
        verbose_name = "منشأة / شركة (Tenant)"
        verbose_name_plural = "المنشآت والشركات (Tenants)"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name, allow_unicode=True) or str(self.id)[:8]
            slug = base_slug
            counter = 1
            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_subscription_tier_display()})"
