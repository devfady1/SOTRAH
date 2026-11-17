from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.core.models import Organization
from apps.owner_fleet.models import (
    EdgeGateway,
    PlatformAuditLog,
    SmartVest,
    SystemAnnouncement,
)
from apps.owner_tenants.models import (
    SubscriptionInvoice,
    SubscriptionPlan,
    TenantSubscription,
)


class Command(BaseCommand):
    help = 'تهيئة بيانات تجريبية وحسابات نموذجية لمنظومة سُترة ولوحة مالك النظام (Seed Demo Data)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('بدء تهيئة البيانات التجريبية...'))

        # 1. تهيئة باقات الاشتراك الأساسية
        plans_seed = [
            {
                'tier': Organization.SubscriptionTier.FREE_TRIAL,
                'name_ar': 'الفترة التجريبية',
                'name_en': 'Free Trial',
                'monthly_price_egp': Decimal('0.00'),
                'annual_price_egp': Decimal('0.00'),
                'default_max_vests': 5,
                'default_max_users': 15,
                'trial_days': 14,
                'features': ['تتبع حي للسترات (حتى 5)', 'تنبيهات الطوارئ SOS', 'تقارير حضور أساسية'],
            },
            {
                'tier': Organization.SubscriptionTier.STARTER,
                'name_ar': 'الباقة الأساسية',
                'name_en': 'Starter',
                'monthly_price_egp': Decimal('4500.00'),
                'annual_price_egp': Decimal('45000.00'),
                'default_max_vests': 20,
                'default_max_users': 40,
                'trial_days': 14,
                'features': ['حتى 20 سترة ذكية', 'بوابة حافة محلية واحدة', 'أرشفة سجلات لمدة 6 أشهر'],
            },
            {
                'tier': Organization.SubscriptionTier.PROFESSIONAL,
                'name_ar': 'باقة الأعمال',
                'name_en': 'Professional',
                'monthly_price_egp': Decimal('12000.00'),
                'annual_price_egp': Decimal('120000.00'),
                'default_max_vests': 50,
                'default_max_users': 120,
                'trial_days': 14,
                'features': ['حتى 50 سترة ذكية', 'تعدد المواقع والورديات', 'تكامل HR-ERP كامل'],
            },
            {
                'tier': Organization.SubscriptionTier.ENTERPRISE,
                'name_ar': 'باقة المؤسسات الكبرى',
                'name_en': 'Enterprise',
                'monthly_price_egp': Decimal('28000.00'),
                'annual_price_egp': Decimal('280000.00'),
                'default_max_vests': 200,
                'default_max_users': 500,
                'trial_days': 30,
                'features': ['سترات غير محدودة حسب التعاقد', 'دعم مخصص SLA', 'خوادم معزولة وربط API'],
            },
        ]

        plans_by_tier = {}
        for p_data in plans_seed:
            tier = p_data['tier']
            plan, _ = SubscriptionPlan.objects.get_or_create(tier=tier, defaults=p_data)
            plans_by_tier[tier] = plan

        # 2. إنشاء منشآت نموذجية بحالات مختلفة
        org, created = Organization.objects.get_or_create(
            name='شركة أسيوط الوطنية للبتروكيماويات',
            defaults={
                'industry': Organization.IndustryType.OIL_AND_GAS,
                'subscription_tier': Organization.SubscriptionTier.ENTERPRISE,
                'subscription_status': Organization.SubscriptionStatus.ACTIVE,
                'contact_email': 'contact@asiut-petro.com',
                'contact_phone': '0882345678',
                'max_vests': 50,
                'max_users': 100,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'تم إنشاء المنشأة: {org.name}'))

        org_construction, _ = Organization.objects.get_or_create(
            name='شركة النيل للمقاولات والإنشاءات',
            defaults={
                'industry': Organization.IndustryType.CONSTRUCTION,
                'subscription_tier': Organization.SubscriptionTier.PROFESSIONAL,
                'subscription_status': Organization.SubscriptionStatus.ACTIVE,
                'contact_email': 'hse@nile-const.com',
                'contact_phone': '01011223344',
                'max_vests': 10,
                'max_users': 30,
            },
        )

        org_trial, _ = Organization.objects.get_or_create(
            name='مصنع الصعيد للأسمنت',
            defaults={
                'industry': Organization.IndustryType.MANUFACTURING,
                'subscription_tier': Organization.SubscriptionTier.FREE_TRIAL,
                'subscription_status': Organization.SubscriptionStatus.ACTIVE,
                'contact_email': 'safety@saeed-cement.com',
                'contact_phone': '01199887766',
                'max_vests': 5,
                'max_users': 15,
            },
        )

        now = timezone.now()
        for tenant_org, cycle, exp_days in [
            (org, TenantSubscription.BillingCycle.ANNUAL, 300),
            (org_construction, TenantSubscription.BillingCycle.MONTHLY, 20),
            (org_trial, TenantSubscription.BillingCycle.MONTHLY, 5),
        ]:
            TenantSubscription.objects.get_or_create(
                organization=tenant_org,
                defaults={
                    'plan': plans_by_tier[tenant_org.subscription_tier],
                    'billing_cycle': cycle,
                    'starts_at': now - timedelta(days=10),
                    'expires_at': now + timedelta(days=exp_days),
                },
            )

        # 3. إنشاء المستخدمين بمختلف الأدوار
        demo_users = [
            {
                'email': 'superadmin@sotrah.com',
                'password': 'SuperAdmin123!',
                'first_name': 'فادي',
                'last_name': 'أشرف',
                'role': User.Role.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_verified': True,
                'organization': None,
                'job_title': 'مدير عام المنصة السحابية',
            },
            {
                'email': 'admin@sotrah.com',
                'password': 'SotrahAdmin123!',
                'first_name': 'يوسف',
                'last_name': 'تامر',
                'role': User.Role.COMPANY_ADMIN,
                'is_verified': True,
                'organization': org,
                'job_title': 'المدير التنفيذي للسلامة والتطوير',
                'phone_number': '01128056481',
            },
            {
                'email': 'safety@sotrah.com',
                'password': 'SotrahSafety123!',
                'first_name': 'بيشوي',
                'last_name': 'ميشيل',
                'role': User.Role.SAFETY_OFFICER,
                'is_verified': True,
                'organization': org,
                'job_title': 'كبير مسؤولي السلامة والصحة المهنية (HSE)',
                'phone_number': '01276888293',
            },
            {
                'email': 'doctor@sotrah.com',
                'password': 'SotrahDoctor123!',
                'first_name': 'يوسف',
                'last_name': 'حاتم',
                'role': User.Role.MEDICAL_STAFF,
                'is_verified': True,
                'organization': org,
                'job_title': 'طبيب الموقع والمسعف الميداني',
                'phone_number': '01029895886',
            },
            {
                'email': 'hr@sotrah.com',
                'password': 'SotrahHR123!',
                'first_name': 'أسماء',
                'last_name': 'جمال',
                'role': User.Role.HR_MANAGER,
                'is_verified': True,
                'organization': org,
                'job_title': 'مدير الموارد البشرية والورديات',
                'phone_number': '01026273276',
            },
            {
                'email': 'worker@sotrah.com',
                'password': 'SotrahWorker123!',
                'first_name': 'شهد',
                'last_name': 'ماهر',
                'role': User.Role.WORKER,
                'is_verified': True,
                'organization': org,
                'job_title': 'فني تشغيل ميداني (مرتدي السترة الذكية)',
                'blood_type': User.BloodType.O_POS,
                'phone_number': '01114397767',
            },
        ]

        super_admin_user = None
        for u_data in demo_users:
            email = u_data['email']
            password = u_data.pop('password')
            u_data.setdefault('username', email)
            user, u_created = User.objects.get_or_create(email=email, defaults=u_data)
            if u_created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'تم إنشاء المستخدم: {email} ({user.get_role_display()})'))
            else:
                self.stdout.write(self.style.WARNING(f'المستخدم موجود مسبقاً: {email}'))
            if user.role == User.Role.SUPER_ADMIN:
                super_admin_user = user

        # 4. تهيئة فواتير نموذجية
        SubscriptionInvoice.objects.get_or_create(
            invoice_number='INV-2026-0001',
            defaults={
                'organization': org,
                'plan': plans_by_tier[Organization.SubscriptionTier.ENTERPRISE],
                'amount_egp': Decimal('280000.00'),
                'status': SubscriptionInvoice.Status.PAID,
                'due_date': (now - timedelta(days=5)).date(),
                'paid_at': now - timedelta(days=4),
                'payment_method': SubscriptionInvoice.PaymentMethod.BANK_TRANSFER,
            },
        )
        SubscriptionInvoice.objects.get_or_create(
            invoice_number='INV-2026-0002',
            defaults={
                'organization': org_construction,
                'plan': plans_by_tier[Organization.SubscriptionTier.PROFESSIONAL],
                'amount_egp': Decimal('12000.00'),
                'status': SubscriptionInvoice.Status.PENDING,
                'due_date': (now + timedelta(days=7)).date(),
                'payment_method': SubscriptionInvoice.PaymentMethod.INSTAPAY,
            },
        )

        # 5. تهيئة سترات ذكية وبوابات محلية نموذجية
        vests_seed = [
            ('STR-V2-0001', 'AA:BB:CC:11:22:01', SmartVest.Status.ACTIVE, org, 96),
            ('STR-V2-0002', 'AA:BB:CC:11:22:02', SmartVest.Status.ACTIVE, org, 91),
            ('STR-V2-0003', 'AA:BB:CC:11:22:03', SmartVest.Status.ASSIGNED, org_construction, 98),
            ('STR-V2-0004', 'AA:BB:CC:11:22:04', SmartVest.Status.IN_STOCK, None, 100),
            ('STR-V2-0005', 'AA:BB:CC:11:22:05', SmartVest.Status.IN_STOCK, None, 100),
            ('STR-V2-0006', 'AA:BB:CC:11:22:06', SmartVest.Status.MAINTENANCE, None, 62),
        ]
        for serial, mac, v_status, v_org, bat in vests_seed:
            SmartVest.objects.get_or_create(
                serial_number=serial,
                defaults={
                    'mac_address': mac,
                    'status': v_status,
                    'organization': v_org,
                    'assigned_at': now - timedelta(days=3) if v_org else None,
                    'last_seen_at': now - timedelta(minutes=2) if v_status == SmartVest.Status.ACTIVE else None,
                    'battery_health_pct': bat,
                },
            )

        gateways_seed = [
            ('GW-RPI4-001', EdgeGateway.Status.ONLINE, org),
            ('GW-RPI4-002', EdgeGateway.Status.OFFLINE, org_construction),
            ('GW-RPI4-003', EdgeGateway.Status.IN_STOCK, None),
        ]
        for uid, g_status, g_org in gateways_seed:
            EdgeGateway.objects.get_or_create(
                gateway_uid=uid,
                defaults={
                    'status': g_status,
                    'organization': g_org,
                    'last_heartbeat_at': now - timedelta(seconds=30) if g_status == EdgeGateway.Status.ONLINE else None,
                },
            )

        # 6. إعلان نظام وسجل تدقيق أولي
        SystemAnnouncement.objects.get_or_create(
            title='تحديث فيرموير السترة الذكية v1.2.0',
            defaults={
                'message': 'يرجى التنسيق مع فريق الدعم لتحديث بوابات Raspberry Pi لتحسين استهلاك بطارية ESP32.',
                'severity': SystemAnnouncement.Severity.INFO,
                'is_active': True,
                'created_by': super_admin_user,
            },
        )

        if not PlatformAuditLog.objects.exists():
            PlatformAuditLog.objects.create(
                actor=super_admin_user,
                action='PLATFORM_SEEDED',
                target_type='System',
                target_id='seed_demo_data',
                target_label='تهيئة بيانات المنصة التجريبية',
                metadata={'organizations': 3, 'vests': 6, 'gateways': 3},
            )

        self.stdout.write(self.style.SUCCESS('اكتملت تهيئة الحسابات والبيانات التجريبية بنجاح.'))
