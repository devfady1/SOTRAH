import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('superadmin@sotrah.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'فشل تسجيل الدخول. يرجى التأكد من البريد وكلمة المرور وصلاحية مالك النظام.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('superadmin@sotrah.com');
    setPassword('SuperAdmin123!');
    setError(null);
  };

  const fillCompanyAdmin = () => {
    setEmail('admin@sotrah.com');
    setPassword('SotrahAdmin123!');
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 100% 60% at 50% 0%, #171a26 0%, var(--bg-obsidian) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-card-solid)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.8)',
          textAlign: 'center',
        }}
      >
        {/* Brand Logo in Black Frame */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#000000',
            border: '1px solid rgba(255, 93, 26, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(255, 93, 26, 0.25)',
          }}
        >
          <img src="/assets/logo.png" alt="Sotrah" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
          لوحة تحكم مالك المنظومة
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          SOTRAH Super Admin Platform
        </p>

        {/* Quick Credentials Testing Bar */}
        <div style={{ marginBottom: '20px', textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} color="var(--sotrah-orange)" />
            <span>تجربة الصلاحيات السريعة:</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={fillSuperAdmin}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid var(--sotrah-orange)',
                background: 'rgba(255, 93, 26, 0.1)',
                color: 'var(--sotrah-orange)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              مالك النظام (مسموح) ✓
            </button>
            <button
              type="button"
              onClick={fillCompanyAdmin}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              مدير شركة (ممنوع) ✕
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '12px',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'right',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#e5e7eb', marginBottom: '6px' }}>
              البريد الإلكتروني المعتمد لمالك المنظومة
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@sotrah.com"
                style={inputStyle}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#6b7280' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e5e7eb' }}>كلمة المرور</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'إخفاء' : 'إظهار'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#6b7280' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--sotrah-orange) 0%, #ff8c38 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              marginTop: '8px',
              boxShadow: '0 8px 24px rgba(255, 93, 26, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'جاري التحقق والمصادقة...' : 'دخول لوحة المالك (Super Admin)'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '11px', color: 'var(--text-muted)' }}>
          محمية بتشفير الجلسات وحصانة صلاحيات Root Super Admin لمنظومة سُترة
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px 11px 36px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
};
