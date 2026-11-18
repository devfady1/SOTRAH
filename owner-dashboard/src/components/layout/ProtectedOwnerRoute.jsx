import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogOut } from 'lucide-react';

export default function ProtectedOwnerRoute() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: 'var(--text-muted)',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 24 }}>⏳</div>
        <div>جاري التحقق من هوية وصلاحيات مالك النظام...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'SUPER_ADMIN') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 20,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={36} color="var(--sotrah-red)" />
        </div>
        <div>
          <h2 style={{ color: 'var(--sotrah-red)', fontSize: 22, marginBottom: 8 }}>
            غير مصرح بالوصول (403 Forbidden)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 420 }}>
            هذه اللوحة مخصصة حصرياً لمالك النظام العام (Super Admin). دورك الحالي هو: <strong>{user.role}</strong>.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            logout();
            window.location.href = '/login';
          }}
        >
          <LogOut size={16} /> تسجيل الخروج والدخول بحساب مالك النظام
        </button>
      </div>
    );
  }

  return <Outlet />;
}
