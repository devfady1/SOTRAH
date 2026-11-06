from rest_framework import permissions
from apps.accounts.models import User


class IsCompanyAdmin(permissions.BasePermission):
    """
    يسمح بالوصول لمديري الشركات والمسؤولين الإداريين.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.COMPANY_ADMIN, User.Role.SUPER_ADMIN]
        )


class IsSafetyOfficer(permissions.BasePermission):
    """
    يسمح بالوصول لمسؤولي السلامة والصحة المهنية (HSE).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.SAFETY_OFFICER, User.Role.COMPANY_ADMIN, User.Role.SUPER_ADMIN]
        )


class IsMedicalStaff(permissions.BasePermission):
    """
    يسمح بالوصول للأطباء والمسعفين المهنيين.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.MEDICAL_STAFF, User.Role.SAFETY_OFFICER, User.Role.SUPER_ADMIN]
        )


class IsHRManager(permissions.BasePermission):
    """
    يسمح بالوصول لمديري الموارد البشرية وإدارة الورديات.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in [User.Role.HR_MANAGER, User.Role.COMPANY_ADMIN, User.Role.SUPER_ADMIN]
        )
