import React from 'react';

const CLASS_MAP = {
  // Statuses
  ACTIVE: 'badge-green',
  ONLINE: 'badge-green',
  PAID: 'badge-green',
  IN_STOCK: 'badge-cyan',
  ASSIGNED: 'badge-cyan',
  PENDING: 'badge-amber',
  OVERDUE: 'badge-red',
  SUSPENDED: 'badge-red',
  EXPIRED: 'badge-red',
  OFFLINE: 'badge-red',
  MAINTENANCE: 'badge-amber',
  DECOMMISSIONED: 'badge-gray',
  CANCELLED: 'badge-gray',

  // Subscription Tiers
  FREE_TRIAL: 'badge-gray',
  STARTER: 'badge-cyan',
  PROFESSIONAL: 'badge-orange',
  ENTERPRISE: 'badge-green',

  // Severities
  INFO: 'badge-cyan',
  WARNING: 'badge-amber',
  CRITICAL: 'badge-red',

  // Roles
  SUPER_ADMIN: 'badge-orange',
  COMPANY_ADMIN: 'badge-cyan',
  SAFETY_OFFICER: 'badge-green',
  MEDICAL_OFFICER: 'badge-green',
  HR_MANAGER: 'badge-cyan',
  WORKER: 'badge-gray',
};

const LABEL_MAP = {
  ACTIVE: 'نشط',
  ONLINE: 'متصل',
  PAID: 'مدفوع',
  IN_STOCK: 'بالمخزون',
  ASSIGNED: 'مخصص',
  PENDING: 'قيد الانتظار',
  OVERDUE: 'متأخر',
  SUSPENDED: 'معلق',
  EXPIRED: 'منتهي',
  OFFLINE: 'غير متصل',
  MAINTENANCE: 'صيانة',
  DECOMMISSIONED: 'خارج الخدمة',
  CANCELLED: 'ملغى',

  FREE_TRIAL: 'تجريبية',
  STARTER: 'ستارتر',
  PROFESSIONAL: 'احترافية',
  ENTERPRISE: 'مؤسسية',

  INFO: 'معلومات',
  WARNING: 'تحذير',
  CRITICAL: 'حرج',

  SUPER_ADMIN: 'مالك النظام',
  COMPANY_ADMIN: 'مدير المنشأة',
  SAFETY_OFFICER: 'مسؤول سلامة',
  MEDICAL_OFFICER: 'مسؤول طبي',
  HR_MANAGER: 'موارد بشرية',
  WORKER: 'عامل ميداني',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const cls = CLASS_MAP[status] || 'badge-gray';
  const text = LABEL_MAP[status] || status;
  return <span className={`badge ${cls}`}>{text}</span>;
}
