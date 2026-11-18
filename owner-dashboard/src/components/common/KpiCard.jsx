import React from 'react';

export default function KpiCard({ label, value, sub, color = 'var(--text-primary)', icon }) {
  return (
    <div className="kpi-card">
      <div className="flex items-center gap-2 mb-4" style={{ justifyContent: 'space-between' }}>
        <span className="kpi-label" style={{ marginBottom: 0 }}>{label}</span>
        {icon && <span style={{ color: 'var(--sotrah-orange)' }}>{icon}</span>}
      </div>
      <div className="kpi-value" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
