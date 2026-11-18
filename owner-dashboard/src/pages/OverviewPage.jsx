import { useEffect, useState } from 'react';
import { getOverview, getGrowth } from '../api/ownerTenantsApi';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, Users, Shield, Wifi, DollarSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#ff5d1a', '#10b981', '#38bdf8', '#f59e0b', '#ef4444'];

export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getOverview(), getGrowth(6)]).then(([ovRes, grRes]) => {
      setOverview(ovRes.data?.overview);
      setAuditLogs(ovRes.data?.recent_audit_logs || []);
      setGrowth(grRes.data?.series || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">جاري التحميل...</div>;
  if (!overview) return <div className="empty-state">تعذر تحميل البيانات</div>;

  const { organizations, users, vests, gateways, revenue, quota_alerts = [] } = overview;

  const industryData = Object.entries(organizations.by_industry || {}).map(([k, v]) => ({ name: k, value: v }));
  const tierData = Object.entries(organizations.by_tier || {}).map(([k, v]) => ({ name: k, value: v }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">نظرة عامة على المنصة</h1>
          <p className="page-subtitle">مؤشرات الأداء الرئيسية للمنظومة</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard icon={<Building2 size={18}/>} label="إجمالي المنشآت" value={organizations.total}
          sub={`${organizations.active_accounts} نشطة · ${organizations.inactive_accounts} معلقة`} />
        <KpiCard icon={<Users size={18}/>} label="إجمالي المستخدمين" value={users.total}
          color="var(--sotrah-cyan)" sub={`${users.verified} موثق`} />
        <KpiCard icon={<Shield size={18}/>} label="السترات الذكية" value={vests.total}
          color="var(--sotrah-emerald)" sub={`${vests.by_status?.ACTIVE || 0} نشطة · ${vests.by_status?.MAINTENANCE || 0} صيانة`} />
        <KpiCard icon={<Wifi size={18}/>} label="البوابات المحلية" value={gateways.total}
          color={gateways.by_status?.OFFLINE > 0 ? 'var(--sotrah-amber)' : 'var(--text-primary)'}
          sub={gateways.by_status?.OFFLINE > 0 ? `⚠️ ${gateways.by_status.OFFLINE} غير متصل` : 'جميعها متصلة'} />
        <KpiCard icon={<DollarSign size={18}/>} label="الإيرادات المحصّلة" value={`${Number(revenue.total_paid_egp).toLocaleString()} ج.م`}
          color="var(--sotrah-emerald)" sub={`${Number(revenue.pending_egp).toLocaleString()} ج.م مستحقة`} />
        <KpiCard icon={<AlertTriangle size={18}/>} label="تنبيهات الحصص" value={quota_alerts.length}
          color={quota_alerts.length > 0 ? 'var(--sotrah-amber)' : 'var(--sotrah-emerald)'}
          sub={quota_alerts.length > 0 ? 'منشآت تقترب من الحد الأقصى' : 'لا تنبيهات'} />
      </div>

      {/* Charts */}
      {growth.length > 0 && (
        <div className="grid-2 mb-4">
          <div className="table-wrap" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>النمو الشهري</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growth}>
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="organizations_created" stroke="var(--sotrah-orange)" name="منشآت" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="users_created" stroke="var(--sotrah-cyan)" name="مستخدمون" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vests_registered" stroke="var(--sotrah-emerald)" name="سترات" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="table-wrap" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>توزيع المنشآت بالقطاع</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={industryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {industryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Quota Alerts */}
      {quota_alerts.length > 0 && (
        <div className="table-wrap mb-4">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--sotrah-amber)" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>تنبيهات استهلاك الحصص</h3>
          </div>
          <table>
            <thead>
              <tr><th>المنشأة</th><th>الباقة</th><th>المستخدمون</th><th>السترات</th><th></th></tr>
            </thead>
            <tbody>
              {quota_alerts.map(a => (
                <tr key={a.organization_id}>
                  <td className="text-primary">{a.organization_name}</td>
                  <td><StatusBadge status={a.subscription_tier} /></td>
                  <td><span style={{ color: a.users_usage_pct >= 90 ? 'var(--sotrah-red)' : 'var(--sotrah-amber)' }}>{a.users_used}/{a.max_users} ({a.users_usage_pct}%)</span></td>
                  <td><span style={{ color: a.vests_usage_pct >= 90 ? 'var(--sotrah-red)' : 'var(--sotrah-amber)' }}>{a.vests_used}/{a.max_vests} ({a.vests_usage_pct}%)</span></td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/organizations/${a.organization_id}`)}>ترقية الباقة</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Audit Logs */}
      {auditLogs.length > 0 && (
        <div className="table-wrap">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>آخر عمليات التدقيق</h3>
          </div>
          <table>
            <thead>
              <tr><th>المنفّذ</th><th>العملية</th><th>الهدف</th><th>التاريخ</th></tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 5).map((log, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize: 12 }}>{log.actor_email}</td>
                  <td><span className="badge badge-cyan">{log.action}</span></td>
                  <td style={{ fontSize: 12 }}>{log.target_label || log.target_type}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
