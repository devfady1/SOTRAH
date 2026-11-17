import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Radio,
  Server,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ownerFleetApi } from '../api/ownerFleetApi';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import QuotaProgressBar from '../components/common/QuotaProgressBar';

const PIE_COLORS = ['#ff5d1a', '#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    Promise.all([ownerFleetApi.getOverview(), ownerFleetApi.getGrowthAnalytics(6)])
      .then(([overviewRes, growthRes]) => {
        setData(overviewRes.overview);
        setGrowthData(growthRes.series || []);
      })
      .catch((err) => {
        console.error('Error loading overview:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
        جاري تحميل مؤشرات وتحليلات مالك المنظومة...
      </div>
    );
  }

  const orgs = data?.organizations || {};
  const users = data?.users || {};
  const vests = data?.vests || {};
  const gateways = data?.gateways || {};
  const revenue = data?.revenue || {};
  const quotaAlerts = data?.quota_alerts || [];
  const recentAudit = data?.recent_audit_logs || [];

  // Industry pie data
  const industryData = Object.entries(orgs.by_industry || {}).map(([key, count]) => ({
    name: key,
    value: count,
  }));

  // Tier pie data
  const tierData = Object.entries(orgs.by_tier || {}).map(([key, count]) => ({
    name: key,
    value: count,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
          نظرة عامة على المنظومة والأسطول (Executive Overview)
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          إحصائيات فورية ومؤشرات نمو المنشآت والكوادر ومخزون السترات الذكية
        </p>
      </div>

      {/* 5 Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <KpiCard
          title="المنشآت المشتركة"
          value={orgs.total || 0}
          subtext={`${orgs.active_accounts || 0} نشطة · ${orgs.inactive_accounts || 0} معلقة`}
          icon={Building2}
          color="var(--sotrah-orange)"
        />
        <KpiCard
          title="إجمالي المستخدمين"
          value={users.total || 0}
          subtext={`${users.active || 0} حساب نشط عبر المنشآت`}
          icon={Users}
          color="var(--sotrah-cyan)"
        />
        <KpiCard
          title="مخزون السترات الذكية"
          value={vests.total || 0}
          subtext={`${vests.by_status?.ACTIVE || 0} تعمل ميدانياً · ${vests.by_status?.IN_STOCK || 0} بالمخزون`}
          icon={Radio}
          color="var(--sotrah-emerald)"
        />
        <KpiCard
          title="بوابات المعالجة Edge"
          value={gateways.total || 0}
          subtext={`${gateways.by_status?.ONLINE || 0} متصلة · ${gateways.by_status?.OFFLINE || 0} أوفلاين`}
          icon={Server}
          color={gateways.by_status?.OFFLINE > 0 ? 'var(--sotrah-red)' : 'var(--sotrah-cyan)'}
          badge={gateways.by_status?.OFFLINE > 0 ? `${gateways.by_status.OFFLINE} أوفلاين` : 'مستقرة'}
        />
        <KpiCard
          title="الإيرادات المحصّلة"
          value={`${Number(revenue.total_paid_egp || 0).toLocaleString()} ج.م`}
          subtext={`${Number(revenue.pending_egp || 0).toLocaleString()} ج.م قيد التحصيل`}
          icon={CreditCard}
          color="#a855f7"
        />
      </div>

      {/* Quota Alerts Banner (if any) */}
      {quotaAlerts.length > 0 && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, marginBottom: '14px' }}>
            <AlertTriangle size={18} />
            <span>تنبيهات استهلاك الحصص (تجاوزت 80% من الطاقة الاستيعابية):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {quotaAlerts.map((alert) => (
              <div
                key={alert.organization_id}
                style={{
                  background: 'var(--bg-card-solid)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>{alert.organization_name}</span>
                  <Link
                    to={`/organizations/${alert.organization_id}`}
                    style={{
                      fontSize: '11px',
                      color: 'var(--sotrah-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>ترقية الباقة</span>
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
                <QuotaProgressBar
                  used={alert.users_used}
                  max={alert.max_users}
                  label="المستخدمون"
                  unit="مستخدم"
                />
                <QuotaProgressBar
                  used={alert.vests_used}
                  max={alert.max_vests}
                  label="السترات"
                  unit="سترة"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Monthly Growth Chart */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--sotrah-orange)" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                نمو المنشآت والكوادر خلال آخر 6 أشهر
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer>
              <BarChart data={growthData}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#101218',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="organizations_created" name="المنشآت" fill="#ff5d1a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users_created" name="الكوادر" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vests_registered" name="السترات" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Industry Breakdown Pie */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            توزيع المنشآت حسب القطاع الصناعي
          </span>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#101218',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            {industryData.map((item, idx) => (
              <span key={item.name} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span>{item.name}: {item.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Logs (5 entries) */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="var(--sotrah-cyan)" />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              آخر عمليات التدقيق وأنشطة المنظومة (Recent Audit Trail)
            </span>
          </div>
          <Link to="/audit-logs" style={{ fontSize: '12px', color: 'var(--sotrah-orange)', fontWeight: 600 }}>
            عرض كل السجل ↗
          </Link>
        </div>

        {recentAudit.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '13px' }}>
            لا توجد سجلات تدقيق حديثة حتى الآن.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentAudit.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={log.action} label={log.action} />
                  <span style={{ color: '#fff', fontWeight: 600 }}>{log.actor_email}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>• {log.target_label || log.target_type}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  {log.created_at}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
