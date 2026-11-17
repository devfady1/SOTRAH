from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.owner_fleet.views import (
    EdgeGatewayViewSet,
    OwnerGrowthAnalyticsView,
    OwnerOverviewView,
    OwnerSystemHealthView,
    PlatformAuditLogViewSet,
    SmartVestViewSet,
    SystemAnnouncementViewSet,
)

app_name = 'owner_fleet'

router = DefaultRouter()
router.register(r'vests', SmartVestViewSet, basename='owner_vests')
router.register(r'gateways', EdgeGatewayViewSet, basename='owner_gateways')
router.register(r'audit-logs', PlatformAuditLogViewSet, basename='owner_audit_logs')
router.register(r'announcements', SystemAnnouncementViewSet, basename='owner_announcements')

urlpatterns = [
    path('overview/', OwnerOverviewView.as_view(), name='overview'),
    path('analytics/growth/', OwnerGrowthAnalyticsView.as_view(), name='growth_analytics'),
    path('health/', OwnerSystemHealthView.as_view(), name='system_health'),
    path('', include(router.urls)),
]
