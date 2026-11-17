import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Activity,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { ownerFleetApi } from '../api/ownerFleetApi';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function AnnouncementsPage() {
  // Health State
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterActive, setFilterActive] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Create Form State
  const initialCreateForm = {
    title: '',
    message: '',
    severity: 'INFO',
    target_tier: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    severity: 'INFO',
    target_tier: '',
    is_active: true,
    starts_at: '',
    ends_at: '',
  });

  // Fetch Health Overview
  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await ownerFleetApi.getHealth();
      if (res.health) {
        setHealth(res.health);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (filterSeverity) params.severity = filterSeverity;
      if (filterTier) params.target_tier = filterTier;
      if (filterActive !== '') params.is_active = filterActive;

      const res = await ownerFleetApi.getAnnouncements(params);
      if (res.results) {
        setAnnouncements(res.results);
        setTotalCount(res.count || res.results.length);
      } else if (Array.isArray(res)) {
        setAnnouncements(res);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'فشل تحميل الإعلانات');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterSeverity, filterTier, filterActive]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenEdit = (ann) => {
    setSelectedAnnouncement(ann);
    setEditForm({
      title: ann.title || '',
      message: ann.message || '',
      severity: ann.severity || 'INFO',
      target_tier: ann.target_tier || '',
      is_active: ann.is_active ?? true,
      starts_at: ann.starts_at ? ann.starts_at.substring(0, 16) : '',
      ends_at: ann.ends_at ? ann.ends_at.substring(0, 16) : '',
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleToggleActive = async (ann) => {
    try {
      await ownerFleetApi.updateAnnouncement(ann.id, { is_active: !ann.is_active });
      fetchAnnouncements();
    } catch (err) {
      alert(err?.response?.data?.detail || 'فشل تحديث حالة الإعلان');
    }
  };

  const handleDeleteAnnouncement = async (ann) => {
    if (!window.confirm(`هل أنت متأكد من حذف الإعلان: "${ann.title}"؟`)) return;
    try {
      await ownerFleetApi.deleteAnnouncement(ann.id);
      fetchAnnouncements();
    } catch (err) {
      alert(err?.response?.data?.detail || 'فشل حذف الإعلان');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: createForm.title,
        message: createForm.message,
        severity: createForm.severity,
        target_tier: createForm.target_tier || null,
        is_active: createForm.is_active,
      };
      if (createForm.starts_at) payload.starts_at = new Date(createForm.starts_at).toISOString();
      if (createForm.ends_at) payload.ends_at = new Date(createForm.ends_at).toISOString();

      await ownerFleetApi.createAnnouncement(payload);
      setCreateModalOpen(false);
      setCreateForm(initialCreateForm);
      fetchAnnouncements();
    } catch (err) {
      console.error('Create announcement error:', err);
      setFormError(err?.response?.data?.message || err?.response?.data?.detail || 'فشل إنشاء الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        title: editForm.title,
        message: editForm.message,
        severity: editForm.severity,
        target_tier: editForm.target_tier || null,
        is_active: editForm.is_active,
      };
      if (editForm.starts_at) payload.starts_at = new Date(editForm.starts_at).toISOString();
      else payload.starts_at = null;
      if (editForm.ends_at) payload.ends_at = new Date(editForm.ends_at).toISOString();
      else payload.ends_at = null;

      await ownerFleetApi.updateAnnouncement(selectedAnnouncement.id, payload);
      setEditModalOpen(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Edit announcement error:', err);
      setFormError(err?.response?.data?.message || err?.response?.data?.detail || 'فشل تحديث الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  // Severity style helper
  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          icon: AlertCircle,
          label: 'حرج (Critical)',
          classes: 'bg-red-500/15 text-red-400 border-red-500/30',
        };
      case 'WARNING':
        return {
          icon: AlertTriangle,
          label: 'تحذير (Warning)',
          classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'INFO':
      default:
        return {
          icon: Info,
          label: 'معلومات (Info)',
          classes: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#ff5d1a]" />
            إعلانات المنصة وصحة النظام (Announcements & Health)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            بث التنبيهات الرسمية للشركات المشتركة ومراقبة المؤشرات الحيوية لخوادم سترة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchHealth();
              fetchAnnouncements();
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#181a20] hover:bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setCreateForm(initialCreateForm);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] text-white rounded-lg text-sm font-medium shadow-md shadow-[#ff5d1a]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء إعلان جديد</span>
          </button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 border-b border-gray-800/80 pb-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>المؤشرات الحيوية وصحة المنصة (Platform Health Monitor)</span>
          </div>
          {health?.server_time && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>وقت الخادم: {health.server_time}</span>
            </div>
          )}
        </div>

        {loadingHealth ? (
          <div className="py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#ff5d1a]" />
            <span>جاري فحص مؤشرات النظام...</span>
          </div>
        ) : health ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* DB Status */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">قاعدة البيانات</div>
              <div className="flex items-center justify-center gap-1 font-semibold text-emerald-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{health.database === 'connected' ? 'متصلة' : health.database}</span>
              </div>
            </div>

            {/* Offline Gateways */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">بوابات منقطعة</div>
              <div
                className={`text-lg font-bold font-mono ${
                  health.offline_gateways_count > 0 ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {health.offline_gateways_count}
              </div>
            </div>

            {/* Maintenance Vests */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">سترات بالصيانة</div>
              <div
                className={`text-lg font-bold font-mono ${
                  health.maintenance_vests_count > 0 ? 'text-amber-400' : 'text-gray-300'
                }`}
              >
                {health.maintenance_vests_count}
              </div>
            </div>

            {/* Suspended Orgs */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">شركات معلقة</div>
              <div
                className={`text-lg font-bold font-mono ${
                  health.suspended_organizations_count > 0 ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {health.suspended_organizations_count}
              </div>
            </div>

            {/* Overdue Invoices */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">فواتير متأخرة</div>
              <div
                className={`text-lg font-bold font-mono ${
                  health.overdue_invoices_count > 0 ? 'text-red-400' : 'text-gray-300'
                }`}
              >
                {health.overdue_invoices_count}
              </div>
            </div>

            {/* Expiring Trials in 7d */}
            <div className="bg-[#181a20] border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-gray-400 text-xs mb-1">تجارب تنتهي (7 أيام)</div>
              <div
                className={`text-lg font-bold font-mono ${
                  health.expiring_trials_7d_count > 0 ? 'text-amber-400' : 'text-gray-300'
                }`}
              >
                {health.expiring_trials_7d_count}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-xs">تعذر جلب تفاصيل صحة النظام</div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في العنوان أو النص..."
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg pr-9 pl-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          {/* Severity */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">جميع مستويات الأهمية</option>
              <option value="INFO">معلومات (INFO)</option>
              <option value="WARNING">تحذير (WARNING)</option>
              <option value="CRITICAL">حرج (CRITICAL)</option>
            </select>
          </div>

          {/* Tier */}
          <div>
            <select
              value={filterTier}
              onChange={(e) => {
                setFilterTier(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">جميع الباقات المستهدفة</option>
              <option value="FREE_TRIAL">تجربة مجانية (FREE_TRIAL)</option>
              <option value="STARTER">ستارتر (STARTER)</option>
              <option value="PROFESSIONAL">احترافية (PROFESSIONAL)</option>
              <option value="ENTERPRISE">مؤسسات (ENTERPRISE)</option>
            </select>
          </div>

          {/* Active status */}
          <div>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">الحالة (الكل)</option>
              <option value="true">نشط فقط</option>
              <option value="false">متوقف فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchAnnouncements}
            className="mr-auto text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/30 text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#181a20] text-gray-400 text-xs border-b border-gray-800">
                <th className="py-3 px-4 font-semibold">الإعلان</th>
                <th className="py-3 px-4 font-semibold">الأهمية</th>
                <th className="py-3 px-4 font-semibold">الفئة المستهدفة</th>
                <th className="py-3 px-4 font-semibold">الفترة الزمنية</th>
                <th className="py-3 px-4 font-semibold text-center">الحالة</th>
                <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff5d1a]" />
                      <span>جاري تحميل الإعلانات...</span>
                    </div>
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    لا توجد إعلانات حالياً
                  </td>
                </tr>
              ) : (
                announcements.map((ann) => {
                  const badge = getSeverityBadge(ann.severity);
                  const IconComponent = badge.icon;
                  return (
                    <tr key={ann.id} className="hover:bg-gray-800/30 transition-colors">
                      {/* Title & Message */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-white mb-0.5">{ann.title}</div>
                        <div className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {ann.message}
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border ${badge.classes}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Target Tier */}
                      <td className="py-3 px-4 text-xs">
                        {ann.target_tier ? (
                          <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                            {ann.target_tier}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium">كافة المنشآت (الكل)</span>
                        )}
                      </td>

                      {/* Starts / Ends */}
                      <td className="py-3 px-4 text-xs font-mono text-gray-400 whitespace-nowrap">
                        {ann.starts_at || ann.ends_at ? (
                          <div>
                            <div>من: {ann.starts_at ? new Date(ann.starts_at).toLocaleDateString('ar-EG') : 'الآن'}</div>
                            <div>إلى: {ann.ends_at ? new Date(ann.ends_at).toLocaleDateString('ar-EG') : 'مستمر'}</div>
                          </div>
                        ) : (
                          <span>دائم حتى الإيقاف</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(ann)}
                          title="انقر لتغيير حالة الإعلان"
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            ann.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {ann.is_active ? 'نشط ومعروض' : 'متوقف'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(ann)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                            title="تعديل الإعلان"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="حذف الإعلان"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

      {/* Modal: Create Announcement */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="إنشاء إعلان أو تنبيه جديد"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان الإعلان *</label>
            <input
              type="text"
              required
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="مثال: ترقية الخوادم الدورية للصيانة"
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">نص التنبيه أو الرسالة *</label>
            <textarea
              required
              rows={3}
              value={createForm.message}
              onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
              placeholder="تفاصيل التنبيه الذي سيظهر لمديري الشركات..."
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">مستوى الأهمية *</label>
              <select
                value={createForm.severity}
                onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="INFO">معلومات عامة (INFO)</option>
                <option value="WARNING">تحذير هام (WARNING)</option>
                <option value="CRITICAL">طارئ / حرج (CRITICAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">الباقة المستهدفة</label>
              <select
                value={createForm.target_tier}
                onChange={(e) => setCreateForm({ ...createForm, target_tier: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="">كافة الباقات والشركات</option>
                <option value="FREE_TRIAL">تجربة مجانية فقط (FREE_TRIAL)</option>
                <option value="STARTER">ستارتر فقط (STARTER)</option>
                <option value="PROFESSIONAL">احترافية فقط (PROFESSIONAL)</option>
                <option value="ENTERPRISE">مؤسسات فقط (ENTERPRISE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ البدء (اختياري)</label>
              <input
                type="datetime-local"
                value={createForm.starts_at}
                onChange={(e) => setCreateForm({ ...createForm, starts_at: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ الانتهاء (اختياري)</label>
              <input
                type="datetime-local"
                value={createForm.ends_at}
                onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ann_active"
              checked={createForm.is_active}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
              className="accent-[#ff5d1a] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="ann_active" className="text-xs text-gray-300 cursor-pointer">
              تفعيل وبث الإعلان فوراً
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'جاري البث...' : 'نشر الإعلان'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Announcement */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`تعديل الإعلان: ${selectedAnnouncement?.title || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان الإعلان *</label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">نص التنبيه أو الرسالة *</label>
            <textarea
              required
              rows={3}
              value={editForm.message}
              onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">مستوى الأهمية *</label>
              <select
                value={editForm.severity}
                onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="INFO">معلومات عامة (INFO)</option>
                <option value="WARNING">تحذير هام (WARNING)</option>
                <option value="CRITICAL">طارئ / حرج (CRITICAL)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">الباقة المستهدفة</label>
              <select
                value={editForm.target_tier}
                onChange={(e) => setEditForm({ ...editForm, target_tier: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                <option value="">كافة الباقات والشركات</option>
                <option value="FREE_TRIAL">تجربة مجانية فقط (FREE_TRIAL)</option>
                <option value="STARTER">ستارتر فقط (STARTER)</option>
                <option value="PROFESSIONAL">احترافية فقط (PROFESSIONAL)</option>
                <option value="ENTERPRISE">مؤسسات فقط (ENTERPRISE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ البدء</label>
              <input
                type="datetime-local"
                value={editForm.starts_at}
                onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ الانتهاء</label>
              <input
                type="datetime-local"
                value={editForm.ends_at}
                onChange={(e) => setEditForm({ ...editForm, ends_at: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ann_edit_active"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="accent-[#ff5d1a] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="ann_edit_active" className="text-xs text-gray-300 cursor-pointer">
              إعلان نشط
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
