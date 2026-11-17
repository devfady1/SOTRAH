from datetime import timedelta
from decimal import Decimal

from django.apps import apps
from django.db import connection
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone

from apps.accounts.models import User
from apps.core.models import Organization
from apps.owner_fleet.models import EdgeGateway, PlatformAuditLog, SmartVest, SystemAnnouncement


def get_client_ip(request):
    """استخراج عنوان IP الحقيقي للطلب."""
    if not request:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def record_audit_log(
    *,
    actor=None,
    action,
    target_type,
    target_id,
    target_label,
    metadata=None,
    request=None,
):
    """تسجيل حدث في سجل التدقيق المركزي."""
    return PlatformAuditLog.objects.create(
        actor=actor if (actor and getattr(actor, 'is_authenticated', False)) else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        target_label=str(target_label)[:200],
        metadata=metadata or {},
        ip_address=get_client_ip(request),
    )


def _count_map(queryset, field_name, keys):
    """تحويل نتائج تجميع Django إلى قاموس ثابت يحتوي كل المفاتيح."""
    counts = {key: 0 for key in keys}
    for row in queryset.values(field_name).annotate(total=Count('id')):
        key = row[field_name]
        if key in counts:
            counts[key] = row['total']
    return counts


def _get_revenue_summary():
    """حساب ملخص الفواتير والإيرادات إن كان تطبيق owner_tenants مفعلاً."""
    default_summary = {
        'total_paid_egp': '0.00',
        'pending_egp': '0.00',
        'overdue_egp': '0.00',
        'paid_invoices_count': 0,
        'pending_invoices_count': 0,
        'overdue_invoices_count': 0,
    }
    if not apps.is_installed('apps.owner_tenants'):
        return default_summary

    Invoice = apps.get_model('owner_tenants', 'SubscriptionInvoice')
    agg = Invoice.objects.aggregate(
        total_paid=Sum('amount_egp', filter=Q(status='PAID')),
        total_pending=Sum('amount_egp', filter=Q(status='PENDING')),
        total_overdue=Sum('amount_egp', filter=Q(status='OVERDUE')),
        paid_count=Count('id', filter=Q(status='PAID')),
        pending_count=Count('id', filter=Q(status='PENDING')),
        overdue_count=Count('id', filter=Q(status='OVERDUE')),
    )
    return {
        'total_paid_egp': str((agg['total_paid'] or Decimal('0.00')).quantize(Decimal('0.01'))),
        'pending_egp': str((agg['total_pending'] or Decimal('0.00')).quantize(Decimal('0.01'))),
        'overdue_egp': str((agg['total_overdue'] or Decimal('0.00')).quantize(Decimal('0.01'))),
        'paid_invoices_count': agg['paid_count'] or 0,
        'pending_invoices_count': agg['pending_count'] or 0,
        'overdue_invoices_count': agg['overdue_count'] or 0,
    }


def build_owner_overview():
    """تجميع المؤشرات التنفيذية الشاملة للوحة مالك النظام."""
    org_qs = Organization.objects.all()
    user_qs = User.objects.all()
    vest_qs = SmartVest.objects.all()
    gateway_qs = EdgeGateway.objects.all()

    org_status_counts = _count_map(
        org_qs,
        'subscription_status',
        [choice[0] for choice in Organization.SubscriptionStatus.choices],
    )
    org_tier_counts = _count_map(
        org_qs,
        'subscription_tier',
        [choice[0] for choice in Organization.SubscriptionTier.choices],
    )
    org_industry_counts = _count_map(
        org_qs,
        'industry',
        [choice[0] for choice in Organization.IndustryType.choices],
    )

    user_role_counts = _count_map(
        user_qs,
        'role',
        [choice[0] for choice in User.Role.choices],
    )

    vest_status_counts = _count_map(
        vest_qs,
        'status',
        [choice[0] for choice in SmartVest.Status.choices],
    )
    gateway_status_counts = _count_map(
        gateway_qs,
        'status',
        [choice[0] for choice in EdgeGateway.Status.choices],
    )

    # حساب المنشآت القريبة من استنفاد حدود المستخدمين أو السترات (>= 80%)
    orgs_with_usage = org_qs.filter(is_active=True).annotate(
        users_used=Count('users', distinct=True),
        vests_used=Count(
            'vests',
            filter=~Q(vests__status=SmartVest.Status.DECOMMISSIONED),
            distinct=True,
        ),
    )

    quota_alerts = []
    for org in orgs_with_usage:
        users_pct = round((org.users_used / org.max_users) * 100, 1) if org.max_users else 0
        vests_pct = round((org.vests_used / org.max_vests) * 100, 1) if org.max_vests else 0
        if users_pct >= 80 or vests_pct >= 80:
            quota_alerts.append({
                'organization_id': str(org.id),
                'organization_name': org.name,
                'subscription_tier': org.subscription_tier,
                'users_used': org.users_used,
                'max_users': org.max_users,
                'users_usage_pct': users_pct,
                'vests_used': org.vests_used,
                'max_vests': org.max_vests,
                'vests_usage_pct': vests_pct,
            })

    return {
        'organizations': {
            'total': org_qs.count(),
            'active_accounts': org_qs.filter(is_active=True).count(),
            'inactive_accounts': org_qs.filter(is_active=False).count(),
            'by_status': org_status_counts,
            'by_tier': org_tier_counts,
            'by_industry': org_industry_counts,
        },
        'users': {
            'total': user_qs.count(),
            'active': user_qs.filter(is_active=True).count(),
            'verified': user_qs.filter(is_verified=True).count(),
            'by_role': user_role_counts,
        },
        'vests': {
            'total': vest_qs.count(),
            'by_status': vest_status_counts,
        },
        'gateways': {
            'total': gateway_qs.count(),
            'by_status': gateway_status_counts,
        },
        'revenue': _get_revenue_summary(),
        'active_announcements_count': SystemAnnouncement.objects.filter(is_active=True).count(),
        'quota_alerts': quota_alerts,
    }


