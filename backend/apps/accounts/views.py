from rest_framework import status, views, permissions, generics
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.models import User
from apps.core.models import Organization
from apps.accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    OrganizationSummarySerializer,
)


def get_tokens_for_user(user):
    """
    توليد توكنات JWT (Access & Refresh) للمستخدم.
    """
    refresh = RefreshToken.for_user(user)
    # إضافة بيانات مخصصة داخل التوكن لتسريع فحص الصلاحيات في الفرونت إند
    refresh['email'] = user.email
    refresh['role'] = user.role
    refresh['org_id'] = str(user.organization.id) if user.organization else None
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(views.APIView):
    """
    API إنشاء حساب جديد (Registration Endpoint).
    
    POST /api/v1/auth/register/
    ينشئ حساب المستخدم الجديد مع الشركة / المنشأة (SaaS Tenant)
    ويعيد التوكنات (JWT) ومعلومات المستخدم فوراً.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'success': True,
                'message': 'تم إنشاء الحساب والمنشأة بنجاح ومرحباً بك في سُترة.',
                'tokens': tokens,
                'user': user_data,
            }, status=status.HTTP_201_CREATED)

        return Response({
            'success': False,
            'message': 'تعذر إنشاء الحساب، يرجى مراجعة البيانات المدخلة.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    """
    API تسجيل الدخول (Login Endpoint).
    
    POST /api/v1/auth/login/
    يتحقق من البريد الإلكتروني أو اسم المستخدم وكلمة المرور،
    ويعيد توكنات الـ JWT وبيانات المستخدم والمنشأة.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data

            return Response({
                'success': True,
                'message': 'تم تسجيل الدخول بنجاح.',
                'tokens': tokens,
                'user': user_data,
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'message': 'فشل تسجيل الدخول.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class MeView(views.APIView):
    """
    API استعراض وتحديث بيانات المستخدم الحالي المسجل دخوله.
    
    GET /api/v1/auth/me/
    PATCH /api/v1/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'user': serializer.data,
        })

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'تم تحديث البيانات بنجاح.',
                'user': serializer.data,
            })
        return Response({
            'success': False,
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class UserRolesListView(views.APIView):
    """
    API يعرض قائمة أنواع المستخدمين والأدوار المتاحة في منظومة سُترة.
    
    GET /api/v1/auth/roles/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        roles = [
            {'code': code, 'label': label}
            for code, label in User.Role.choices
        ]
        return Response({
            'success': True,
            'roles': roles,
        })


class OrganizationIndustriesListView(views.APIView):
    """
    API يعرض قائمة القطاعات الصناعية المتاحة عند تسجيل منشأة جديدة.
    
    GET /api/v1/auth/industries/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        industries = [
            {'code': code, 'label': label}
            for code, label in Organization.IndustryType.choices
        ]
        return Response({
            'success': True,
            'industries': industries,
        })
