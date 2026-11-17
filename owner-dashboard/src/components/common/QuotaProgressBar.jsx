import React from 'react';

export default function QuotaProgressBar({ used = 0, max = 1, label = '', unit = '' }) {
  const percentage = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  const isHigh = percentage >= 80;

  const barColor = isHigh ? 'var(--sotrah-red)' : percentage >= 60 ? 'var(--sotrah-amber)' : 'var(--sotrah-emerald)';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color: '#fff', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          {used} / {max} {unit} ({percentage}%)
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: barColor,
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
