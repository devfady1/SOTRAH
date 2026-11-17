from datetime import timedelta
from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.core.models import Organization
from apps.owner_fleet.models import PlatformAuditLog
from apps.owner_tenants.models import (
    SubscriptionInvoice,
    SubscriptionPlan,
    TenantSubscription,
)


class OwnerTenantsAPITests(APITestCase):
    def setUp(self):
        self.plan_trial = SubscriptionPlan.objects.create(
            tier=Organization.SubscriptionTier.FREE_TRIAL,
            name_ar='تجريبية',
            name_en='Trial',
            monthly_price_egp=Decimal('0.00'),
            annual_price_egp=Decimal('0.00'),
            default_max_vests=5,
            default_max_users=10,
            trial_days=14,
        )
        self.plan_pro = SubscriptionPlan.objects.create(
            tier=Organization.SubscriptionTier.PROFESSIONAL,
            name_ar='أعمال',
            name_en='Pro',
            monthly_price_egp=Decimal('12000.00'),
            annual_price_egp=Decimal('120000.00'),
            default_max_vests=50,
            default_max_users=100,
        )

        self.super_admin = User.objects.create_user(
            email='owner@sotrah.com',
            password='OwnerPassword123!',
            first_name='فادي',
            last_name='أشرف',
            role=User.Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        self.org = Organization.objects.create(
            name='شركة أسيوط التجريبية',
            industry=Organization.IndustryType.MANUFACTURING,
            subscription_tier=Organization.SubscriptionTier.FREE_TRIAL,
            max_vests=5,
            max_users=2,
        )
        self.company_admin = User.objects.create_user(
            email='cadmin@org.com',
            password='AdminPassword123!',
            first_name='يوسف',
            last_name='تامر',
            role=User.Role.COMPANY_ADMIN,
            organization=self.org,
        )

    def _auth_as(self, user):
        self.client.force_authenticate(user=user)

    def test_permissions_block_non_super_admin(self):
        url = reverse('owner_tenants:owner_organizations-list')

        res_anon = self.client.get(url)
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth_as(self.company_admin)
        res_company = self.client.get(url)
        self.assertEqual(res_company.status_code, status.HTTP_403_FORBIDDEN)

        self._auth_as(self.super_admin)
        res_owner = self.client.get(url)
        self.assertEqual(res_owner.status_code, status.HTTP_200_OK)

    def test_create_organization_with_admin_atomically(self):
        self._auth_as(self.super_admin)
        url = reverse('owner_tenants:owner_organizations-list')
        payload = {
            'name': 'شركة الدلتا للبتروكيماويات',
            'industry': Organization.IndustryType.OIL_AND_GAS,
            'subscription_tier': Organization.SubscriptionTier.PROFESSIONAL,
            'billing_cycle': TenantSubscription.BillingCycle.ANNUAL,
            'admin_first_name': 'أحمد',
            'admin_last_name': 'محمود',
            'admin_email': 'ahmed@delta-petro.com',
            'admin_password': 'StrongPassword123!',
        }
        res = self.client.post(url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['organization']['max_vests'], 50)
        self.assertEqual(res.data['admin_user']['role'], User.Role.COMPANY_ADMIN)
        self.assertTrue(PlatformAuditLog.objects.filter(action='ORG_CREATED').exists())

    def test_suspend_and_activate_organization(self):
        self._auth_as(self.super_admin)
        TenantSubscription.objects.create(
            organization=self.org,
            plan=self.plan_trial,
            expires_at=timezone.now() + timedelta(days=10),
        )
        url = reverse('owner_tenants:owner_organizations-change-status', args=[self.org.id])

        res_suspend = self.client.post(url, {'action': 'suspend', 'reason': 'تأخر السداد'}, format='json')
        self.assertEqual(res_suspend.status_code, status.HTTP_200_OK)
        self.org.refresh_from_db()
        self.assertFalse(self.org.is_active)
        self.assertEqual(self.org.subscription_status, Organization.SubscriptionStatus.SUSPENDED)

        res_activate = self.client.post(url, {'action': 'activate'}, format='json')
        self.assertEqual(res_activate.status_code, status.HTTP_200_OK)
        self.org.refresh_from_db()
        self.assertTrue(self.org.is_active)
        self.assertEqual(self.org.subscription_status, Organization.SubscriptionStatus.ACTIVE)

    def test_cannot_reduce_max_users_below_existing_users(self):
        self._auth_as(self.super_admin)
        User.objects.create_user(
            email='worker1@org.com',
            password='WorkerPassword123!',
            first_name='عامل',
            last_name='واحد',
            role=User.Role.WORKER,
            organization=self.org,
        )
        url = reverse('owner_tenants:owner_organizations-detail', args=[self.org.id])
        res = self.client.patch(url, {'max_users': 1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invoice_create_and_mark_paid_extends_subscription(self):
        self._auth_as(self.super_admin)
        initial_expiry = timezone.now() + timedelta(days=2)
        sub = TenantSubscription.objects.create(
            organization=self.org,
            plan=self.plan_trial,
            billing_cycle=TenantSubscription.BillingCycle.MONTHLY,
            expires_at=initial_expiry,
        )

        create_url = reverse('owner_tenants:owner_invoices-list')
        res_create = self.client.post(
            create_url,
            {
                'organization': str(self.org.id),
                'plan': str(self.plan_pro.id),
                'amount_egp': '12000.00',
                'due_date': (timezone.now() + timedelta(days=5)).date().isoformat(),
            },
            format='json',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        inv_id = res_create.data['id']

        pay_url = reverse('owner_tenants:owner_invoices-mark-paid', args=[inv_id])
        res_pay = self.client.post(pay_url, {'payment_method': SubscriptionInvoice.PaymentMethod.INSTAPAY}, format='json')
        self.assertEqual(res_pay.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pay.data['invoice']['status'], SubscriptionInvoice.Status.PAID)

        sub.refresh_from_db()
        self.assertEqual(sub.plan_id, self.plan_pro.id)
        self.assertGreater(sub.expires_at, initial_expiry + timedelta(days=25))

        # رفض تأكيد السداد مرتين
        res_pay_again = self.client.post(pay_url, {}, format='json')
        self.assertEqual(res_pay_again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_quota_and_super_admin_self_protection(self):
        self._auth_as(self.super_admin)
        users_url = reverse('owner_tenants:owner_users-list')

        # self.org.max_users == 2, currently 1 user (company_admin)
        res_ok = self.client.post(
            users_url,
            {
                'email': 'hse@org.com',
                'first_name': 'بيشوي',
                'last_name': 'ميشيل',
                'password': 'StrongPassword123!',
                'role': User.Role.SAFETY_OFFICER,
                'organization_id': str(self.org.id),
            },
            format='json',
        )
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # Exceeding max_users (now 2/2)
        res_limit = self.client.post(
            users_url,
            {
                'email': 'extra@org.com',
                'first_name': 'extra',
                'last_name': 'user',
                'password': 'StrongPassword123!',
                'role': User.Role.WORKER,
                'organization_id': str(self.org.id),
            },
            format='json',
        )
        self.assertEqual(res_limit.status_code, status.HTTP_400_BAD_REQUEST)

        # Self deactivation forbidden
        me_owner_url = reverse('owner_tenants:owner_users-detail', args=[self.super_admin.id])
        res_self = self.client.patch(me_owner_url, {'is_active': False}, format='json')
        self.assertEqual(res_self.status_code, status.HTTP_400_BAD_REQUEST)
