from django.contrib import admin
from apps.owner_fleet.models import (
    EdgeGateway,
    PlatformAuditLog,
    SmartVest,
    SystemAnnouncement,
)


@admin.register(SmartVest)
class SmartVestAdmin(admin.ModelAdmin):
    list_display = ('serial_number', 'mac_address', 'status', 'organization', 'firmware_version', 'battery_health_pct')
    list_filter = ('status', 'hardware_revision', 'firmware_version')
    search_fields = ('serial_number', 'mac_address', 'sim_iccid', 'organization__name')


@admin.register(EdgeGateway)
class EdgeGatewayAdmin(admin.ModelAdmin):
    list_display = ('gateway_uid', 'model_name', 'status', 'organization', 'last_heartbeat_at')
    list_filter = ('status', 'firmware_version')
    search_fields = ('gateway_uid', 'organization__name')


@admin.register(PlatformAuditLog)
class PlatformAuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'target_type', 'target_label', 'actor', 'created_at')
    list_filter = ('action', 'target_type')
    search_fields = ('target_label', 'actor__email')
    readonly_fields = ('id', 'actor', 'action', 'target_type', 'target_id', 'target_label', 'metadata', 'ip_address', 'created_at')


@admin.register(SystemAnnouncement)
class SystemAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'severity', 'target_tier', 'is_active', 'created_at')
    list_filter = ('severity', 'is_active', 'target_tier')
    search_fields = ('title', 'message')
