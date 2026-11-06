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
            'admin': '/admin/',
        }
    })


urlpatterns = [
    path('', api_root_view, name='api_root'),
    path('api/v1/', api_root_view, name='api_v1_root'),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls', namespace='accounts')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
