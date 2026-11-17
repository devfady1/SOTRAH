import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Radio,
  Users,
  ShieldCheck,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ownerFleetApi } from '../../api/ownerFleetApi';

const NAV_ITEMS = [
  { to: '/', label: 'نظرة عامة والتحليلات', icon: LayoutDashboard },
  { to: '/organizations', label: 'المنشآت والشركات', icon: Building2 },
  { to: '/subscriptions', label: 'الباقات والفواتير', icon: CreditCard },
  { to: '/fleet', label: 'أسطول السترات والبوابات', icon: Radio },
  { to: '/users', label: 'مستخدمو المنصة', icon: Users },
  { to: '/audit-logs', label: 'سجل التدقيق والأمان', icon: ShieldCheck },
  { to: '/announcements', label: 'الإعلانات وصحة النظام', icon: Bell },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    ownerFleetApi
      .getHealth()
      .then((data) => setHealth(data.health))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-obsidian)' }}>
      {/* RTL Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-card-solid)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#000',
              border: '1px solid rgba(255, 93, 26, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
          >
            <img src="/assets/logo.png" alt="Sotrah" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>سُترة</span>
              <span style={{ fontSize: '10px', background: 'rgba(255, 93, 26, 0.2)', color: 'var(--sotrah-orange)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Owner
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>لوحة الإشراف العام للشركة الأم</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'rgba(255, 93, 26, 0.14)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? 'rgba(255, 93, 26, 0.35)' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--sotrah-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user?.first_name ? user.first_name.charAt(0) : 'S'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name || user?.first_name || 'مالك النظام'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--sotrah-orange)', fontWeight: 600 }}>Super Admin</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="تسجيل الخروج"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: '64px',
            background: 'var(--bg-card-solid)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          {/* System Health Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: health?.status === 'healthy' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: `1px solid ${health?.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                color: health?.status === 'healthy' ? '#10b981' : '#f59e0b',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: health?.status === 'healthy' ? '#10b981' : '#f59e0b',
                  boxShadow: `0 0 8px ${health?.status === 'healthy' ? '#10b981' : '#f59e0b'}`,
                }}
              />
              <span>
                {health?.status === 'healthy'
                  ? 'قاعدة البيانات متصلة · النظام سليم'
                  : 'جاري فحص حالة السيرفر...'}
              </span>
            </div>

            {health?.offline_gateways_count > 0 && (
              <span style={{ fontSize: '11px', color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', padding: '4px 8px', borderRadius: '6px' }}>
                {health.offline_gateways_count} بوابات أوفلاين
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div>
              الخادم: <strong style={{ color: '#fff' }}>Django SaaS REST</strong>
            </div>
            <a
              href="http://127.0.0.1:5173/"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--sotrah-orange)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>معاينة صفحة العرض (Landing) ↗</span>
            </a>
          </div>
        </header>

        {/* Page Outlet */}
        <main style={{ flex: 1, padding: '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
