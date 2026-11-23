import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrganizations, createOrganization } from '../api/ownerTenantsApi';
import { getIndustries } from '../api/authApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import QuotaProgressBar from '../components/common/QuotaProgressBar';
import Pagination from '../components/common/Pagination';
import { Plus, Search, Building2 } from 'lucide-react';

const TIERS = ['FREE_TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
const TIER_LABELS = {
  FREE_TRIAL: 'تجريبية',
  STARTER: 'ستارتر',
  PROFESSIONAL: 'احترافية',
  ENTERPRISE: 'مؤسسية',
};
const BILLING = ['monthly', 'annual'];
const BILLING_LABELS = { monthly: 'شهري', annual: 'سنوي' };

const DEFAULT_FORM = {
  name: '',
  industry: '',
  subscription_tier: 'STARTER',
  billing_cycle: 'monthly',
  max_vests: '',
  max_users: '',
  commercial_registration: '',
  tax_number: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  admin_first_name: '',
  admin_last_name: '',
  admin_email: '',
  admin_password: '',
  admin_phone_number: '',
};

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ count: 0, results: [] });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    subscription_tier: '',
    subscription_status: '',
    is_active: '',
  });
  const [industries, setIndustries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: 20,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    };
    getOrganizations(params)
      .then((r) => {
        const resData = r?.data;
        if (resData && Array.isArray(resData.results)) {
          setData(resData);
        } else if (Array.isArray(resData)) {
          setData({ count: resData.length, results: resData });
        } else {
          setData({ count: 0, results: [] });
        }
      })
      .catch((err) => {
        console.error('Error loading organizations:', err);
        setData({ count: 0, results: [] });
      })
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    getIndustries()
      .then((res) => {
        if (Array.isArray(res)) {
          setIndustries(res);
        } else if (Array.isArray(res?.data?.industries)) {
          setIndustries(res.data.industries);
        } else if (Array.isArray(res?.industries)) {
          setIndustries(res.industries);
        } else {
          setIndustries([]);
        }
      })
      .catch((err) => {
        console.error('Error loading industries:', err);
        setIndustries([]);
      });
  }, []);

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.max_vests) delete payload.max_vests;
      if (!payload.max_users) delete payload.max_users;
      await createOrganization(payload);
      setShowModal(false);
      setForm(DEFAULT_FORM);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'حدث خطأ أثناء الإنشاء');
    } finally {
      setSubmitting(false);
    }
  };

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const industriesList = Array.isArray(industries) ? industries : [];
  const orgsList = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المنشآت والشركات</h1>
          <p className="page-subtitle">عرض وإدارة جميع الشركات والمصانع المشتركة في المنظومة</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> إضافة منشأة جديدة
        </button>
      </div>

      {/* Filters Bar */}
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
            style={{ background: 'none', border: 'none', padding: 0, minWidth: 160 }}
            placeholder="بحث باسم المنشأة..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.industry}
          onChange={(e) => setFilter('industry', e.target.value)}
        >
          <option value="">كل القطاعات الصناعية</option>
          {industriesList.map((ind) => {
            const code = typeof ind === 'object' ? ind.code : ind;
            const label = typeof ind === 'object' ? ind.label : ind;
            return (
              <option key={code} value={code}>
                {label}
              </option>
            );
          })}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.subscription_tier}
          onChange={(e) => setFilter('subscription_tier', e.target.value)}
        >
          <option value="">كل باقات الاشتراك</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.is_active}
          onChange={(e) => setFilter('is_active', e.target.value)}
        >
          <option value="">كل الحالات</option>
          <option value="true">نشطة</option>
          <option value="false">معلقة</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">جاري تحميل بيانات المنشآت...</div>
        ) : orgsList.length === 0 ? (
          <div className="empty-state">
            <Building2 size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <br />
            لا توجد منشآت مطابقة
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>اسم المنشأة</th>
                <th>القطاع</th>
                <th>الباقة</th>
                <th>الحالة</th>
                <th>استهلاك المستخدمين</th>
                <th>استهلاك السترات</th>
                <th>انتهاء الاشتراك</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {orgsList.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="text-primary" style={{ fontWeight: 600 }}>
                      {org.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {org.contact_email || '—'}
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {org.industry_display || org.industry}
                  </td>
                  <td>
                    <StatusBadge status={org.subscription_tier} />
                  </td>
                  <td>
                    <StatusBadge status={org.is_active ? 'ACTIVE' : 'SUSPENDED'} />
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <QuotaProgressBar
                      used={org.users_count || 0}
                      max={org.max_users || 0}
                      label="مستخدمون"
                    />
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <QuotaProgressBar
                      used={org.vests_count || 0}
                      max={org.max_vests || 0}
                      label="سترات"
                    />
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {org.expires_at ? new Date(org.expires_at).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/organizations/${org.id}`)}
                    >
                      التفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination count={data.count || 0} page={page} onChange={setPage} />

      {/* Create Organization Modal */}
      {showModal && (
        <Modal title="إضافة منشأة جديدة" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate}>
            <h4
              style={{
                color: 'var(--sotrah-orange)',
                fontSize: 13,
                marginBottom: 16,
                paddingBottom: 8,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              بيانات الشركة والمنشأة
            </h4>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">اسم المنشأة *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">القطاع الصناعي *</label>
                <select
                  className="form-select"
                  value={form.industry}
                  onChange={(e) => setF('industry', e.target.value)}
                  required
                >
                  <option value="">اختر القطاع</option>
                  {industriesList.map((ind) => {
                    const code = typeof ind === 'object' ? ind.code : ind;
                    const label = typeof ind === 'object' ? ind.label : ind;
                    return (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الباقة المعتمدة</label>
                <select
                  className="form-select"
                  value={form.subscription_tier}
                  onChange={(e) => setF('subscription_tier', e.target.value)}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {TIER_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">دورة الفوترة</label>
                <select
                  className="form-select"
                  value={form.billing_cycle}
                  onChange={(e) => setF('billing_cycle', e.target.value)}
                >
                  {BILLING.map((b) => (
                    <option key={b} value={b}>
                      {BILLING_LABELS[b]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">الحد الأقصى للسترات</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.max_vests}
                  onChange={(e) => setF('max_vests', e.target.value)}
                  placeholder="اتركه فارغاً للافتراضي"
                />
              </div>
              <div className="form-group">
                <label className="form-label">الحد الأقصى للمستخدمين</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.max_users}
                  onChange={(e) => setF('max_users', e.target.value)}
                  placeholder="اتركه فارغاً للافتراضي"
                />
              </div>
              <div className="form-group">
                <label className="form-label">رقم السجل التجاري</label>
                <input
                  className="form-input"
                  value={form.commercial_registration}
                  onChange={(e) => setF('commercial_registration', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">الرقم الضريبي</label>
                <input
                  className="form-input"
                  value={form.tax_number}
                  onChange={(e) => setF('tax_number', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">بريد التواصل الرسمي</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.contact_email}
                  onChange={(e) => setF('contact_email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">هاتف التواصل</label>
                <input
                  className="form-input"
                  value={form.contact_phone}
                  onChange={(e) => setF('contact_phone', e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">العنوان والموقع الجغرافي</label>
              <input
                className="form-input"
                value={form.address}
                onChange={(e) => setF('address', e.target.value)}
              />
            </div>

            <h4
              style={{
                color: 'var(--sotrah-orange)',
                fontSize: 13,
                marginBottom: 16,
                paddingTop: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              بيانات مدير المنشأة الأول (Company Admin)
            </h4>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">الاسم الأول *</label>
                <input
                  className="form-input"
                  value={form.admin_first_name}
                  onChange={(e) => setF('admin_first_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الاسم الأخير *</label>
                <input
                  className="form-input"
                  value={form.admin_last_name}
                  onChange={(e) => setF('admin_last_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني للدخول *</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.admin_email}
                  onChange={(e) => setF('admin_email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور *</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.admin_password}
                  onChange={(e) => setF('admin_password', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">رقم هاتف المدير</label>
                <input
                  className="form-input"
                  value={form.admin_phone_number}
                  onChange={(e) => setF('admin_phone_number', e.target.value)}
                />
              </div>
            </div>

            {formError && <div className="error-msg mb-4">{formError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'جاري إنشاء المنشأة...' : 'إنشاء المنشأة والمدير'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
