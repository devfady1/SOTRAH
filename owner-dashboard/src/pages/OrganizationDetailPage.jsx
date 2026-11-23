import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrganization, updateOrganization, setOrgStatus } from '../api/ownerTenantsApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import QuotaProgressBar from '../components/common/QuotaProgressBar';
import { ArrowRight, Edit, AlertTriangle, CheckCircle, Building2 } from 'lucide-react';

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [statusAction, setStatusAction] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getOrganization(id)
      .then((r) => {
        const data = r.data;
        setOrg(data);
        setEditForm({
          max_vests: data.max_vests,
          max_users: data.max_users,
          subscription_tier: data.subscription_tier,
        });
      })
      .catch((err) => {
        console.error('Error loading organization details:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await updateOrganization(id, editForm);
      setShowEditModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حفظ التعديلات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await setOrgStatus(id, statusAction, statusReason);
      setShowStatusModal(false);
      setStatusReason('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحديث حالة المنشأة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="empty-state">جاري تحميل بيانات المنشأة...</div>;
  if (!org) return <div className="empty-state">لم يتم العثور على المنشأة المطلوبة</div>;

  const sub = org.subscription_profile || {};
  const invoices = Array.isArray(org.recent_invoices) ? org.recent_invoices : [];
  const admins = Array.isArray(org.company_admins) ? org.company_admins : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/organizations')}
            style={{ marginBottom: 8 }}
          >
            <ArrowRight size={14} /> العودة لقائمة المنشآت
          </button>
          <h1 className="page-title">{org.name}</h1>
          <p className="page-subtitle">
            {org.industry_display || org.industry} ·{' '}
            <StatusBadge status={org.is_active ? 'ACTIVE' : 'SUSPENDED'} />
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setShowEditModal(true)}>
            <Edit size={15} /> تعديل الحصص والباقة
          </button>
          {org.is_active ? (
            <button
              className="btn btn-danger"
              onClick={() => {
                setStatusAction('suspend');
                setShowStatusModal(true);
              }}
            >
              <AlertTriangle size={15} /> تعليق المنشأة
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={() => {
                setStatusAction('activate');
                setShowStatusModal(true);
              }}
            >
              <CheckCircle size={15} /> تفعيل المنشأة
            </button>
          )}
        </div>
      </div>

      <div className="grid-2 mb-4">
        {/* Subscription Card */}
        <div className="kpi-card">
          <div className="kpi-label">ملف الاشتراك والحصص</div>
          <div className="flex items-center gap-2 mt-4">
            <StatusBadge status={sub.plan_tier || sub.tier || org.subscription_tier} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {sub.billing_cycle === 'annual' || sub.billing_cycle === 'ANNUAL' ? 'سنوي' : 'شهري'}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <QuotaProgressBar
              used={org.users_count || 0}
              max={org.max_users || 0}
              label="المستخدمون المصرح بهم"
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <QuotaProgressBar
              used={org.vests_count || 0}
              max={org.max_vests || 0}
              label="السترات الذكية المخصصة"
            />
          </div>
          {sub.expires_at && (
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
              تاريخ نهاية الاشتراك: {new Date(sub.expires_at).toLocaleDateString('ar-EG')}
            </div>
          )}
        </div>

        {/* Basic Info Card */}
        <div className="kpi-card">
          <div className="kpi-label">بيانات الاتصال والتسجيل التجاري</div>
          {org.contact_email && (
            <div style={{ fontSize: 13, marginTop: 10 }}>
              <span style={{ color: 'var(--text-muted)' }}>البريد الرسمي: </span>
              <span className="mono">{org.contact_email}</span>
            </div>
          )}
          {org.contact_phone && (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>الهاتف: </span>
              <span className="mono">{org.contact_phone}</span>
            </div>
          )}
          {org.commercial_registration && (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>السجل التجاري: </span>
              <span className="mono">{org.commercial_registration}</span>
            </div>
          )}
          {org.tax_number && (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>الرقم الضريبي: </span>
              <span className="mono">{org.tax_number}</span>
            </div>
          )}
          {org.address && (
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>المقر والعنوان: </span>
              {org.address}
            </div>
          )}
        </div>
      </div>

      {/* Admins Table */}
      {admins.length > 0 && (
        <div className="table-wrap mb-4">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>مديرو المنشأة (Company Admins)</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الهاتف</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id || a.email}>
                  <td className="text-primary">
                    {a.first_name} {a.last_name}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {a.email}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {a.phone_number || '—'}
                  </td>
                  <td>
                    <StatusBadge status={a.is_active ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Invoices Table */}
      {invoices.length > 0 && (
        <div className="table-wrap">
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>آخر الفواتير الصادرة</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>تاريخ الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {inv.invoice_number || inv.id?.slice(0, 8)}
                  </td>
                  <td className="text-primary">{Number(inv.amount_egp).toLocaleString()} ج.م</td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(inv.due_date).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title="تعديل الحصص وباقة المنشأة" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label className="form-label">باقة الاشتراك</label>
              <select
                className="form-select"
                value={editForm.subscription_tier || ''}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, subscription_tier: e.target.value }))
                }
              >
                {['FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">الحد الأقصى للسترات</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.max_vests || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, max_vests: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">الحد الأقصى للمستخدمين</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.max_users || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, max_users: e.target.value }))}
                />
              </div>
            </div>
            {error && <div className="error-msg mb-4">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowEditModal(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <Modal
          title={statusAction === 'suspend' ? 'تعليق حساب المنشأة' : 'تفعيل حساب المنشأة'}
          onClose={() => setShowStatusModal(false)}
        >
          <form onSubmit={handleStatus}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: 14 }}>
              {statusAction === 'suspend'
                ? `هل أنت متأكد من تعليق منشأة "${org.name}"؟ سيتوقف وصول عمالها ومدرائها مؤقتاً.`
                : `هل تريد تفعيل حساب منشأة "${org.name}" وإعادة تمكين الوصول؟`}
            </p>
            <div className="form-group">
              <label className="form-label">
                سبب الإجراء {statusAction === 'suspend' ? '*' : '(اختياري)'}
              </label>
              <input
                className="form-input"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required={statusAction === 'suspend'}
                placeholder="اكتب سبب التعليق أو التفعيل..."
              />
            </div>
            {error && <div className="error-msg mb-4">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowStatusModal(false)}
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`btn ${statusAction === 'suspend' ? 'btn-danger' : 'btn-success'}`}
                disabled={submitting}
              >
                {submitting ? 'جاري التنفيذ...' : statusAction === 'suspend' ? 'تعليق المنشأة' : 'تفعيل المنشأة'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
