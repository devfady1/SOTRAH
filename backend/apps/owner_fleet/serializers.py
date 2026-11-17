from rest_framework import serializers
from apps.core.models import Organization
from apps.owner_fleet.models import (
    EdgeGateway,
    PlatformAuditLog,
    SmartVest,
    SystemAnnouncement,
)


class SmartVestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, default=None)

    class Meta:
        model = SmartVest
        fields = [
            'id',
            'serial_number',
            'mac_address',
            'sim_iccid',
            'hardware_revision',
            'firmware_version',
            'status',
            'status_display',
            'organization',
            'organization_name',
            'assigned_at',
            'last_seen_at',
            'battery_health_pct',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'assigned_at', 'last_seen_at', 'created_at', 'updated_at']

    def validate_serial_number(self, value):
        return value.strip().upper()

    def validate_mac_address(self, value):
        return value.strip().upper()


class HardwareAssignSerializer(serializers.Serializer):
    """سيريالايزر تخصيص السترة أو البوابة لمنشأة محددة."""
    organization_id = serializers.UUIDField(required=True)


class VestUnassignSerializer(serializers.Serializer):
    target_status = serializers.ChoiceField(
        choices=[SmartVest.Status.IN_STOCK, SmartVest.Status.MAINTENANCE],
        default=SmartVest.Status.IN_STOCK,
        required=False,
    )


class EdgeGatewaySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True, default=None)

    class Meta:
        model = EdgeGateway
        fields = [
            'id',
            'gateway_uid',
            'model_name',
            'firmware_version',
            'status',
            'status_display',
            'organization',
            'organization_name',
            'last_heartbeat_at',
            'ip_address',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'last_heartbeat_at', 'created_at', 'updated_at']

    def validate_gateway_uid(self, value):
        return value.strip().upper()


class GatewayUnassignSerializer(serializers.Serializer):
    target_status = serializers.ChoiceField(
        choices=[EdgeGateway.Status.IN_STOCK, EdgeGateway.Status.MAINTENANCE],
        default=EdgeGateway.Status.IN_STOCK,
        required=False,
    )


class PlatformAuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = PlatformAuditLog
        fields = [
            'id',
            'actor',
            'actor_email',
            'actor_name',
            'action',
            'target_type',
            'target_id',
            'target_label',
            'metadata',
            'ip_address',
            'created_at',
        ]

    def get_actor_name(self, obj):
        if not obj.actor:
            return 'النظام'
        return obj.actor.get_full_name() or obj.actor.email


class SystemAnnouncementSerializer(serializers.ModelSerializer):
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    target_tier_display = serializers.SerializerMethodField()
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = SystemAnnouncement
        fields = [
            'id',
            'title',
            'message',
            'severity',
            'severity_display',
            'target_tier',
            'target_tier_display',
            'is_active',
            'starts_at',
            'ends_at',
            'created_by',
            'created_by_email',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_target_tier_display(self, obj):
        if not obj.target_tier:
            return 'جميع المنشآت'
        return dict(Organization.SubscriptionTier.choices).get(obj.target_tier, obj.target_tier)
