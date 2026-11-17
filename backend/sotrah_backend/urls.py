from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static


def api_root_view(request):
    return JsonResponse({
        'platform': 'سُترة (SOTRAH) - Medical HR-ERP & Wearable Safety Platform',
        'domain': 'sotrah.com',
        'version': 'v1.0.0',
        'status': 'healthy',
        'endpoints': {
            'register': '/api/v1/auth/register/',
            'login': '/api/v1/auth/login/',
            'token_refresh': '/api/v1/auth/refresh/',
            'current_user': '/api/v1/auth/me/',
            'user_roles': '/api/v1/auth/roles/',
            'industries': '/api/v1/auth/industries/',
            'owner_overview': '/api/v1/owner/overview/',
            'owner_organizations': '/api/v1/owner/organizations/',
            'owner_plans': '/api/v1/owner/plans/',
            'owner_invoices': '/api/v1/owner/invoices/',
            'owner_users': '/api/v1/owner/users/',
            'owner_vests': '/api/v1/owner/vests/',
            'owner_gateways': '/api/v1/owner/gateways/',
            'owner_audit_logs': '/api/v1/owner/audit-logs/',
            'owner_announcements': '/api/v1/owner/announcements/',
            'owner_health': '/api/v1/owner/health/',
            'admin': '/admin/',
        }
    })


urlpatterns = [
    path('', api_root_view, name='api_root'),
    path('api/v1/', api_root_view, name='api_v1_root'),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls', namespace='accounts')),
    path('api/v1/owner/', include('apps.owner_tenants.urls', namespace='owner_tenants')),
    path('api/v1/owner/', include('apps.owner_fleet.urls', namespace='owner_fleet')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
