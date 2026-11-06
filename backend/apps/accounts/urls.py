from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import (
    RegisterView,
    LoginView,
    MeView,
    UserRolesListView,
    OrganizationIndustriesListView,
)

app_name = 'accounts'

urlpatterns = [
    # المصادقة والحسابات الأساسية
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='current_user'),

    # استعراض الخيارات للواجهات الأمامية
    path('roles/', UserRolesListView.as_view(), name='roles_list'),
    path('industries/', OrganizationIndustriesListView.as_view(), name='industries_list'),
]
