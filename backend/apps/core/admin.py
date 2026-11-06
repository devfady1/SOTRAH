from django.contrib import admin
from apps.core.models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'subscription_tier', 'subscription_status', 'max_vests', 'max_users', 'is_active', 'created_at')
    list_filter = ('industry', 'subscription_tier', 'subscription_status', 'is_active')
    search_fields = ('name', 'contact_email', 'commercial_registration', 'tax_number')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('id', 'created_at', 'updated_at')
