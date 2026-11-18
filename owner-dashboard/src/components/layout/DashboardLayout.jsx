import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHealth } from '../../api/ownerTenantsApi';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Shield,
  Users,
  FileText,
  Megaphone,
  LogOut,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'نظرة عامة', end: true },
  { to: '/organizations', icon: Building2, label: 'المنشآت المشتركة' },
  { to: '/subscriptions', icon: CreditCard, label: 'الباقات والفواتير' },
  { to: '/fleet', icon: Shield, label: 'أسطول العتاد' },
  { to: '/users', icon: Users, label: 'المستخدمون' },
  { to: '/audit-logs', icon: FileText, label: 'سجل التدقيق' },
  { to: '/announcements', icon: Megaphone, label: 'إعلانات المنصة' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealth()
      .then((res) => setHealth(res.data?.health))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHealthy = health?.status === 'healthy';
  const hasWarning = health && (health.offline_gateways_count > 0 || health.maintenance_vests_count > 0 || health.overdue_invoices_count > 0);
  const healthClass = !health ? 'warning' : hasWarning ? 'warning' : 'healthy';

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>سُترة | SOTRAH</h2>
          <span>لوحة تحكم مالك المنظومة (Owner)</span>
        </div>

        <nav className="nav-items">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'مالك النظام'}
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, wordBreak: 'break-all' }}>
            {user?.email}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="topbar">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>نظام سُترة السحابي</span>
            <span style={{ color: 'var(--border-highlight)' }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>بوابة الإدارة المركزية</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className={`health-dot ${healthClass}`} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginRight: 6 }}>
                {isHealthy ? 'النظام سليم وقاعدة البيانات متصلة' : 'جاري فحص مؤشرات النظام'}
              </span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
