import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowRight,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Radio,
} from 'lucide-react';
import { ownerTenantsApi } from '../api/ownerTenantsApi';
import StatusBadge from '../components/common/StatusBadge';
import QuotaProgressBar from '../components/common/QuotaProgressBar';
import Modal from '../components/common/Modal';

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [admins, setAdmins] = useState([]);

  // Edit Quotas Form
  const [tier, setTier] = useState('');
  const [maxVests, setMaxVests] = useState(5);
  const [maxUsers, setMaxUsers] = useState(15);
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [quotaMessage, setQuotaMessage] = useState(null);

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState('suspend');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    ownerTenantsApi
      .getOrganization(id)
      .then((res) => {
        setOrg(res.organization);
        setProfile(res.subscription_profile);
        setInvoices(res.recent_invoices || []);
        setAdmins(res.company_admins || []);

        setTier(res.organization.subscription_tier);
        setMaxVests(res.organization.max_vests);
        setMaxUsers(res.organization.max_users);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSaveQuotas = async (e) => {
    e.preventDefault();
    setSavingQuotas(true);
    setQuotaMessage(null);
    try {
      const res = await ownerTenantsApi.updateOrganization(id, {
        subscription_tier: tier,
        max_vests: parseInt(maxVests) || 5,
        max_users: parseInt(maxUsers) || 15,
      });
      setOrg(res.organization);
      setQuotaMessage('تم تحديث الحصص والباقة بنجاح.');
    } catch (err) {
      setQuotaMessage(err.response?.data?.message || 'فشل تحديث الحصص.');
    } finally {
      setSavingQuotas(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    setStatusLoading(true);
    try {
      await ownerTenantsApi.setOrganizationStatus(id, statusAction, statusReason);
      setStatusModalOpen(false);
      setStatusReason('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تغيير حالة المنشأة.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        جاري تحميل تفاصيل المنشأة...
      </div>
    );
  }

  if (!org) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--sotrah-red)' }}>
        المنشأة غير موجودة أو تم حذفها.
      </div>
    );
  }

  const isSuspended = org.subscription_status === 'SUSPENDED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Breadcrumb & Status Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/organizations"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowRight size={14} />
            <span>العودة لقائمة المنشآت</span>
          </Link>

          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>{org.name}</h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>UUID: {org.id}</div>
          </div>
        </div>

        {/* Suspend / Activate Button */}
        <button
          type="button"
          onClick={() => {
            setStatusAction(isSuspended ? 'activate' : 'suspend');
            setStatusModalOpen(true);
          }}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isSuspended ? '#10b981' : '#ef4444'}`,
            color: isSuspended ? '#10b981' : '#f87171',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ShieldAlert size={16} />
          <span>{isSuspended ? 'إلغاء التعليق وإعادة التفعيل' : 'تعليق حساب المنشأة (Suspend)'}</span>
        </button>
      </div>

      {/* Main Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Organization Profile Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>بيانات المنشأة والسجل</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>القطاع: </span>
              <strong style={{ color: '#fff' }}>{org.industry_display || org.industry}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>حالة الاشتراك: </span>
              <StatusBadge status={org.subscription_status} label={org.subscription_status_display} />
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>البريد المعتمد: </span>
              <span style={{ color: '#fff' }}>{org.contact_email || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>الهاتف: </span>
              <span style={{ color: '#fff' }}>{org.contact_phone || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>السجل التجاري: </span>
              <span style={{ color: '#fff' }}>{org.commercial_registration || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>الرقم الضريبي: </span>
              <span style={{ color: '#fff' }}>{org.tax_number || '—'}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              الاستهلاك الحالي للحصص:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <QuotaProgressBar used={org.users_count} max={org.max_users} label="الكوادر والمستخدمين" unit="مستخدم" />
              <QuotaProgressBar used={org.vests_count} max={org.max_vests} label="السترات الذكية المخصصة" unit="سترة" />
            </div>
          </div>
        </div>

        {/* Quota & Plan Modification Form */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            تعديل الباقة والحصص المرخصة
          </div>

          {quotaMessage && (
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px' }}>
              {quotaMessage}
            </div>
          )}

          <form onSubmit={handleSaveQuotas} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>باقة الاشتراك الحالية</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)} style={inputStyle}>
                <option value="FREE_TRIAL">فترة تجريبية (Free Trial)</option>
                <option value="STARTER">الأساسية (Starter)</option>
                <option value="PROFESSIONAL">المتقدمة (Professional)</option>
                <option value="ENTERPRISE">المؤسسات (Enterprise)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>أقصى عدد سترات (Max Vests)</label>
                <input
                  type="number"
                  min="1"
                  value={maxVests}
                  onChange={(e) => setMaxVests(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>أقصى عدد مستخدمين (Max Users)</label>
                <input
                  type="number"
                  min="1"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingQuotas}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--sotrah-orange)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: savingQuotas ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <Save size={15} />
              <span>{savingQuotas ? 'جاري الحفظ...' : 'حفظ التعديلات على الحصص'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Company Admins List */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          مديرو المنشأة (Company Admins)
        </div>

        {admins.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>لا يوجد مدير مسجل حالياً.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {admins.map((adm) => (
              <div
                key={adm.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{adm.full_name || `${adm.first_name} ${adm.last_name}`}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{adm.email} · {adm.phone_number || 'بدون هاتف'}</div>
                </div>
                <StatusBadge status={adm.is_active ? 'ACTIVE' : 'SUSPENDED'} label={adm.is_active ? 'نشط' : 'معطل'} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          سجل فواتير واشتراكات المنشأة (Recent Invoices)
        </div>

        {invoices.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>لا توجد فواتير لهذه المنشأة حتى الآن.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px' }}>رقم الفاتورة</th>
                <th style={{ padding: '10px' }}>المبلغ</th>
                <th style={{ padding: '10px' }}>الحالة</th>
                <th style={{ padding: '10px' }}>تاريخ الاستحقاق</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px', color: '#fff', fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</td>
                  <td style={{ padding: '10px', color: '#fff' }}>{inv.amount_egp} ج.م</td>
                  <td style={{ padding: '10px' }}><StatusBadge status={inv.status} /></td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{inv.due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Suspend / Activate Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={statusAction === 'suspend' ? 'تأكيد تعليق حساب المنشأة' : 'تأكيد تفعيل المنشأة'}
        maxWidth="480px"
      >
        <form onSubmit={handleStatusChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {statusAction === 'suspend'
              ? 'عند تعليق المنشأة، سيتم منع جميع موظفيها ومديريها من تسجيل الدخول فوراً حتى إعادة التفعيل.'
              : 'سيتم إعادة تنشيط المنشأة واستئناف صلاحيات الدخول لجميع المستخدمين والسترات المرتبطة.'}
          </p>

          <div>
            <label style={labelStyle}>سبب الإجراء (Reason) *</label>
            <textarea
              required
              rows={3}
              placeholder="مثال: انتهاء فترة التجربة / تأخر سداد الفاتورة / طلب العميل..."
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={statusLoading}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: statusAction === 'suspend' ? 'var(--sotrah-red)' : 'var(--sotrah-emerald)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: statusLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {statusLoading ? 'جاري التنفيذ...' : 'تأكيد الإجراء'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '5px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
};
