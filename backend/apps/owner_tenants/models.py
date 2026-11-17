import uuid
from django.db import models
from django.utils import timezone
from apps.core.models import Organization, TimeStampedModel


class SubscriptionPlan(TimeStampedModel):
    """
    خطط الاشتراك المتاحة على منصة سُترة السحابية (SaaS Pricing Tiers).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tier = models.CharField(
        max_length=20,
        choices=Organization.SubscriptionTier.choices,
        unique=True,
        verbose_name="كود الباقة",
    )
    name_ar = models.CharField(max_length=120, verbose_name="اسم الباقة بالعربية")
    name_en = models.CharField(max_length=120, verbose_name="اسم الباقة بالإنجليزية")
    monthly_price_egp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="السعر الشهري (ج.م)",
    )
    annual_price_egp = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="السعر السنوي (ج.م)",
    )
    default_max_vests = models.PositiveIntegerField(default=5, verbose_name="الحد الافتراضي للسترات")
    default_max_users = models.PositiveIntegerField(default=15, verbose_name="الحد الافتراضي للمستخدمين")
    trial_days = models.PositiveIntegerField(default=14, verbose_name="أيام الفترة التجريبية")
    features = models.JSONField(default=list, blank=True, verbose_name="مزايا الباقة")
    is_active = models.BooleanField(default=True, verbose_name="متاحة للاشتراك")

    class Meta:
        verbose_name = "باقة اشتراك"
        verbose_name_plural = "باقات الاشتراك (Subscription Plans)"
        ordering = ['monthly_price_egp']

    def __str__(self):
        return f"{self.name_ar} ({self.tier})"


class TenantSubscription(TimeStampedModel):
    """
    ملف اشتراك المنشأة وتفاصيل التجديد والتعليق.
    """

    class BillingCycle(models.TextChoices):
        MONTHLY = 'MONTHLY', 'شهري'
        ANNUAL = 'ANNUAL', 'سنوي'
        CUSTOM = 'CUSTOM', 'مخصص'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='subscription_profile',
        verbose_name="المنشأة",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscriptions',
        verbose_name="الباقة",
    )
    billing_cycle = models.CharField(
        max_length=15,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
        verbose_name="دورة الفوترة",
    )
    starts_at = models.DateTimeField(default=timezone.now, verbose_name="تاريخ البدء")
    expires_at = models.DateTimeField(verbose_name="تاريخ الانتهاء")
    auto_renew = models.BooleanField(default=True, verbose_name="تجديد تلقائي")
    suspension_reason = models.TextField(blank=True, null=True, verbose_name="سبب التعليق")
    suspended_at = models.DateTimeField(blank=True, null=True, verbose_name="تاريخ التعليق")

    class Meta:
        verbose_name = "اشتراك منشأة"
        verbose_name_plural = "اشتراكات المنشآت (Tenant Subscriptions)"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization.name} -> {self.plan.tier}"


class SubscriptionInvoice(TimeStampedModel):
    """
    فواتير اشتراكات المنشآت ومتابعة التحصيل المالي.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'قيد الانتظار'
        PAID = 'PAID', 'مدفوعة'
        OVERDUE = 'OVERDUE', 'متأخرة'
        CANCELLED = 'CANCELLED', 'ملغاة'

    class PaymentMethod(models.TextChoices):
        BANK_TRANSFER = 'BANK_TRANSFER', 'تحويل بنكي'
        INSTAPAY = 'INSTAPAY', 'إنستاباي (InstaPay)'
        CARD = 'CARD', 'بطاقة بنكية'
        CASH = 'CASH', 'نقدي'
        OTHER = 'OTHER', 'أخرى'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=40, unique=True, blank=True, verbose_name="رقم الفاتورة")
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invoices',
        verbose_name="المنشأة",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='invoices',
        verbose_name="الباقة",
    )
    amount_egp = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="المبلغ (ج.م)")
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
        verbose_name="حالة الفاتورة",
    )
    due_date = models.DateField(verbose_name="تاريخ الاستحقاق")
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name="تاريخ السداد")
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER,
        verbose_name="طريقة الدفع",
    )
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات")

    class Meta:
        verbose_name = "فاتورة اشتراك"
        verbose_name_plural = "فواتير الاشتراكات (Invoices)"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = timezone.now().year
            prefix = f"INV-{year}-"
            last_inv = (
                SubscriptionInvoice.objects.filter(invoice_number__startswith=prefix)
                .order_by('-invoice_number')
                .values_list('invoice_number', flat=True)
                .first()
            )
            seq = 1
            if last_inv:
                try:
                    seq = int(last_inv.split('-')[-1]) + 1
                except ValueError:
                    seq = SubscriptionInvoice.objects.count() + 1
            self.invoice_number = f"{prefix}{seq:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.organization.name} ({self.amount_egp} EGP)"
