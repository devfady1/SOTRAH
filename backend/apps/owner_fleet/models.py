import uuid
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from apps.core.models import Organization, TimeStampedModel


class SmartVest(TimeStampedModel):
    """
    نموذج السترة الذكية في مخزون المنصة السحابية (Hardware Fleet Inventory).
    يتتبع حالة التصنيع، التخصيص للمنشآت، والصيانة.
    """

    class Status(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'في المخزون (جاهزة للتخصيص)'
        ASSIGNED = 'ASSIGNED', 'مخصصة لمنشأة'
        ACTIVE = 'ACTIVE', 'نشطة في الميدان'
        MAINTENANCE = 'MAINTENANCE', 'في الصيانة'
        DECOMMISSIONED = 'DECOMMISSIONED', 'خارجة من الخدمة'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    serial_number = models.CharField(max_length=64, unique=True, verbose_name="الرقم التسلسلي للسترة")
    mac_address = models.CharField(max_length=32, unique=True, verbose_name="عنوان MAC لوحدة ESP32")
    sim_iccid = models.CharField(max_length=32, blank=True, null=True, verbose_name="معرف شريحة SIM7000G")
    hardware_revision = models.CharField(max_length=30, default='REV-2.0', verbose_name="إصدار العتاد")
    firmware_version = models.CharField(max_length=30, default='1.0.0', verbose_name="إصدار الفيرموير")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_STOCK,
        db_index=True,
        verbose_name="حالة السترة",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vests',
        verbose_name="المنشأة المخصصة لها",
    )
    assigned_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ التخصيص")
    last_seen_at = models.DateTimeField(null=True, blank=True, verbose_name="آخر اتصال")
    battery_health_pct = models.PositiveSmallIntegerField(
        default=100,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="صحة البطارية (%)",
    )
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات")

    class Meta:
        verbose_name = "سترة ذكية"
        verbose_name_plural = "السترات الذكية (Smart Vests)"
        ordering = ['-created_at']

    def __str__(self):
        org_name = self.organization.name if self.organization else 'المخزون المركزي'
        return f"{self.serial_number} ({self.get_status_display()}) - {org_name}"


class EdgeGateway(TimeStampedModel):
    """
    نموذج بوابة الحافة المحلية (Raspberry Pi 4 Local MQTT Gateway).
    """

    class Status(models.TextChoices):
        IN_STOCK = 'IN_STOCK', 'في المخزون'
        ONLINE = 'ONLINE', 'متصلة (Online)'
        OFFLINE = 'OFFLINE', 'غير متصلة (Offline)'
        MAINTENANCE = 'MAINTENANCE', 'في الصيانة'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gateway_uid = models.CharField(max_length=64, unique=True, verbose_name="المعرف الفريد للبوابة")
    model_name = models.CharField(
        max_length=80,
        default='Raspberry Pi 4 Model B (4GB)',
        verbose_name="طراز البوابة",
    )
    firmware_version = models.CharField(max_length=30, default='1.0.0', verbose_name="إصدار النظام")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_STOCK,
        db_index=True,
        verbose_name="حالة البوابة",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='gateways',
        verbose_name="المنشأة المرتبطة",
    )
    last_heartbeat_at = models.DateTimeField(null=True, blank=True, verbose_name="آخر نبضة اتصال")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")
    notes = models.TextField(blank=True, null=True, verbose_name="ملاحظات")

    class Meta:
        verbose_name = "بوابة محلية (Edge Gateway)"
        verbose_name_plural = "البوابات المحلية (Edge Gateways)"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.gateway_uid} ({self.get_status_display()})"


class PlatformAuditLog(models.Model):
    """
    سجل تدقيق عمليات مالك النظام (Platform Audit Trail).
    يوثق كل التغييرات الإدارية الحساسة على المنصة.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owner_audit_logs',
        verbose_name="المنفذ",
    )
    action = models.CharField(max_length=80, db_index=True, verbose_name="نوع العملية")
    target_type = models.CharField(max_length=50, db_index=True, verbose_name="نوع الهدف")
    target_id = models.CharField(max_length=64, verbose_name="معرف الهدف")
    target_label = models.CharField(max_length=200, verbose_name="وصف الهدف")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="تفاصيل إضافية")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="عنوان IP")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="وقت التنفيذ")

    class Meta:
        verbose_name = "سجل تدقيق"
        verbose_name_plural = "سجلات التدقيق (Audit Logs)"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.action}] {self.target_type}: {self.target_label}"


class SystemAnnouncement(TimeStampedModel):
    """
    إعلانات وبلاغات المنصة من مالك النظام إلى المنشآت.
    """

    class Severity(models.TextChoices):
        INFO = 'INFO', 'معلومة (Info)'
        WARNING = 'WARNING', 'تنبيه (Warning)'
        CRITICAL = 'CRITICAL', 'حرج (Critical)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, verbose_name="عنوان الإعلان")
    message = models.TextField(verbose_name="نص الإعلان")
    severity = models.CharField(
        max_length=15,
        choices=Severity.choices,
        default=Severity.INFO,
        verbose_name="مستوى الأهمية",
    )
    target_tier = models.CharField(
        max_length=20,
        choices=Organization.SubscriptionTier.choices,
        blank=True,
        null=True,
        verbose_name="الباقة المستهدفة (اختياري)",
    )
    is_active = models.BooleanField(default=True, verbose_name="نشط")
    starts_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ البدء")
    ends_at = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الانتهاء")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_announcements',
        verbose_name="أنشئ بواسطة",
    )

    class Meta:
        verbose_name = "إعلان نظام"
        verbose_name_plural = "إعلانات النظام (Announcements)"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"
