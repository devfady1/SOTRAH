import React from 'react';

const STATUS_CONFIG = {
  // Organizations
  ACTIVE: { label: 'نشط', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  SUSPENDED: { label: 'معلق', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  EXPIRED: { label: 'منتهي', bg: 'rgba(133, 138, 150, 0.15)', text: '#858a96', border: 'rgba(133, 138, 150, 0.3)' },

  // Vests & Gateways
  IN_STOCK: { label: 'بالمخزون', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
  ASSIGNED: { label: 'مخصصة', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  ONLINE: { label: 'متصل أونلاين', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  OFFLINE: { label: 'غير متصل', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  MAINTENANCE: { label: 'صيانة', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  DECOMMISSIONED: { label: 'خارج الخدمة', bg: 'rgba(133, 138, 150, 0.15)', text: '#858a96', border: 'rgba(133, 138, 150, 0.3)' },

  // Invoices
  PAID: { label: 'مدفوعة', bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
  PENDING: { label: 'قيد الانتظار', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  OVERDUE: { label: 'متأخرة', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  CANCELLED: { label: 'ملغاة', bg: 'rgba(133, 138, 150, 0.15)', text: '#858a96', border: 'rgba(133, 138, 150, 0.3)' },

  // Severity
  INFO: { label: 'معلومات', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' },
  WARNING: { label: 'تحذير', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  CRITICAL: { label: 'حرج', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
};

export default function StatusBadge({ status, label }) {
  const config = STATUS_CONFIG[status] || {
    label: label || status || 'غير محدد',
    bg: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.12)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 700,
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: config.text,
        }}
      />
      <span>{label || config.label}</span>
    </span>
  );
}
