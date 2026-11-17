import React from 'react';

export default function KpiCard({ title, value, subtext, icon: Icon, color = 'var(--sotrah-orange)', badge }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{title}</span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: `rgba(255, 255, 255, 0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              border: `1px solid rgba(255, 255, 255, 0.08)`,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
          {value}
        </div>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: color,
              fontWeight: 700,
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
