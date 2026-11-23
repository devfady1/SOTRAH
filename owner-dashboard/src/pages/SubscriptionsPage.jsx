import React, { useEffect, useState, useCallback } from 'react';
import {
  getPlans,
  updatePlan,
  getInvoices,
  createInvoice,
  markInvoicePaid,
  getOrganizations,
} from '../api/ownerTenantsApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { Plus, Edit, CheckCircle, Search, CreditCard, Receipt } from 'lucide-react';

const TIER_LABELS = {
  FREE_TRIAL: 'تجريبية مجانية',
  STARTER: 'ستارتر (الأساسية)',
  PROFESSIONAL: 'احترافية (بروفيشنال)',
  ENTERPRISE: 'مؤسسية (إنتربرايز)',
};

const PAYMENT_METHODS = ['BANK_TRANSFER', 'INSTAPAY', 'CARD', 'CASH'];
const PM_LABELS = {
  BANK_TRANSFER: 'تحويل بنكي',
  INSTAPAY: 'إنستاباي (InstaPay)',
  CARD: 'بطاقة ائتمانية / ميزة',
  CASH: 'دفع نقدي',
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [invoices, setInvoices] = useState({ count: 0, results: [] });
  const [organizations, setOrganizations] = useState([]);
  const [page, setPage] = useState(1);
  const [invFilters, setInvFilters] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(false);

  // Edit Plan
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({});
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planError, setPlanError] = useState('');

  // Create Invoice
  const [showCreateInv, setShowCreateInv] = useState(false);
  const [invForm, setInvForm] = useState({
    organization: '',
    plan: '',
    amount_egp: '',
    due_date: '',
    payment_method: '',
    notes: '',
  });
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [invError, setInvError] = useState('');

  // Mark Invoice Paid
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [markingInv, setMarkingInv] = useState(null);
  const [paidForm, setPaidForm] = useState({
    payment_method: 'BANK_TRANSFER',
    extend_subscription: true,
    extend_days: 30,
    notes: '',
  });
  const [paidSubmitting, setPaidSubmitting] = useState(false);
  const [paidError, setPaidError] = useState('');

  useEffect(() => {
    getPlans()
      .then((res) => {
        const list = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
        setPlans(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error(err);
        setPlans([]);
      });

    getOrganizations({ page_size: 100 })
      .then((res) => {
        const list = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
        setOrganizations(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error(err);
        setOrganizations([]);
      });
  }, []);

  const loadInvoices = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: 20,
      ...Object.fromEntries(Object.entries(invFilters).filter(([, v]) => v !== '')),
    };
    getInvoices(params)
      .then((res) => {
        const d = res?.data;
        if (d && Array.isArray(d.results)) {
          setInvoices(d);
        } else if (Array.isArray(d)) {
          setInvoices({ count: d.length, results: d });
        } else {
          setInvoices({ count: 0, results: [] });
        }
      })
      .catch((err) => {
        console.error(err);
        setInvoices({ count: 0, results: [] });
      })
      .finally(() => setLoading(false));
  }, [page, invFilters]);

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices();
    }
  }, [activeTab, loadInvoices]);

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      monthly_price_egp: plan.monthly_price_egp,
      annual_price_egp: plan.annual_price_egp,
      default_max_vests: plan.default_max_vests,
      default_max_users: plan.default_max_users,
    });
    setPlanError('');
    setShowEditPlan(true);
  };

  const handleEditPlan = async (e) => {
    e.preventDefault();
    setPlanSubmitting(true);
    setPlanError('');
    try {
      await updatePlan(editingPlan.id, planForm);
      setShowEditPlan(false);
      const res = await getPlans();
      const list = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
      setPlans(Array.isArray(list) ? list : []);
    } catch (err) {
      setPlanError(err.response?.data?.message || 'فشل تحديث الباقة');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const handleCreateInv = async (e) => {
    e.preventDefault();
    setInvSubmitting(true);
    setInvError('');
    try {
      const payload = { ...invForm };
      if (!payload.payment_method) delete payload.payment_method;
      if (!payload.notes) delete payload.notes;
      await createInvoice(payload);
      setShowCreateInv(false);
      setInvForm({
        organization: '',
        plan: '',
        amount_egp: '',
        due_date: '',
        payment_method: '',
        notes: '',
      });
      loadInvoices();
    } catch (err) {
      setInvError(err.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setInvSubmitting(false);
    }
  };

  const openMarkPaid = (inv) => {
    setMarkingInv(inv);
    setPaidForm({
      payment_method: inv.payment_method || 'BANK_TRANSFER',
      extend_subscription: true,
      extend_days: 30,
      notes: '',
    });
    setPaidError('');
    setShowMarkPaid(true);
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setPaidSubmitting(true);
    setPaidError('');
    try {
      await markInvoicePaid(markingInv.id, paidForm);
      setShowMarkPaid(false);
      loadInvoices();
    } catch (err) {
      setPaidError(err.response?.data?.message || 'فشل تأكيد سداد الفاتورة');
    } finally {
      setPaidSubmitting(false);
    }
  };

  const plansList = Array.isArray(plans) ? plans : [];
  const invoicesList = Array.isArray(invoices?.results) ? invoices.results : [];
  const orgsList = Array.isArray(organizations) ? organizations : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">الباقات والاشتراكات والفواتير</h1>
          <p className="page-subtitle">تسعير الباقات ومتابعة فواتير الشركات وتأكيد السداد</p>
        </div>
        {activeTab === 'invoices' && (
          <button className="btn btn-primary" onClick={() => setShowCreateInv(true)}>
            <Plus size={16} /> إصدار فاتورة جديدة
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          <CreditCard size={14} style={{ display: 'inline', marginLeft: 6 }} />
          باقات الاشتراك المعتمدة
        </button>
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <Receipt size={14} style={{ display: 'inline', marginLeft: 6 }} />
          سجل فواتير المنشآت
        </button>
      </div>

      {activeTab === 'plans' && (
        <div className="grid-2">
          {plansList.map((plan) => (
            <div key={plan.id} className="kpi-card" style={{ position: 'relative' }}>
              <div
                className="flex items-center"
                style={{ justifyContent: 'space-between', marginBottom: 16 }}
              >
                <div>
                  <StatusBadge status={plan.tier} />
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    {plan.name_ar || plan.name_en}
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEditPlan(plan)}
                >
                  <Edit size={13} /> تعديل الأسعار والحصص
                </button>
              </div>

              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--sotrah-orange)' }}>
                {Number(plan.monthly_price_egp || 0).toLocaleString()}{' '}
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>ج.م / شهرياً</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                {Number(plan.annual_price_egp || 0).toLocaleString()} ج.م / سنوياً
              </div>

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  الحد الافتراضي للسترات:{' '}
                  <strong className="mono" style={{ color: 'var(--text-primary)' }}>
                    {plan.default_max_vests} سترة
                  </strong>
                </div>
                <div>
                  الحد الافتراضي للمستخدمين:{' '}
                  <strong className="mono" style={{ color: 'var(--text-primary)' }}>
                    {plan.default_max_users} مستخدم
                  </strong>
                </div>
                {plan.trial_days > 0 && (
                  <div>
                    فترة التجربة المجانية:{' '}
                    <strong style={{ color: 'var(--sotrah-cyan)' }}>
                      {plan.trial_days} يوم
                    </strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'invoices' && (
        <>
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
                placeholder="بحث برقم الفاتورة أو اسم المنشأة..."
                value={invFilters.search}
                onChange={(e) => {
                  setInvFilters((f) => ({ ...f, search: e.target.value }));
                  setPage(1);
                }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={invFilters.status}
              onChange={(e) => {
                setInvFilters((f) => ({ ...f, status: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              <option value="PENDING">قيد الانتظار</option>
              <option value="PAID">مدفوعة</option>
              <option value="OVERDUE">متأخرة</option>
              <option value="CANCELLED">ملغاة</option>
            </select>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">جاري تحميل الفواتير...</div>
            ) : invoicesList.length === 0 ? (
              <div className="empty-state">لا توجد فواتير مطابقة</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>المنشأة</th>
                    <th>المبلغ المستحق</th>
                    <th>طريقة الدفع</th>
                    <th>حالة الفاتورة</th>
                    <th>تاريخ الاستحقاق</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesList.map((inv) => (
                    <tr key={inv.id}>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {inv.invoice_number || inv.id?.slice(0, 8)}
                      </td>
                      <td className="text-primary" style={{ fontWeight: 600 }}>
                        {inv.organization_name || inv.organization}
                      </td>
                      <td style={{ color: 'var(--sotrah-cyan)', fontWeight: 700 }}>
                        {Number(inv.amount_egp || 0).toLocaleString()} ج.م
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {PM_LABELS[inv.payment_method] || inv.payment_method || '—'}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td>
                        {['PENDING', 'OVERDUE'].includes(inv.status) ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => openMarkPaid(inv)}
                          >
                            <CheckCircle size={13} /> تأكيد السداد
                          </button>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>مكتملة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination count={invoices.count || 0} page={page} onChange={setPage} />
        </>
      )}

      {/* Edit Plan Modal */}
      {showEditPlan && editingPlan && (
        <Modal
          title={`تعديل باقة: ${TIER_LABELS[editingPlan.tier] || editingPlan.tier}`}
          onClose={() => setShowEditPlan(false)}
        >
          <form onSubmit={handleEditPlan}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">السعر الشهري (ج.م)</label>
                <input
                  type="number"
                  className="form-input"
                  value={planForm.monthly_price_egp || ''}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, monthly_price_egp: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">السعر السنوي (ج.م)</label>
                <input
                  type="number"
                  className="form-input"
                  value={planForm.annual_price_egp || ''}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, annual_price_egp: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الحد الأقصى الافتراضي للسترات</label>
                <input
                  type="number"
                  className="form-input"
                  value={planForm.default_max_vests || ''}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, default_max_vests: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الحد الأقصى الافتراضي للمستخدمين</label>
                <input
                  type="number"
                  className="form-input"
                  value={planForm.default_max_users || ''}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, default_max_users: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            {planError && <div className="error-msg mb-4">{planError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowEditPlan(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={planSubmitting}>
                {planSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Invoice Modal */}
      {showCreateInv && (
        <Modal title="إصدار فاتورة جديدة لمنشأة" onClose={() => setShowCreateInv(false)}>
          <form onSubmit={handleCreateInv}>
            <div className="form-group">
              <label className="form-label">المنشأة المستهدفة *</label>
              <select
                className="form-select"
                value={invForm.organization}
                onChange={(e) => setInvForm((f) => ({ ...f, organization: e.target.value }))}
                required
              >
                <option value="">اختر المنشأة</option>
                {orgsList.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({TIER_LABELS[org.subscription_tier] || org.subscription_tier})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">باقة الاشتراك *</label>
              <select
                className="form-select"
                value={invForm.plan}
                onChange={(e) => setInvForm((f) => ({ ...f, plan: e.target.value }))}
                required
              >
                <option value="">اختر الباقة</option>
                {plansList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {TIER_LABELS[p.tier] || p.tier} — {Number(p.monthly_price_egp).toLocaleString()} ج.م
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">المبلغ المطلوب (ج.م) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={invForm.amount_egp}
                  onChange={(e) => setInvForm((f) => ({ ...f, amount_egp: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">تاريخ الاستحقاق *</label>
                <input
                  type="date"
                  className="form-input"
                  value={invForm.due_date}
                  onChange={(e) => setInvForm((f) => ({ ...f, due_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">طريقة السداد المتوقعة</label>
              <select
                className="form-select"
                value={invForm.payment_method}
                onChange={(e) => setInvForm((f) => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="">غير محددة (اختياري)</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PM_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ملاحظات الفاتورة</label>
              <input
                className="form-input"
                placeholder="مثال: دفعة تجديد سنوية مع توريد 10 سترات إضافية"
                value={invForm.notes}
                onChange={(e) => setInvForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {invError && <div className="error-msg mb-4">{invError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCreateInv(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={invSubmitting}>
                {invSubmitting ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Paid Modal */}
      {showMarkPaid && markingInv && (
        <Modal
          title={`تأكيد سداد الفاتورة #${markingInv.invoice_number || markingInv.id?.slice(0, 8)}`}
          onClose={() => setShowMarkPaid(false)}
        >
          <form onSubmit={handleMarkPaid}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>المنشأة:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {markingInv.organization_name || markingInv.organization}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                المبلغ المسدد:
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--sotrah-emerald)' }}>
                {Number(markingInv.amount_egp || 0).toLocaleString()} ج.م
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">طريقة الدفع الفعلية *</label>
              <select
                className="form-select"
                value={paidForm.payment_method}
                onChange={(e) => setPaidForm((f) => ({ ...f, payment_method: e.target.value }))}
                required
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PM_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={paidForm.extend_subscription}
                  onChange={(e) =>
                    setPaidForm((f) => ({ ...f, extend_subscription: e.target.checked }))
                  }
                />
                تمديد تاريخ نهاية اشتراك المنشأة تلقائياً
              </label>
            </div>

            {paidForm.extend_subscription && (
              <div className="form-group">
                <label className="form-label">عدد أيام التمديد</label>
                <input
                  type="number"
                  className="form-input"
                  value={paidForm.extend_days}
                  onChange={(e) =>
                    setPaidForm((f) => ({ ...f, extend_days: Number(e.target.value) }))
                  }
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">ملاحظات السداد أو رقم التحويل</label>
              <input
                className="form-input"
                placeholder="رقم مرجع الإيصال البنكي أو المعاملة"
                value={paidForm.notes}
                onChange={(e) => setPaidForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {paidError && <div className="error-msg mb-4">{paidError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowMarkPaid(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-success" disabled={paidSubmitting}>
                {paidSubmitting ? 'جاري الاعتماد...' : 'اعتماد السداد'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
