import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  User,
  Globe,
  Tag,
  AlertCircle
} from 'lucide-react';
import { ownerFleetApi } from '../api/ownerFleetApi';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log for JSON Metadata Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (filterAction) params.action = filterAction;
      if (filterTargetType) params.target_type = filterTargetType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await ownerFleetApi.getAuditLogs(params);
      if (res.results) {
        setLogs(res.results);
        setTotalCount(res.count || res.results.length);
      } else if (Array.isArray(res)) {
        setLogs(res);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'فشل تحميل سجل التدقيق');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterAction, filterTargetType, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterAction('');
    setFilterTargetType('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // Action badge styles
  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('ASSIGN')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (act.includes('DELETE') || act.includes('DECOMMISSION') || act.includes('SUSPEND')) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (act.includes('UPDATE') || act.includes('STATUS') || act.includes('UNASSIGN')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
    return 'bg-gray-800 text-gray-300 border-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#ff5d1a]" />
            سجل التدقيق الأمني (Audit Logs)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            سجل غير قابل للتعديل لجميع العمليات الحساسة، التغييرات، والدخول عبر المنصة
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-[#181a20] hover:bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl p-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث بالبريد، اسم الهدف، عنوان IP..."
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg pr-9 pl-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="">جميع أنواع العمليات</option>
                <option value="LOGIN">تسجيل دخول (LOGIN)</option>
                <option value="CREATE">إنشاء (CREATE)</option>
                <option value="UPDATE">تعديل (UPDATE)</option>
                <option value="DELETE">حذف (DELETE)</option>
                <option value="STATUS_CHANGE">تغيير حالة (STATUS_CHANGE)</option>
                <option value="ASSIGN">تخصيص (ASSIGN)</option>
                <option value="UNASSIGN">سحب (UNASSIGN)</option>
              </select>
            </div>

            {/* Target Type Filter */}
            <div>
              <select
                value={filterTargetType}
                onChange={(e) => {
                  setFilterTargetType(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="">جميع الأهداف</option>
                <option value="ORGANIZATION">منشأة (ORGANIZATION)</option>
                <option value="USER">مستخدم (USER)</option>
                <option value="SMART_VEST">سترة ذكية (SMART_VEST)</option>
                <option value="EDGE_GATEWAY">بوابة محلية (EDGE_GATEWAY)</option>
                <option value="INVOICE">فاتورة (INVOICE)</option>
                <option value="SUBSCRIPTION_PLAN">باقة اشتراك (PLAN)</option>
                <option value="ANNOUNCEMENT">إعلان (ANNOUNCEMENT)</option>
              </select>
            </div>

            {/* Filter / Reset Actions */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] text-white rounded-lg text-sm font-medium transition-colors"
              >
                تطبيق
              </button>
              {(search || filterAction || filterTargetType || dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>

          {/* Date Range Pickers */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-800/60 text-xs text-gray-400">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <Calendar className="w-3.5 h-3.5 text-[#ff5d1a]" />
              النطاق الزمني:
            </span>
            <div className="flex items-center gap-2">
              <span>من:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="bg-[#181a20] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>إلى:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="bg-[#181a20] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchLogs}
            className="mr-auto text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/30 text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#181a20] text-gray-400 text-xs border-b border-gray-800">
                <th className="py-3 px-4 font-semibold">التاريخ والوقت</th>
                <th className="py-3 px-4 font-semibold">المنفّذ (Actor)</th>
                <th className="py-3 px-4 font-semibold">العملية (Action)</th>
                <th className="py-3 px-4 font-semibold">الهدف (Target)</th>
                <th className="py-3 px-4 font-semibold">عنوان الـ IP</th>
                <th className="py-3 px-4 font-semibold text-center">التفاصيل والبيانات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff5d1a]" />
                      <span>جاري تحميل سجلات التدقيق...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    لا توجد سجلات تدقيق تطابق محددات البحث الحالية
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actorEmail = log.actor_email || log.actor?.email || log.actor || 'نظام آلي (System)';
                  return (
                    <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-xs font-mono text-gray-300 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString('ar-EG') : '—'}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-xs text-white truncate max-w-[180px]">
                            {actorEmail}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block font-mono text-[11px] px-2 py-0.5 rounded border ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-400 font-semibold">{log.target_type}:</span>
                          <span className="text-white font-medium truncate max-w-[180px]">
                            {log.target_label || log.target_id || '—'}
                          </span>
                        </div>
                      </td>

                      {/* IP */}
                      <td className="py-3 px-4 text-xs font-mono text-gray-400">
                        {log.ip_address ? (
                          <div className="flex items-center gap-1.5" dir="ltr">
                            <Globe className="w-3 h-3 text-gray-500" />
                            <span>{log.ip_address}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Details / Metadata view */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#ff5d1a]" />
                          <span>عرض JSON</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 bg-[#14161f]">
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* Metadata Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`تفاصيل العملية: ${selectedLog?.action || ''}`}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#181a20] p-3 rounded-lg border border-gray-800">
              <div>
                <span className="text-gray-400 block mb-0.5">المنفّذ:</span>
                <span className="text-white font-mono">
                  {selectedLog.actor_email || selectedLog.actor?.email || 'System'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">التاريخ:</span>
                <span className="text-white font-mono">
                  {new Date(selectedLog.created_at).toLocaleString('ar-EG')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">نوع الهدف:</span>
                <span className="text-white font-mono">{selectedLog.target_type}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">مُعرّف الهدف / التسمية:</span>
                <span className="text-white font-mono">
                  {selectedLog.target_label || selectedLog.target_id || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">عنوان IP:</span>
                <span className="text-white font-mono" dir="ltr">
                  {selectedLog.ip_address || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">الـ User Agent:</span>
                <span className="text-gray-300 font-mono truncate block max-w-xs" title={selectedLog.user_agent}>
                  {selectedLog.user_agent || '—'}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-300">البيانات الوصفية (Metadata):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog.metadata || {}, null, 2));
                    alert('تم نسخ البيانات إلى الحافظة');
                  }}
                  className="text-[11px] text-[#ff5d1a] hover:underline"
                >
                  نسخ JSON
                </button>
              </div>
              <pre
                dir="ltr"
                className="bg-[#0b0c10] border border-gray-800 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-64 leading-relaxed"
              >
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
