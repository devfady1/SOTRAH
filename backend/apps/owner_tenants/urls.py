from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.owner_tenants.views import (
    OwnerOrganizationViewSet,
    OwnerUserViewSet,
    SubscriptionInvoiceViewSet,
    SubscriptionPlanViewSet,
)

app_name = 'owner_tenants'

router = DefaultRouter()
router.register(r'organizations', OwnerOrganizationViewSet, basename='owner_organizations')
router.register(r'plans', SubscriptionPlanViewSet, basename='owner_plans')
router.register(r'invoices', SubscriptionInvoiceViewSet, basename='owner_invoices')
router.register(r'users', OwnerUserViewSet, basename='owner_users')

urlpatterns = [
    path('', include(router.urls)),
]
