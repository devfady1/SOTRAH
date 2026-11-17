from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.core.models import Organization
from apps.owner_fleet.models import EdgeGateway, PlatformAuditLog, SmartVest
from apps.owner_tenants.models import SubscriptionInvoice, SubscriptionPlan


class OwnerFleetAPITests(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            email='owner2@sotrah.com',
            password='OwnerPassword123!',
            first_name='فادي',
            last_name='أشرف',
            role=User.Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        self.org_active = Organization.objects.create(
            name='مصنع النيل للصلب',
            industry=Organization.IndustryType.MANUFACTURING,
            subscription_tier=Organization.SubscriptionTier.STARTER,
            max_vests=1,
            max_users=10,
            is_active=True,
        )
        self.org_suspended = Organization.objects.create(
            name='شركة معلقة',
            industry=Organization.IndustryType.CONSTRUCTION,
            subscription_tier=Organization.SubscriptionTier.FREE_TRIAL,
            subscription_status=Organization.SubscriptionStatus.SUSPENDED,
            is_active=False,
        )

        self.safety_officer = User.objects.create_user(
            email='hse@nile-steel.com',
            password='SafetyPassword123!',
            first_name='بيشوي',
            last_name='ميشيل',
            role=User.Role.SAFETY_OFFICER,
            organization=self.org_active,
        )

        self.vest1 = SmartVest.objects.create(
            serial_number='STR-TEST-001',
            mac_address='11:22:33:44:55:01',
            status=SmartVest.Status.IN_STOCK,
        )
        self.vest2 = SmartVest.objects.create(
            serial_number='STR-TEST-002',
            mac_address='11:22:33:44:55:02',
            status=SmartVest.Status.IN_STOCK,
        )
        self.gateway = EdgeGateway.objects.create(
            gateway_uid='GW-TEST-001',
            status=EdgeGateway.Status.IN_STOCK,
        )

    def _auth_as(self, user):
        self.client.force_authenticate(user=user)

    def test_overview_requires_super_admin(self):
        url = reverse('owner_fleet:overview')
        self.assertEqual(self.client.get(url).status_code, status.HTTP_401_UNAUTHORIZED)

        self._auth_as(self.safety_officer)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self._auth_as(self.super_admin)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['overview']['organizations']['total'], 2)
        self.assertEqual(res.data['overview']['vests']['total'], 2)

    def test_vest_assign_quota_and_unassign_flow(self):
        self._auth_as(self.super_admin)

        # Cannot assign to suspended org
        assign1_url = reverse('owner_fleet:owner_vests-assign', args=[self.vest1.id])
        res_suspended = self.client.post(
            assign1_url,
            {'organization_id': str(self.org_suspended.id)},
            format='json',
        )
        self.assertEqual(res_suspended.status_code, status.HTTP_400_BAD_REQUEST)

        # Assign vest1 to org_active (max_vests=1)
        res_assign1 = self.client.post(
            assign1_url,
            {'organization_id': str(self.org_active.id)},
            format='json',
        )
        self.assertEqual(res_assign1.status_code, status.HTTP_200_OK)
        self.vest1.refresh_from_db()
        self.assertEqual(self.vest1.organization_id, self.org_active.id)
        self.assertEqual(self.vest1.status, SmartVest.Status.ASSIGNED)

        # Assigning vest2 should fail due to max_vests=1
        assign2_url = reverse('owner_fleet:owner_vests-assign', args=[self.vest2.id])
        res_quota = self.client.post(
            assign2_url,
            {'organization_id': str(self.org_active.id)},
            format='json',
        )
        self.assertEqual(res_quota.status_code, status.HTTP_400_BAD_REQUEST)

        # Overview should now report quota_alerts for org_active (1/1 = 100%)
        overview_res = self.client.get(reverse('owner_fleet:overview'))
        alerts = overview_res.data['overview']['quota_alerts']
        self.assertTrue(any(a['organization_id'] == str(self.org_active.id) for a in alerts))

        # Cannot decommission assigned vest
        del1_url = reverse('owner_fleet:owner_vests-detail', args=[self.vest1.id])
        self.assertEqual(self.client.delete(del1_url).status_code, status.HTTP_400_BAD_REQUEST)

        # Unassign vest1 then decommission
        unassign1_url = reverse('owner_fleet:owner_vests-unassign', args=[self.vest1.id])
        res_unassign = self.client.post(unassign1_url, {}, format='json')
        self.assertEqual(res_unassign.status_code, status.HTTP_200_OK)

        res_del = self.client.delete(del1_url)
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.vest1.refresh_from_db()
        self.assertEqual(self.vest1.status, SmartVest.Status.DECOMMISSIONED)

    def test_gateway_assign_and_unassign(self):
        self._auth_as(self.super_admin)
        assign_url = reverse('owner_fleet:owner_gateways-assign', args=[self.gateway.id])
        res = self.client.post(assign_url, {'organization_id': str(self.org_active.id)}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.gateway.refresh_from_db()
        self.assertEqual(self.gateway.organization_id, self.org_active.id)

        unassign_url = reverse('owner_fleet:owner_gateways-unassign', args=[self.gateway.id])
        res_un = self.client.post(unassign_url, {}, format='json')
        self.assertEqual(res_un.status_code, status.HTTP_200_OK)
        self.gateway.refresh_from_db()
        self.assertIsNone(self.gateway.organization_id)
        self.assertEqual(self.gateway.status, EdgeGateway.Status.IN_STOCK)

    def test_growth_analytics_health_and_announcements(self):
        self._auth_as(self.super_admin)

        plan = SubscriptionPlan.objects.create(
            tier=Organization.SubscriptionTier.STARTER,
            name_ar='أساسية',
            name_en='Starter',
            monthly_price_egp=Decimal('4500.00'),
        )
        SubscriptionInvoice.objects.create(
            organization=self.org_active,
            plan=plan,
            amount_egp=Decimal('4500.00'),
            status=SubscriptionInvoice.Status.PAID,
            due_date=timezone.now().date(),
            paid_at=timezone.now(),
        )

        growth_url = reverse('owner_fleet:growth_analytics')
        res_growth = self.client.get(f'{growth_url}?months=6')
        self.assertEqual(res_growth.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_growth.data['series']), 6)

        res_bad = self.client.get(f'{growth_url}?months=abc')
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        health_res = self.client.get(reverse('owner_fleet:system_health'))
        self.assertEqual(health_res.status_code, status.HTTP_200_OK)
        self.assertEqual(health_res.data['health']['status'], 'healthy')

        ann_url = reverse('owner_fleet:owner_announcements-list')
        res_ann = self.client.post(
            ann_url,
            {'title': 'صيانة مجدولة', 'message': 'تحديث ليلي للسيرفر', 'severity': 'WARNING'},
            format='json',
        )
        self.assertEqual(res_ann.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlatformAuditLog.objects.filter(action='ANNOUNCEMENT_CREATED').exists())
