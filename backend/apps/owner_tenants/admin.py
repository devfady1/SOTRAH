from django.contrib import admin
from apps.owner_tenants.models import (
    SubscriptionInvoice,
    SubscriptionPlan,
    TenantSubscription,
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('tier', 'name_ar', 'monthly_price_egp', 'annual_price_egp', 'default_max_vests', 'default_max_users', 'is_active')
    list_filter = ('is_active',)


@admin.register(TenantSubscription)
class TenantSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'billing_cycle', 'starts_at', 'expires_at', 'auto_renew')
    list_filter = ('billing_cycle', 'auto_renew', 'plan')
    search_fields = ('organization__name',)


@admin.register(SubscriptionInvoice)
class SubscriptionInvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'organization', 'plan', 'amount_egp', 'status', 'due_date', 'paid_at')
    list_filter = ('status', 'payment_method', 'plan')
    search_fields = ('invoice_number', 'organization__name')
