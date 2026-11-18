import React from 'react';

export default function QuotaProgressBar({ used = 0, max = 0, label }) {
  const percentage = max > 0 ? Math.min(Math.round((used / max) * 100), 100) : 0;
  
  let fillColor = 'var(--sotrah-emerald)';
  if (percentage >= 90) {
    fillColor = 'var(--sotrah-red)';
  } else if (percentage >= 80) {
    fillColor = 'var(--sotrah-amber)';
  }

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>{label}</span>
          <span className="mono">{used} / {max} ({percentage}%)</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}
