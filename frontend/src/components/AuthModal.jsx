import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Building2,
  HardHat,
  ShieldCheck,
  Stethoscope,
  Users2,
  KeyRound,
  Mail,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import {
  loginUser,
  registerUser,
  fetchIndustries,
  fetchRoles,
} from '../services/authApi';

const DEMO_PRESETS = [
  {
    roleName: 'مدير المنشأة',
    email: 'admin@sotrah.com',
    pass: 'SotrahAdmin123!',
    icon: Building2,
    color: '#ff5d1a',
  },
  {
    roleName: 'مسؤول السلامة HSE',
    email: 'safety@sotrah.com',
    pass: 'SotrahSafety123!',
    icon: ShieldCheck,
    color: '#10b981',
  },
  {
    roleName: 'الطبيب والمسعف',
    email: 'doctor@sotrah.com',
    pass: 'SotrahDoctor123!',
    icon: Stethoscope,
    color: '#38bdf8',
  },
  {
    roleName: 'مدير الموارد HR',
    email: 'hr@sotrah.com',
    pass: 'SotrahHR123!',
    icon: Users2,
    color: '#a855f7',
  },
  {
    roleName: 'عامل ميداني',
    email: 'worker@sotrah.com',
    pass: 'SotrahWorker123!',
    icon: HardHat,
    color: '#f59e0b',
  },
];

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  currentUser,
  onAuthSuccess,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register' | 'profile'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Dynamic Options
  const [industries, setIndustries] = useState([]);
  const [roles, setRoles] = useState([]);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Register Form State
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    national_id: '',
    password: '',
    password_confirm: '',
    create_organization: true,
    organization_name: '',
    organization_industry: 'MANUFACTURING',
    organization_id: '',
    role: 'COMPANY_ADMIN',
  });

  // Reset validation and error states when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setFieldErrors({});
      setSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchIndustries().then(setIndustries);
      fetchRoles().then(setRoles);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const data = await loginUser({
        email: loginForm.email,
        password: loginForm.password,
      });

      setSuccessMessage('تم تسجيل الدخول بنجاح! مرحباً بك.');
      if (onAuthSuccess) onAuthSuccess(data.user);
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('profile');
      }, 900);
    } catch (err) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول.');
      if (typeof err.errors === 'object' && err.errors !== null) {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick check
    if (registerForm.password !== registerForm.password_confirm) {
      setFieldErrors({ password_confirm: ['كلمتا المرور غير متطابقتين.'] });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        first_name: registerForm.first_name,
        last_name: registerForm.last_name,
        email: registerForm.email,
        phone_number: registerForm.phone_number,
        national_id: registerForm.national_id,
        password: registerForm.password,
        password_confirm: registerForm.password_confirm,
        create_organization: registerForm.create_organization,
      };

      if (registerForm.create_organization) {
        payload.organization_name = registerForm.organization_name;
        payload.organization_industry = registerForm.organization_industry;
      } else {
        payload.organization_id = registerForm.organization_id;
        payload.role = registerForm.role;
      }

      const data = await registerUser(payload);
      setSuccessMessage('تم إنشاء الحساب والمنشأة بنجاح! مرحباً بك في سُترة.');
      if (onAuthSuccess) onAuthSuccess(data.user);
      setTimeout(() => {
        setSuccessMessage(null);
        setActiveTab('profile');
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'تعذر إنشاء الحساب، يرجى مراجعة البيانات.');
      if (typeof err.errors === 'object' && err.errors !== null) {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill preset credentials
  const fillPreset = (preset) => {
    setLoginForm({
      email: preset.email,
      password: preset.pass,
    });
    setErrorMessage(null);
    setFieldErrors({});
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(3, 4, 7, 0.88)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: activeTab === 'register' ? '680px' : '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #12141c 0%, #0c0d12 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          position: 'relative',
          padding: '28px',
          color: '#fff',
          direction: 'rtl',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(255, 93, 26, 0.15)',
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
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                بوابة سُترة السحابية · Cloud Portal
              </div>
              <div style={{ fontSize: '12px', color: '#888f9e' }}>
                منظومة تخطيط موارد المؤسسات الطبية والسترة الذكية (Medical HR-ERP)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher (if not viewing profile directly) */}
        {!currentUser && (
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'login' ? '#ff5d1a' : 'transparent',
                color: activeTab === 'login' ? '#fff' : '#9ca3af',
                fontWeight: activeTab === 'login' ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <LogIn size={16} />
              <span>تسجيل الدخول (Login)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
                setFieldErrors({});
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'register' ? '#ff5d1a' : 'transparent',
                color: activeTab === 'register' ? '#fff' : '#9ca3af',
                fontWeight: activeTab === 'register' ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <UserPlus size={16} />
              <span>إنشاء حساب جديد (Register)</span>
            </button>
          </div>
        )}

        {/* Global Notifications */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#6ee7b7',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>{successMessage}</div>
          </div>
        )}

        {/* ==============================================================
            TAB 1: LOGIN VIEW
        ============================================================== */}
        {activeTab === 'login' && !currentUser && (
          <div>
            {/* Quick Demo Accounts Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9ca3af',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={13} color="#ff5d1a" />
                <span>اختر حساباً تجريبياً جاهزاً للتجربة بضغطة زر (Demo Logins):</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                {DEMO_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = loginForm.email === preset.email;
                  return (
                    <button
                      key={preset.email}
                      type="button"
                      onClick={() => fillPreset(preset)}
                      style={{
                        background: isSelected ? 'rgba(255, 93, 26, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: `1px solid ${isSelected ? preset.color : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '8px',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Icon size={14} color={preset.color} />
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.roleName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email / Username Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#d1d5db' }}>
                  البريد الإلكتروني أو اسم المستخدم
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="name@company.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    style={inputStyle}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#6b7280' }} />
                </div>
                {fieldErrors.email && (
                  <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
                    {Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#d1d5db' }}>كلمة المرور</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showPassword ? 'إخفاء' : 'إظهار'}</span>
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    style={inputStyle}
                  />
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#6b7280' }} />
                </div>
                {fieldErrors.password && (
                  <div style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
                    {Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...btnPrimaryStyle,
                  marginTop: '8px',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? (
                  <span>جاري التحقق وتسجيل الدخول...</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>تسجيل الدخول إلى سُترة</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ==============================================================
            TAB 2: REGISTER VIEW
        ============================================================== */}
        {activeTab === 'register' && !currentUser && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Account Type Selector */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '6px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setRegisterForm({ ...registerForm, create_organization: true })}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: registerForm.create_organization ? '1px solid #ff5d1a' : '1px solid transparent',
                  background: registerForm.create_organization ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
                  color: registerForm.create_organization ? '#fff' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Building2 size={16} color={registerForm.create_organization ? '#ff5d1a' : '#9ca3af'} />
                <span>إنشاء منشأة / شركة جديدة</span>
              </button>

              <button
                type="button"
                onClick={() => setRegisterForm({ ...registerForm, create_organization: false })}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: !registerForm.create_organization ? '1px solid #ff5d1a' : '1px solid transparent',
                  background: !registerForm.create_organization ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
                  color: !registerForm.create_organization ? '#fff' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <HardHat size={16} color={!registerForm.create_organization ? '#ff5d1a' : '#9ca3af'} />
                <span>الانضمام لشركة قائمة</span>
              </button>
            </div>

            {/* Names (Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>الاسم الأول *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد"
                    value={registerForm.first_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                    style={inputStyle}
                  />
                  <User size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.first_name && <div style={errorStyle}>{fieldErrors.first_name[0]}</div>}
              </div>

              <div>
                <label style={labelStyle}>اسم العائلة *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الشريف"
                    value={registerForm.last_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                    style={inputStyle}
                  />
                  <User size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.last_name && <div style={errorStyle}>{fieldErrors.last_name[0]}</div>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>البريد الإلكتروني المهني *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="ahmed@company.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  style={inputStyle}
                />
                <Mail size={15} style={inputIconStyle} />
              </div>
              {fieldErrors.email && <div style={errorStyle}>{fieldErrors.email[0]}</div>}
            </div>

            {/* Phone & National ID (Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>رقم الهاتف</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={registerForm.phone_number}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                    style={inputStyle}
                  />
                  <Phone size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.phone_number && <div style={errorStyle}>{fieldErrors.phone_number[0]}</div>}
              </div>

              <div>
                <label style={labelStyle}>الرقم القومي (اختياري)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="14 رقم"
                    value={registerForm.national_id}
                    onChange={(e) => setRegisterForm({ ...registerForm, national_id: e.target.value })}
                    style={inputStyle}
                  />
                  <CreditCard size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.national_id && <div style={errorStyle}>{fieldErrors.national_id[0]}</div>}
              </div>
            </div>

            {/* Organization Specific Section */}
            {registerForm.create_organization ? (
              <div
                style={{
                  background: 'rgba(255, 93, 26, 0.05)',
                  border: '1px solid rgba(255, 93, 26, 0.25)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ff8c38', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={16} />
                  <span>بيانات المنشأة الجديدة (SaaS Tenant)</span>
                </div>

                <div>
                  <label style={labelStyle}>اسم الشركة أو المصنع *</label>
                  <input
                    type="text"
                    required={registerForm.create_organization}
                    placeholder="مثال: شركة أسيوط الوطنية للبتروكيماويات"
                    value={registerForm.organization_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, organization_name: e.target.value })}
                    style={inputStyle}
                  />
                  {fieldErrors.organization_name && <div style={errorStyle}>{fieldErrors.organization_name[0]}</div>}
                </div>

                <div>
                  <label style={labelStyle}>القطاع الصناعي *</label>
                  <select
                    value={registerForm.organization_industry}
                    onChange={(e) => setRegisterForm({ ...registerForm, organization_industry: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {industries.map((ind) => (
                      <option key={ind.code} value={ind.code} style={{ background: '#12141c', color: '#fff' }}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HardHat size={16} />
                  <span>بيانات الانضمام لمنشأة قائمة</span>
                </div>

                <div>
                  <label style={labelStyle}>معرف المنشأة (Organization UUID) *</label>
                  <input
                    type="text"
                    required={!registerForm.create_organization}
                    placeholder="مثال: abfcfde1-8038-4a08-af7a-b331f122dd5d"
                    value={registerForm.organization_id}
                    onChange={(e) => setRegisterForm({ ...registerForm, organization_id: e.target.value })}
                    style={inputStyle}
                  />
                  {fieldErrors.organization_id && <div style={errorStyle}>{fieldErrors.organization_id[0]}</div>}
                </div>

                <div>
                  <label style={labelStyle}>نوع الحساب / الدور الوظيفي *</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    {roles.map((r) => (
                      <option key={r.code} value={r.code} style={{ background: '#12141c', color: '#fff' }}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Passwords (Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>كلمة المرور *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="8 رموز على الأقل"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    style={inputStyle}
                  />
                  <KeyRound size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.password && <div style={errorStyle}>{fieldErrors.password[0]}</div>}
              </div>

              <div>
                <label style={labelStyle}>تأكيد كلمة المرور *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="تطابق كلمة المرور"
                    value={registerForm.password_confirm}
                    onChange={(e) => setRegisterForm({ ...registerForm, password_confirm: e.target.value })}
                    style={inputStyle}
                  />
                  <KeyRound size={15} style={inputIconStyle} />
                </div>
                {fieldErrors.password_confirm && <div style={errorStyle}>{fieldErrors.password_confirm[0]}</div>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...btnPrimaryStyle,
                marginTop: '6px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span>جاري إنشاء الحساب والمنشأة...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>تأكيد التسجيل وبدء الاستخدام</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ==============================================================
            TAB 3: CURRENT LOGGED-IN USER PROFILE VIEW
        ============================================================== */}
        {currentUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* User Avatar & Main Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '16px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff5d1a 0%, #ff8c38 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {currentUser.first_name ? currentUser.first_name.charAt(0) : 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`}
                </div>
                <div style={{ fontSize: '13px', color: '#ff8c38', fontWeight: 600 }}>
                  {currentUser.role_display}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{currentUser.email}</div>
              </div>
            </div>

            {/* Organization Card if available */}
            {currentUser.organization && (
              <div
                style={{
                  background: 'rgba(255, 93, 26, 0.06)',
                  border: '1px solid rgba(255, 93, 26, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#ff8c38', fontWeight: 700, marginBottom: '6px' }}>
                  المنشأة الصناعية التابع لها (Tenant)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  {currentUser.organization.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ color: '#9ca3af' }}>
                    القطاع: <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{currentUser.organization.industry_display}</span>
                  </div>
                  <div style={{ color: '#9ca3af' }}>
                    باقة الاشتراك: <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{currentUser.organization.subscription_tier_display}</span>
                  </div>
                  <div style={{ color: '#9ca3af' }}>
                    السترات المتاحة: <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{currentUser.organization.max_vests} سترة</span>
                  </div>
                  <div style={{ color: '#9ca3af' }}>
                    المستخدمين: <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{currentUser.organization.max_users} مستخدم</span>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed User Information Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                fontSize: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <span style={{ color: '#888f9e' }}>المسمى الوظيفي: </span>
                <span style={{ color: '#fff' }}>{currentUser.job_title || 'غير محدد'}</span>
              </div>
              <div>
                <span style={{ color: '#888f9e' }}>رقم الهاتف: </span>
                <span style={{ color: '#fff', direction: 'ltr', display: 'inline-block' }}>
                  {currentUser.phone_number || 'غير متوفر'}
                </span>
              </div>
              <div>
                <span style={{ color: '#888f9e' }}>فصيلة الدم: </span>
                <span style={{ color: '#ff5d1a', fontWeight: 700 }}>{currentUser.blood_type || 'UNKNOWN'}</span>
              </div>
              <div>
                <span style={{ color: '#888f9e' }}>حالة التحقق: </span>
                <span style={{ color: currentUser.is_verified ? '#10b981' : '#f59e0b' }}>
                  {currentUser.is_verified ? 'معتمد ومؤكد' : 'قيد المراجعة'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onLogout) onLogout();
                  setActiveTab('login');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <LogOut size={16} />
                <span>تسجيل الخروج (Logout)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 14px 11px 36px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

const inputIconStyle = {
  position: 'absolute',
  left: '12px',
  top: '12px',
  color: '#6b7280',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '5px',
  color: '#d1d5db',
};

const errorStyle = {
  color: '#f87171',
  fontSize: '11px',
  marginTop: '4px',
};

const btnPrimaryStyle = {
  width: '100%',
  padding: '13px',
  borderRadius: '12px',
  border: 'none',
  background: 'linear-gradient(135deg, #ff5d1a 0%, #ff8c38 100%)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 8px 24px rgba(255, 93, 26, 0.35)',
  transition: 'transform 0.15s, box-shadow 0.15s',
};