def _month_keys(months):
    """إنشاء مفاتيح الشهور مرتبة تصاعدياً بصيغة YYYY-MM."""
    now = timezone.now()
    year = now.year
    month = now.month
    keys = []
    for _ in range(months):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    keys.reverse()
    return keys


def build_growth_analytics(months=6):
    """إعداد السلاسل الزمنية الشهرية لنمو المنشآت والمستخدمين والسترات والإيرادات."""
    months = max(1, min(months, 24))
    keys = _month_keys(months)
    first_year, first_month = map(int, keys[0].split('-'))
    start_dt = timezone.make_aware(
        timezone.datetime(first_year, first_month, 1),
        timezone.get_current_timezone(),
    )

    buckets = {
        key: {
            'month': key,
            'organizations_created': 0,
            'users_created': 0,
            'vests_registered': 0,
            'paid_revenue_egp': '0.00',
        }
        for key in keys
    }

    def _populate_counts(qs, date_field, target_key):
        rows = (
            qs.filter(**{f'{date_field}__gte': start_dt})
            .annotate(m=TruncMonth(date_field))
            .values('m')
            .annotate(total=Count('id'))
        )
        for row in rows:
            if row['m']:
                m_key = row['m'].strftime('%Y-%m')
                if m_key in buckets:
                    buckets[m_key][target_key] = row['total']

    _populate_counts(Organization.objects.all(), 'created_at', 'organizations_created')
    _populate_counts(User.objects.all(), 'created_at', 'users_created')
    _populate_counts(SmartVest.objects.all(), 'created_at', 'vests_registered')

    if apps.is_installed('apps.owner_tenants'):
        Invoice = apps.get_model('owner_tenants', 'SubscriptionInvoice')
        rev_rows = (
            Invoice.objects.filter(status='PAID', paid_at__gte=start_dt)
            .annotate(m=TruncMonth('paid_at'))
            .values('m')
            .annotate(total=Sum('amount_egp'))
        )
        for row in rev_rows:
            if row['m']:
                m_key = row['m'].strftime('%Y-%m')
                if m_key in buckets:
                    amount = (row['total'] or Decimal('0.00')).quantize(Decimal('0.01'))
                    buckets[m_key]['paid_revenue_egp'] = str(amount)

    return [buckets[k] for k in keys]


def build_system_health():
    """فحص الحالة التشغيلية للنظام والبنية التحتية."""
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        db_ok = False

    overdue_invoices = 0
    expiring_trials = 0
    if apps.is_installed('apps.owner_tenants'):
        Invoice = apps.get_model('owner_tenants', 'SubscriptionInvoice')
        TenantSub = apps.get_model('owner_tenants', 'TenantSubscription')
        overdue_invoices = Invoice.objects.filter(status='OVERDUE').count()
        soon = timezone.now() + timedelta(days=7)
        expiring_trials = TenantSub.objects.filter(
            organization__subscription_tier=Organization.SubscriptionTier.FREE_TRIAL,
            expires_at__lte=soon,
            expires_at__gte=timezone.now(),
        ).count()

    return {
        'status': 'healthy' if db_ok else 'degraded',
        'database': 'connected' if db_ok else 'error',
        'offline_gateways_count': EdgeGateway.objects.filter(status=EdgeGateway.Status.OFFLINE).count(),
        'maintenance_vests_count': SmartVest.objects.filter(status=SmartVest.Status.MAINTENANCE).count(),
        'suspended_organizations_count': Organization.objects.filter(
            Q(is_active=False) | Q(subscription_status=Organization.SubscriptionStatus.SUSPENDED)
        ).count(),
        'overdue_invoices_count': overdue_invoices,
        'expiring_trials_7d_count': expiring_trials,
        'server_time': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
    }
