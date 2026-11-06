from django.core.management.base import BaseCommand
from apps.core.models import Organization
from apps.accounts.models import User


class Command(BaseCommand):
    help = 'تهيئة بيانات تجريبية وحسابات نموذجية لمنظومة سُترة (Seed Demo Data)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('بدء تهيئة البيانات التجريبية...'))

        # 1. إنشاء شركة تجريبية
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
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'تم إنشاء المنشأة: {org.name}'))

        # 2. إنشاء المستخدمين بمختلف الأدوار
        demo_users = [
            {
                'email': 'superadmin@sotrah.com',
                'password': 'SuperAdmin123!',
                'first_name': 'فادي',
                'last_name': 'أشرف',
                'role': User.Role.SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'organization': None,
                'job_title': 'مدير عام المنصة السحابية',
            },
            {
                'email': 'admin@sotrah.com',
                'password': 'SotrahAdmin123!',
                'first_name': 'يوسف',
                'last_name': 'تامر',
                'role': User.Role.COMPANY_ADMIN,
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
                'organization': org,
                'job_title': 'فني تشغيل ميداني (مرتدي السترة الذكية)',
                'blood_type': User.BloodType.O_POS,
                'phone_number': '01114397767',
            },
        ]

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

        self.stdout.write(self.style.SUCCESS('اكتملت تهيئة الحسابات التجريبية بنجاح.'))
