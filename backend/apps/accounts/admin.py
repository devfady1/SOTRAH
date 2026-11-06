from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'role', 'organization', 'phone_number', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_verified', 'organization')
    search_fields = ('email', 'username', 'first_name', 'last_name', 'phone_number', 'national_id')
    ordering = ('-date_joined',)

    fieldsets = (
        ('معلومات الحساب الأساسية', {'fields': ('email', 'username', 'password')}),
        ('البيانات الشخصية', {'fields': ('first_name', 'last_name', 'phone_number', 'national_id', 'avatar')}),
        ('المنشأة والدور الوظيفي', {'fields': ('organization', 'role', 'job_title', 'employee_id')}),
        ('الملف الطبي والسلامة', {'fields': ('blood_type', 'emergency_contact_name', 'emergency_contact_phone')}),
        ('الصلاحيات والحالة', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('التواريخ المهمة', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'organization', 'role', 'password', 'password_confirm'),
        }),
    )
