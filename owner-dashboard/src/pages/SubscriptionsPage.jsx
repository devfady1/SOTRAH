import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { ownerTenantsApi } from '../api/ownerTenantsApi';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'invoices'
  const [plans, setPlans] = useState([]);
  const [invoicesData, setInvoicesData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);

  // Invoice Filters
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Edit Plan Modal
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ monthly_price_egp: 0, annual_price_egp: 0, default_max_vests: 5, default_max_users: 15 });
  const [planSaving, setPlanSaving] = useState(false);

  // Mark Paid Modal
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('INSTAPAY');
  const [extendSubscription, setExtendSubscription] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  // Create Invoice Modal
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [orgsList, setOrgsList] = useState([]);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    organization: '',
    plan: '',
    amount_egp: 15000,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });
  const [createInvoiceLoading, setCreateInvoiceLoading] = useState(false);

  const loadPlans = () => {
    ownerTenantsApi.getPlans().then(setPlans).catch(console.error);
  };

  const loadInvoices = (page = 1) => {
    setLoading(true);
    ownerTenantsApi
      .getInvoices({
        page,
        page_size: 15,
        status: invoiceStatus || undefined,
        search: invoiceSearch || undefined,
      })
      .then((res) => {
        setInvoicesData(res);
        setInvoicePage(page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlans();
    loadInvoices(1);
    ownerTenantsApi.getOrganizations({ page_size: 100 }).then((res) => setOrgsList(res.results || []));
  }, []);

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices(1);
    }
  }, [invoiceStatus, activeTab]);

  const handleEditPlanSubmit = async (e) => {
    e.preventDefault();
    setPlanSaving(true);
    try {
      await ownerTenantsApi.updatePlan(selectedPlan.id, planForm);
      setSelectedPlan(null);
      loadPlans();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تحديث الباقة');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleMarkPaidSubmit = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    try {
      await ownerTenantsApi.markInvoicePaid(payingInvoice.id, {
        payment_method: paymentMethod,
        extend_subscription: extendSubscription,
      });
      setPayingInvoice(null);
      loadInvoices(invoicePage);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تسجيل السداد');
    } finally {
      setPayLoading(false);
    }
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    setCreateInvoiceLoading(true);
    try {
      await ownerTenantsApi.createInvoice(newInvoiceForm);
      setCreateInvoiceOpen(false);
      loadInvoices(1);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setCreateInvoiceLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            الباقات والفواتير والتحصيل المالي (Billing & Subscriptions)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            إدارة تسعير الباقات وتتبع مستحقات الشركات وسداد الفواتير
          </p>
        </div>

        {activeTab === 'invoices' && (
          <button
            type="button"
            onClick={() => setCreateInvoiceOpen(true)}
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
            }}
          >
            <Plus size={16} />
            <span>إصدار فاتورة جديدة</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'plans' ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
            color: activeTab === 'plans' ? 'var(--sotrah-orange)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'plans' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          باقات الاشتراك (SaaS Plans)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'invoices' ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
            color: activeTab === 'invoices' ? 'var(--sotrah-orange)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'invoices' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          سجل الفواتير والتحصيل (Invoices)
        </button>
      </div>

      {/* TAB 1: PLANS */}
      {activeTab === 'plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{plan.name_ar}</span>
                  <StatusBadge status={plan.is_active ? 'ACTIVE' : 'SUSPENDED'} label={plan.tier} />
                </div>

                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--sotrah-orange)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  {Number(plan.monthly_price_egp).toLocaleString()} ج.م
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}> / شهرياً</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  أو {Number(plan.annual_price_egp).toLocaleString()} ج.م سنوياً
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    أقصى سترات: <strong style={{ color: '#fff' }}>{plan.default_max_vests} سترة</strong>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    أقصى مستخدمين: <strong style={{ color: '#fff' }}>{plan.default_max_users} مستخدم</strong>
                  </div>
                  {plan.trial_days > 0 && (
                    <div style={{ color: 'var(--sotrah-cyan)', fontSize: '12px' }}>
                      فترة تجريبية: {plan.trial_days} يوم
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan(plan);
                  setPlanForm({
                    monthly_price_egp: plan.monthly_price_egp,
                    annual_price_egp: plan.annual_price_egp,
                    default_max_vests: plan.default_max_vests,
                    default_max_users: plan.default_max_users,
                  });
                }}
                style={{
                  marginTop: '20px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Edit2 size={13} />
                <span>تعديل السعر والحدود</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INVOICES */}
      {activeTab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Invoices Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="البحث برقم الفاتورة أو اسم الشركة..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInvoices(1)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px', minWidth: '240px' }}
            />
            <select
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
            >
              <option value="">كل حالات الفواتير</option>
              <option value="PAID">مدفوعة (Paid)</option>
              <option value="PENDING">قيد الانتظار (Pending)</option>
              <option value="OVERDUE">متأخرة (Overdue)</option>
              <option value="CANCELLED">ملغاة (Cancelled)</option>
            </select>
          </div>

          {/* Invoices Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>جاري التحميل...</div>
            ) : invoicesData.results?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>لا توجد فواتير مطابقة.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '14px 18px' }}>رقم الفاتورة</th>
                    <th style={{ padding: '14px 18px' }}>المنشأة</th>
                    <th style={{ padding: '14px 18px' }}>المبلغ</th>
                    <th style={{ padding: '14px 18px' }}>تاريخ الاستحقاق</th>
                    <th style={{ padding: '14px 18px' }}>الحالة</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesData.results.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 600 }}>
                        {inv.organization_name}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--sotrah-orange)', fontWeight: 700 }}>
                        {Number(inv.amount_egp).toLocaleString()} ج.م
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {inv.due_date}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={inv.status} label={inv.status_display} />
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => setPayingInvoice(inv)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#10b981',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            تأكيد السداد (Mark Paid)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pagination
              count={invoicesData.count}
              pageSize={15}
              currentPage={invoicePage}
              onPageChange={(page) => loadInvoices(page)}
            />
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      <Modal isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} title="تعديل باقة الاشتراك">
        <form onSubmit={handleEditPlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              السعر الشهري (ج.م)
            </label>
            <input
              type="number"
              value={planForm.monthly_price_egp}
              onChange={(e) => setPlanForm({ ...planForm, monthly_price_egp: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              السعر السنوي (ج.م)
            </label>
            <input
              type="number"
              value={planForm.annual_price_egp}
              onChange={(e) => setPlanForm({ ...planForm, annual_price_egp: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                أقصى سترات افتراضية
              </label>
              <input
                type="number"
                value={planForm.default_max_vests}
                onChange={(e) => setPlanForm({ ...planForm, default_max_vests: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                أقصى مستخدمين افتراضي
              </label>
              <input
                type="number"
                value={planForm.default_max_users}
                onChange={(e) => setPlanForm({ ...planForm, default_max_users: parseInt(e.target.value) || 1 })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={planSaving}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-orange)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {planSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal isOpen={!!payingInvoice} onClose={() => setPayingInvoice(null)} title="تأكيد تحصيل وسداد الفاتورة">
        <form onSubmit={handleMarkPaidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            الفاتورة: <strong style={{ color: '#fff' }}>{payingInvoice?.invoice_number}</strong>
          </div>
          <div>
            المبلغ: <strong style={{ color: 'var(--sotrah-orange)' }}>{payingInvoice?.amount_egp} ج.م</strong>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              طريقة الدفع المحصلة
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="INSTAPAY">انستاباي (InstaPay)</option>
              <option value="BANK_TRANSFER">تحويل بنكي (Bank Transfer)</option>
              <option value="CARD">بطاقة بنكية (Credit/Debit Card)</option>
              <option value="CASH">نقداً / شيك (Cash / Cheque)</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={extendSubscription}
              onChange={(e) => setExtendSubscription(e.target.checked)}
            />
            <span>تمديد تاريخ انتهاء اشتراك المنشأة تلقائياً وفق دورة الفاتورة</span>
          </label>

          <button
            type="submit"
            disabled={payLoading}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-emerald)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {payLoading ? 'جاري الاعتماد...' : 'تأكيد السداد والتحصيل'}
          </button>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal isOpen={createInvoiceOpen} onClose={() => setCreateInvoiceOpen(false)} title="إصدار فاتورة جديدة لمنشأة">
        <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              المنشأة المستهدفة *
            </label>
            <select
              required
              value={newInvoiceForm.organization}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, organization: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="">اختر الشركة أو المنشأة...</option>
              {orgsList.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              المبلغ الإجمالي (ج.م) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={newInvoiceForm.amount_egp}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, amount_egp: parseFloat(e.target.value) || 0 })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              تاريخ الاستحقاق *
            </label>
            <input
              type="date"
              required
              value={newInvoiceForm.due_date}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, due_date: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <button
            type="submit"
            disabled={createInvoiceLoading}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-orange)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {createInvoiceLoading ? 'جاري الإصدار...' : 'إصدار الفاتورة'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
