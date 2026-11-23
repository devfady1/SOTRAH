import React, { useEffect, useState, useCallback } from 'react';
import { getAuditLogs } from '../api/ownerTenantsApi';
import Pagination from '../components/common/Pagination';
import { Search, ShieldAlert, Calendar } from 'lucide-react';

export default function AuditLogsPage() {
  const [data, setData] = useState({ count: 0, results: [] });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    target_type: '',
    date_from: '',
    date_to: '',
  });
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: 20,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    };
    getAuditLogs(params)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">سجل التدقيق الأمني والعمليات (Audit Logs)</h1>
          <p className="page-subtitle">
            سجل غير قابل للتعديل يوثق جميع الأنشطة والعمليات الحساسة التي تتم على المنصة
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div
          className="flex items-center gap-2"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            className="search-input"
            style={{ background: 'none', border: 'none', padding: 0 }}
            placeholder="بحث بالبريد أو الهدف أو الحدث..."
            value={filters.search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
          />
        </div>

        <input
          type="date"
          className="form-input"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
          title="من تاريخ"
          value={filters.date_from}
          onChange={(e) => {
            setFilters((f) => ({ ...f, date_from: e.target.value }));
            setPage(1);
          }}
        />

        <input
          type="date"
          className="form-input"
          style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
          title="إلى تاريخ"
          value={filters.date_to}
          onChange={(e) => {
            setFilters((f) => ({ ...f, date_to: e.target.value }));
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">جاري تحميل سجل التدقيق...</div>
        ) : data.results?.length === 0 ? (
          <div className="empty-state">لا توجد سجلات تدقيق مطابقة</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>المنفّذ (Actor)</th>
                <th>الحدث والعملية</th>
                <th>نوع الهدف</th>
                <th>معرّف الهدف</th>
                <th>عنوان الـ IP</th>
                <th>التاريخ والتوقيت</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((log) => (
                <tr key={log.id}>
                  <td className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    {log.actor_email || (
                      <span style={{ color: 'var(--text-muted)' }}>النظام الآلي</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-cyan" style={{ fontSize: 11 }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {log.target_type || '—'}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--sotrah-orange)' }}>
                      {log.target_label || log.target_id || '—'}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {log.ip_address || '—'}
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString('ar-EG') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination count={data.count} page={page} onChange={setPage} />
    </div>
  );
}
