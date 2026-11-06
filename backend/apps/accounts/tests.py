from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.core.models import Organization


class AuthAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.login_url = reverse('accounts:login')
        self.me_url = reverse('accounts:current_user')
        self.roles_url = reverse('accounts:roles_list')
        self.industries_url = reverse('accounts:industries_list')

    def test_register_new_organization_and_admin(self):
        """اختبار إنشاء حساب شركة ومسؤول جديد بنجاح"""
        payload = {
            'first_name': 'فادي',
            'last_name': 'أشرف',
            'email': 'fady@sotrah.com',
            'phone_number': '01069476417',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'create_organization': True,
            'organization_name': 'شركة أسيوط للصناعات المتطورة',
            'organization_industry': Organization.IndustryType.MANUFACTURING,
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], 'fady@sotrah.com')
        self.assertEqual(response.data['user']['role'], User.Role.COMPANY_ADMIN)
        self.assertEqual(response.data['user']['organization']['name'], 'شركة أسيوط للصناعات المتطورة')

    def test_register_password_mismatch(self):
        """اختبار فشل التسجيل عند عدم تطابق كلمتي المرور"""
        payload = {
            'first_name': 'أحمد',
            'last_name': 'علي',
            'email': 'ahmed@sotrah.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'DifferentPassword123!',
            'create_organization': True,
            'organization_name': 'شركة البناء الحديث',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('password_confirm', response.data['errors'])

    def test_login_successful(self):
        """اختبار تسجيل الدخول بالبريد الإلكتروني وتوليد التوكنات"""
        org = Organization.objects.create(name='شركة النيل للمقاولات')
        user = User.objects.create_user(
            email='user@sotrah.com',
            password='TestPassword123!',
            first_name='يوسف',
            last_name='تامر',
            organization=org,
            role=User.Role.SAFETY_OFFICER
        )

        payload = {
            'email': 'user@sotrah.com',
            'password': 'TestPassword123!',
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['role'], User.Role.SAFETY_OFFICER)

    def test_login_invalid_credentials(self):
        """اختبار فشل الدخول عند إدخال كلمة مرور خاطئة"""
        payload = {
            'email': 'nonexistent@sotrah.com',
            'password': 'WrongPassword!',
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_get_current_user_me(self):
        """اختبار الحصول على بيانات المستخدم المصرح له عبر التوكن"""
        org = Organization.objects.create(name='مصنع السويس للأسمدة')
        user = User.objects.create_user(
            email='doctor@sotrah.com',
            password='TestPassword123!',
            first_name='بيشوي',
            last_name='ميشيل',
            organization=org,
            role=User.Role.MEDICAL_STAFF
        )

        # استدعاء بدون توثيق
        unauth_response = self.client.get(self.me_url)
        self.assertEqual(unauth_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # تسجيل الدخول وتوثيق الطلب بالتوكن
        login_res = self.client.post(self.login_url, {'email': 'doctor@sotrah.com', 'password': 'TestPassword123!'})
        access_token = login_res.data['tokens']['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        auth_response = self.client.get(self.me_url)
        self.assertEqual(auth_response.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_response.data['user']['role'], User.Role.MEDICAL_STAFF)

    def test_roles_and_industries_endpoints(self):
        """اختبار استرجاع قائمة الأدوار والقطاعات الصناعية"""
        roles_res = self.client.get(self.roles_url)
        self.assertEqual(roles_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(roles_res.data['roles']) >= 7)

        ind_res = self.client.get(self.industries_url)
        self.assertEqual(ind_res.status_code, status.HTTP_200_OK)
        self.assertTrue(len(ind_res.data['industries']) >= 6)
