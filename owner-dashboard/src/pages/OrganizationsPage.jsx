import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search, Filter, ArrowUpRight, Check, X } from 'lucide-react';
import { ownerTenantsApi } from '../api/ownerTenantsApi';
import { authApi } from '../api/authApi';
import StatusBadge from '../components/common/StatusBadge';
import QuotaProgressBar from '../components/common/QuotaProgressBar';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ count: 0, results: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [industries, setIndustries] = useState([]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    industry: 'MANUFACTURING',
    subscription_tier: 'FREE_TRIAL',
    billing_cycle: 'MONTHLY',
    max_vests: 5,
    max_users: 15,
    contact_email: '',
    contact_phone: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
    admin_phone_number: '',
  });

  const loadOrganizations = (page = 1) => {
    setLoading(true);
    const params = {
      page,
      page_size: 15,
      search: search || undefined,
      industry: industryFilter || undefined,
      subscription_tier: tierFilter || undefined,
    };
    ownerTenantsApi
      .getOrganizations(params)
      .then((res) => {
        setData(res);
        setCurrentPage(page);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    authApi.getIndustries().then(setIndustries);
    loadOrganizations(1);
  }, [industryFilter, tierFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOrganizations(1);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await ownerTenantsApi.createOrganization(newOrgForm);
      setIsModalOpen(false);
      setNewOrgForm({
        name: '',
        industry: 'MANUFACTURING',
        subscription_tier: 'FREE_TRIAL',
        billing_cycle: 'MONTHLY',
        max_vests: 5,
        max_users: 15,
        contact_email: '',
        contact_phone: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_email: '',
        admin_password: '',
        admin_phone_number: '',
      });
      loadOrganizations(1);
    } catch (err) {
      setModalError(
        err.response?.data?.message ||
          'فشل إنشاء المنشأة والمسؤول. يرجى التأكد من ملء جميع الحقول الإلزامية.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            إدارة المنشآت والشركات المشتركة (Tenants)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            إدارة الحصص وتراخيص السترات وحسابات مديري الشركات
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setModalError(null);
          }}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'var(--sotrah-orange)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(255, 93, 26, 0.3)',
          }}
        >
          <Plus size={16} />
          <span>إضافة منشأة ومدير جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="البحث باسم المنشأة أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
        </form>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل القطاعات</option>
          {industries.map((ind) => (
            <option key={ind.code} value={ind.code}>
              {ind.label}
            </option>
          ))}
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل الباقات</option>
          <option value="FREE_TRIAL">تجريبية (Free Trial)</option>
          <option value="STARTER">الأساسية (Starter)</option>
          <option value="PROFESSIONAL">المتقدمة (Professional)</option>
          <option value="ENTERPRISE">المؤسسات (Enterprise)</option>
        </select>
      </div>

      {/* Organizations Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
            جاري تحميل المنشآت...
          </div>
        ) : data.results?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            لا توجد منشآت مطابقة لمعايير البحث الحالية.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 18px' }}>اسم المنشأة</th>
                  <th style={{ padding: '14px 18px' }}>القطاع</th>
                  <th style={{ padding: '14px 18px' }}>الباقة</th>
                  <th style={{ padding: '14px 18px' }}>الحالة</th>
                  <th style={{ padding: '14px 18px', width: '180px' }}>استهلاك الكوادر</th>
                  <th style={{ padding: '14px 18px', width: '180px' }}>استهلاك السترات</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((org) => (
                  <tr
                    key={org.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{org.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{org.contact_email || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                      {org.industry_display || org.industry}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 600 }}>
                        {org.subscription_tier_display || org.subscription_tier}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <StatusBadge status={org.subscription_status} label={org.subscription_status_display} />
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <QuotaProgressBar used={org.users_count} max={org.max_users} label="مستخدم" />
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <QuotaProgressBar used={org.vests_count} max={org.max_vests} label="سترة" />
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <Link
                        to={`/organizations/${org.id}`}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <span>التفاصيل</span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          count={data.count}
          pageSize={15}
          currentPage={currentPage}
          onPageChange={(page) => loadOrganizations(page)}
        />
      </div>

      {/* Add Organization Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة منشأة ومدير شركة جديد (New Tenant & Admin)"
        maxWidth="640px"
      >
        {modalError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
            {modalError}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sotrah-orange)' }}>
            1. بيانات المنشأة / الشركة (Tenant Details)
          </div>

          <div>
            <label style={modalLabelStyle}>اسم المنشأة أو المصنع *</label>
            <input
              type="text"
              required
              placeholder="مثال: شركة المقاولون العرب - فرع أسيوط"
              value={newOrgForm.name}
              onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
              style={modalInputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={modalLabelStyle}>القطاع الصناعي *</label>
              <select
                value={newOrgForm.industry}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, industry: e.target.value })}
                style={modalInputStyle}
              >
                {industries.map((ind) => (
                  <option key={ind.code} value={ind.code}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={modalLabelStyle}>باقة الاشتراك *</label>
              <select
                value={newOrgForm.subscription_tier}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, subscription_tier: e.target.value })}
                style={modalInputStyle}
              >
                <option value="FREE_TRIAL">فترة تجريبية (Trial)</option>
                <option value="STARTER">الأساسية (Starter)</option>
                <option value="PROFESSIONAL">المتقدمة (Professional)</option>
                <option value="ENTERPRISE">المؤسسات (Enterprise)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={modalLabelStyle}>الحد الأقصى للسترات (Max Vests)</label>
              <input
                type="number"
                min="1"
                value={newOrgForm.max_vests}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, max_vests: parseInt(e.target.value) || 1 })}
                style={modalInputStyle}
              />
            </div>
            <div>
              <label style={modalLabelStyle}>الحد الأقصى للمستخدمين (Max Users)</label>
              <input
                type="number"
                min="1"
                value={newOrgForm.max_users}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, max_users: parseInt(e.target.value) || 1 })}
                style={modalInputStyle}
              />
            </div>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sotrah-cyan)', marginTop: '8px' }}>
            2. حساب مدير الشركة الأول (Company Admin)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={modalLabelStyle}>الاسم الأول *</label>
              <input
                type="text"
                required
                placeholder="أحمد"
                value={newOrgForm.admin_first_name}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, admin_first_name: e.target.value })}
                style={modalInputStyle}
              />
            </div>
            <div>
              <label style={modalLabelStyle}>اسم العائلة *</label>
              <input
                type="text"
                required
                placeholder="علي"
                value={newOrgForm.admin_last_name}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, admin_last_name: e.target.value })}
                style={modalInputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={modalLabelStyle}>البريد الإلكتروني للدخول *</label>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={newOrgForm.admin_email}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, admin_email: e.target.value })}
                style={modalInputStyle}
              />
            </div>
            <div>
              <label style={modalLabelStyle}>كلمة المرور الابتدائية *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newOrgForm.admin_password}
                onChange={(e) => setNewOrgForm({ ...newOrgForm, admin_password: e.target.value })}
                style={modalInputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={modalLoading}
            style={{
              padding: '13px',
              borderRadius: '10px',
              background: 'var(--sotrah-orange)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: modalLoading ? 'not-allowed' : 'pointer',
              marginTop: '10px',
              opacity: modalLoading ? 0.75 : 1,
            }}
          >
            {modalLoading ? 'جاري إنشاء المنشأة والمسؤول...' : 'تأكيد إنشاء المنشأة والمدير'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

const selectStyle = {
  padding: '9px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
};

const modalLabelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '5px',
};

const modalInputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
};
