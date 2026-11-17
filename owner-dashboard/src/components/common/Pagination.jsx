import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function Pagination({ count = 0, pageSize = 20, currentPage = 1, onPageChange }) {
  const totalPages = Math.ceil(count / pageSize) || 1;

  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '13px',
        color: 'var(--text-secondary)',
      }}
    >
      <div>
        إجمالي النتائج: <strong style={{ color: '#fff' }}>{count}</strong> (صفحة {currentPage} من {totalPages})
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: currentPage <= 1 ? 'var(--text-muted)' : '#fff',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <ChevronRight size={14} />
          <span>السابق</span>
        </button>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: currentPage >= totalPages ? 'var(--text-muted)' : '#fff',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <span>التالي</span>
          <ChevronLeft size={14} />
        </button>
      </div>
    </div>
  );
}
