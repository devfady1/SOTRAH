import React, { useEffect, useState, useCallback } from 'react';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getHealth,
} from '../api/ownerTenantsApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import {
  Plus,
  Trash2,
  Edit2,
  Activity,
  Server,
  Database,
  WifiOff,
  Wrench,
  AlertOctagon,
  Clock,
} from 'lucide-react';

const SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'];
const TIERS = ['', 'FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

export default function AnnouncementsPage() {
  const [data, setData] = useState({ count: 0, results: [] });
  const [page, setPage] = useState(1);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    message: '',
    severity: 'INFO',
    target_tier: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getAnnouncements({ page, page_size: 20 })
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
    getHealth()
      .then((res) => setHealth(res.data?.health))
      .catch(console.error);
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.target_tier) delete payload.target_tier;
      await createAnnouncement(payload);
      setShowCreate(false);
      setForm({
        title: '',
        message: '',
        severity: 'INFO',
        target_tier: '',
        is_active: true,
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل نشر الإعلان');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await updateAnnouncement(item.id, { is_active: !item.is_active });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في التحديث');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`هل أنت متأكد من حذف الإعلان "${item.title}"؟`)) return;
    try {
      await deleteAnnouncement(item.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في الحذف');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إعلانات المنصة ومراقبة صحة النظام</h1>
          <p className="page-subtitle">
            نشر تنبيهات عامة لعملاء المنظومة ومتابعة الحالة التشغيلية للسيرفر وقواعد البيانات
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> إضافة إعلان جديد
        </button>
      </div>

      {/* System Health Overview Widget */}
      {health && (
        <div
          className="table-wrap mb-4"
          style={{
            padding: 24,
            background: 'linear-gradient(180deg, var(--bg-card-solid) 0%, rgba(16, 18, 24, 0.4) 100%)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="flex items-center gap-2 mb-4"
            style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14 }}
          >
            <div className="flex items-center gap-2">
              <Server size={18} color="var(--sotrah-orange)" />
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>مؤشرات صحة المنظومة المباشرة (System Health)</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`health-dot ${health.status === 'healthy' ? 'healthy' : 'warning'}`} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                حالة النظام: <strong>{health.status === 'healthy' ? 'ممتازة (Healthy)' : 'تحتاج مراجعة'}</strong>
              </span>
            </div>
          </div>

          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            <div className="kpi-card" style={{ padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <Database size={15} color="var(--sotrah-emerald)" />
                <span className="kpi-label" style={{ marginBottom: 0 }}>قاعدة البيانات</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--sotrah-emerald)' }}>
                {health.database === 'connected' ? 'متصلة ومستقرة' : 'غير متصلة'}
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <WifiOff size={15} color={health.offline_gateways_count > 0 ? 'var(--sotrah-amber)' : 'var(--text-muted)'} />
                <span className="kpi-label" style={{ marginBottom: 0 }}>بوابات غير متصلة</span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: health.offline_gateways_count > 0 ? 'var(--sotrah-amber)' : 'var(--text-primary)',
                }}
              >
                {health.offline_gateways_count} بوابة
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={15} color={health.maintenance_vests_count > 0 ? 'var(--sotrah-orange)' : 'var(--text-muted)'} />
                <span className="kpi-label" style={{ marginBottom: 0 }}>سترات قيد الصيانة</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {health.maintenance_vests_count} سترة
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertOctagon size={15} color={health.overdue_invoices_count > 0 ? 'var(--sotrah-red)' : 'var(--text-muted)'} />
                <span className="kpi-label" style={{ marginBottom: 0 }}>فواتير متأخرة السداد</span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: health.overdue_invoices_count > 0 ? 'var(--sotrah-red)' : 'var(--text-primary)',
                }}
              >
                {health.overdue_invoices_count} فاتورة
              </div>
            </div>

            <div className="kpi-card" style={{ padding: 14 }}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={15} color="var(--sotrah-cyan)" />
                <span className="kpi-label" style={{ marginBottom: 0 }}>فترات تجربة تنتهي قريباً (7 أيام)</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--sotrah-cyan)' }}>
                {health.expiring_trials_7d_count} منشأة
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="table-wrap">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>إعلانات المنصة النشطة والسابقة</h3>
        </div>

        {loading ? (
          <div className="empty-state">جاري التحميل...</div>
        ) : data.results?.length === 0 ? (
          <div className="empty-state">لا توجد إعلانات منشورة حالياً</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>عنوان الإعلان</th>
                <th>محتوى الرسالة</th>
                <th>درجة الأهمية</th>
                <th>الباقة المستهدفة</th>
                <th>الحالة</th>
                <th>تاريخ النشر</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item) => (
                <tr key={item.id}>
                  <td className="text-primary" style={{ fontWeight: 600, minWidth: 160 }}>
                    {item.title}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 300 }}>
                    {item.message}
                  </td>
                  <td>
                    <StatusBadge status={item.severity} />
                  </td>
                  <td>
                    {item.target_tier ? (
                      <StatusBadge status={item.target_tier} />
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>جميع الباقات</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleToggle(item)}
                      title="تبديل حالة النشر"
                    >
                      <StatusBadge status={item.is_active ? 'ACTIVE' : 'SUSPENDED'} />
                    </button>
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item)}
                      title="حذف الإعلان"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination count={data.count} page={page} onChange={setPage} />

      {/* Create Announcement Modal */}
      {showCreate && (
        <Modal title="نشر إعلان جديد لعملاء المنصة" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">عنوان الإعلان *</label>
              <input
                className="form-input"
                placeholder="مثال: تحديث أمني هام لمنظومة السترات الذكية"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">نص الإعلان *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="اكتب نص الإعلان بالتفصيل..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">درجة الأهمية (Severity)</label>
                <select
                  className="form-select"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                >
                  <option value="INFO">معلومات عامة (INFO)</option>
                  <option value="WARNING">تنبيه وتحذير (WARNING)</option>
                  <option value="CRITICAL">طارئ / حرج (CRITICAL)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">الباقة المستهدفة</label>
                <select
                  className="form-select"
                  value={form.target_tier}
                  onChange={(e) => setForm((f) => ({ ...f, target_tier: e.target.value }))}
                >
                  <option value="">جميع المنشآت والشركات</option>
                  <option value="FREE_TRIAL">الباقة التجريبية فقط</option>
                  <option value="STARTER">باقة ستارتر فقط</option>
                  <option value="PROFESSIONAL">باقة بروفيشنال فقط</option>
                  <option value="ENTERPRISE">باقة إنتربرايز فقط</option>
                </select>
              </div>
            </div>

            {error && <div className="error-msg mb-4">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCreate(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري النشر...' : 'نشر الإعلان الآن'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
