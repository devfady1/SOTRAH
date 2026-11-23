import React from 'react';

export default function Pagination({ count = 0, page = 1, pageSize = 20, onChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  // Generate pages around the current page
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) {
      pages.push(i);
    }
  }

  return (
    <div className="pagination">
      <button
        className="page-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        السابق
      </button>

      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <React.Fragment key={p}>
            {showEllipsis && <span style={{ color: 'var(--text-muted)' }}>...</span>}
            <button
              className={`page-btn ${p === page ? 'active' : ''}`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}

      <button
        className="page-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        التالي
      </button>
    </div>
  );
}
