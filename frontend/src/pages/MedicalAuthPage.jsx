import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import {
  loginUser,
  registerUser,
  fetchIndustries,
  fetchRoles,
  getStoredUser,
  clearAuthData,
} from '../services/authApi';

const QUICK_ROLES = [
  {
    roleName: 'طبيب الموقع والمسعف',
    email: 'doctor@sotrah.com',
    pass: 'SotrahDoctor123!',
    tag: 'Medical Staff',
  },
  {
    roleName: 'مسؤول السلامة HSE',
    email: 'safety@sotrah.com',
    pass: 'SotrahSafety123!',
    tag: 'Safety Officer',
  },
  {
    roleName: 'مدير المنشأة',
    email: 'admin@sotrah.com',
    pass: 'SotrahAdmin123!',
    tag: 'Company Admin',
  },
  {
    roleName: 'مدير الموارد HR',
    email: 'hr@sotrah.com',
    pass: 'SotrahHR123!',
    tag: 'HR Manager',
  },
  {
    roleName: 'عامل ميداني',
    email: 'worker@sotrah.com',
    pass: 'SotrahWorker123!',
    tag: 'Vest Wearer',
  },
];

export default function MedicalAuthPage({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  // Dynamic lists from Django API
  const [industries, setIndustries] = useState([]);
  const [roles, setRoles] = useState([]);

  // Forms
  const [loginForm, setLoginForm] = useState({
    email: 'doctor@sotrah.com',
    password: 'SotrahDoctor123!',
  });

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
    organization_industry: 'HEALTHCARE',
    organization_id: '',
    role: 'MEDICAL_STAFF',
  });

  useEffect(() => {
    fetchIndustries().then(setIndustries);
    fetchRoles().then(setRoles);
  }, []);

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
      setCurrentUser(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات.');
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

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
      setCurrentUser(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'تعذر إنشاء الحساب، يرجى مراجعة البيانات.');
      if (err.errors && typeof err.errors === 'object') {
        setFieldErrors(err.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    setCurrentUser(null);
    setSuccessMessage(null);
  };

  const fillQuickRole = (roleItem) => {
    setLoginForm({
      email: roleItem.email,
      password: roleItem.pass,
    });
    setErrorMessage(null);
    setFieldErrors({});
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: "'IBM Plex Sans Arabic', -apple-system, sans-serif",
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Clean Header */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#090a0f',
              border: '1px solid rgba(0, 0, 0, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <img
              src="/assets/logo.png"
              alt="شعار سُترة"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>سُترة الطبية</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0284c7',
                  background: '#e0f2fe',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Medical HR-ERP
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              منظومة الرقابة الحيوية وسلامة الكوادر الميدانية
            </div>
          </div>
        </div>

        {/* Back Link to Home (Same Tab) */}
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#475569',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#475569';
          }}
        >
          <span>العودة للرئيسية</span>
          <ArrowRight size={15} />
        </a>
      </header>

      {/* Main Centered Clinical Form Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: activeTab === 'register' ? '640px' : '480px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)',
            padding: '32px',
            transition: 'max-width 0.2s ease',
          }}
        >
          {/* Top Medical Icon & Title */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '18px',
                background: '#090a0f',
                border: '1px solid rgba(0, 0, 0, 0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                marginBottom: '14px',
                boxShadow: '0 6px 22px rgba(0, 0, 0, 0.18)',
              }}
            >
              <img
                src="/assets/logo.png"
                alt="شعار سُترة"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              بوابة الكوادر والمنشآت الطبية
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              تسجيل الدخول للمنظومة السحابية لمتابعة المؤشرات الحيوية وحضور العمال
            </p>
          </div>

          {/* User Profile View if Logged In */}
          {currentUser ? (
            <div>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d' }}>
                    تم تسجيل الدخول بنجاح
                  </div>
                  <div style={{ fontSize: '12px', color: '#166534' }}>
                    الجلسة نشطة ومصرح بها في منظومة سُترة الطبية
                  </div>
                </div>
              </div>

              {/* User Details Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                    }}
                  >
                    {currentUser.first_name ? currentUser.first_name.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      {currentUser.full_name || `${currentUser.first_name} ${currentUser.last_name}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                      {currentUser.role_display}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{currentUser.email}</div>
                  </div>
                </div>

                {currentUser.organization && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '12px', color: '#475569' }}>
                    <div>المنشأة: <strong style={{ color: '#0f172a' }}>{currentUser.organization.name}</strong></div>
                    <div>القطاع: <strong style={{ color: '#0f172a' }}>{currentUser.organization.industry_display}</strong></div>
                    <div>سعة السترات: <strong style={{ color: '#0284c7' }}>{currentUser.organization.max_vests} سترة</strong></div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href="/"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#0284c7',
                    color: '#ffffff',
                    textAlign: 'center',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  الذهاب للوحة التحكم الرئيسية
                </a>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <LogOut size={16} />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          ) : (
            /* Clean Login / Register Forms */
            <div>
              {/* Segmented Control Tabs */}
              <div
                style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '4px',
                  marginBottom: '20px',
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
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'login' ? '#ffffff' : 'transparent',
                    color: activeTab === 'login' ? '#0f172a' : '#64748b',
                    fontWeight: activeTab === 'login' ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  تسجيل الدخول (Login)
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
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'register' ? '#ffffff' : 'transparent',
                    color: activeTab === 'register' ? '#0f172a' : '#64748b',
                    fontWeight: activeTab === 'register' ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  إنشاء حساب منشأة (Register)
                </button>
              </div>

              {/* Notifications */}
              {errorMessage && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#b91c1c',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#15803d',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <div>{successMessage}</div>
                </div>
              )}

              {/* ==============================================================
                  TAB 1: CLEAN LOGIN FORM
              ============================================================== */}
              {activeTab === 'login' && (
                <div>
                  {/* Clean Quick Demo Role Bar */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      اختر دوراً تجريبياً جاهزاً للتجربة بضغطة زر:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {QUICK_ROLES.map((item) => (
                        <button
                          key={item.email}
                          type="button"
                          onClick={() => fillQuickRole(item)}
                          style={{
                            background: loginForm.email === item.email ? '#e0f2fe' : '#f8fafc',
                            border: `1px solid ${loginForm.email === item.email ? '#0284c7' : '#e2e8f0'}`,
                            borderRadius: '6px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: loginForm.email === item.email ? '#0284c7' : '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          {item.roleName}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={lightLabelStyle}>البريد الإلكتروني أو اسم المستخدم</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          required
                          placeholder="name@company.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          style={lightInputStyle}
                        />
                        <Mail size={16} style={lightInputIconStyle} />
                      </div>
                      {fieldErrors.email && <div style={lightErrorStyle}>{fieldErrors.email[0]}</div>}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={lightLabelStyle}>كلمة المرور</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '11px',
                            fontWeight: 600,
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
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          style={lightInputStyle}
                        />
                        <Lock size={16} style={lightInputIconStyle} />
                      </div>
                      {fieldErrors.password && <div style={lightErrorStyle}>{fieldErrors.password[0]}</div>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        ...lightPrimaryBtnStyle,
                        marginTop: '6px',
                        opacity: loading ? 0.75 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                    </button>
                  </form>
                </div>
              )}

              {/* ==============================================================
                  TAB 2: CLEAN REGISTER FORM
              ============================================================== */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Toggle New Org vs Join Org */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      background: '#f8fafc',
                      padding: '4px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, create_organization: true })}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: registerForm.create_organization ? '#ffffff' : 'transparent',
                        color: registerForm.create_organization ? '#0284c7' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: registerForm.create_organization ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      إنشاء منشأة جديدة
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, create_organization: false })}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: !registerForm.create_organization ? '#ffffff' : 'transparent',
                        color: !registerForm.create_organization ? '#0284c7' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: !registerForm.create_organization ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      }}
                    >
                      الانضمام لمنشأة قائمة
                    </button>
                  </div>

                  {/* First & Last Name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lightLabelStyle}>الاسم الأول *</label>
                      <input
                        type="text"
                        required
                        placeholder="أحمد"
                        value={registerForm.first_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                    <div>
                      <label style={lightLabelStyle}>اسم العائلة *</label>
                      <input
                        type="text"
                        required
                        placeholder="الشريف"
                        value={registerForm.last_name}
                        onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={lightLabelStyle}>البريد الإلكتروني المهني *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      style={lightInputStyleNoIcon}
                    />
                    {fieldErrors.email && <div style={lightErrorStyle}>{fieldErrors.email[0]}</div>}
                  </div>

                  {/* Phone & National ID */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lightLabelStyle}>رقم الهاتف</label>
                      <input
                        type="tel"
                        placeholder="010XXXXXXXX"
                        value={registerForm.phone_number}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone_number: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                    <div>
                      <label style={lightLabelStyle}>الرقم القومي (اختياري)</label>
                      <input
                        type="text"
                        maxLength={14}
                        placeholder="14 رقم"
                        value={registerForm.national_id}
                        onChange={(e) => setRegisterForm({ ...registerForm, national_id: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                  </div>

                  {/* Organization Info */}
                  {registerForm.create_organization ? (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <label style={lightLabelStyle}>اسم المنشأة أو المستشفى أو المصنع *</label>
                        <input
                          type="text"
                          required={registerForm.create_organization}
                          placeholder="مثال: شركة أسيوط الوطنية للبتروكيماويات"
                          value={registerForm.organization_name}
                          onChange={(e) => setRegisterForm({ ...registerForm, organization_name: e.target.value })}
                          style={lightInputStyleNoIcon}
                        />
                      </div>

                      <div>
                        <label style={lightLabelStyle}>مجال العمل / القطاع *</label>
                        <select
                          value={registerForm.organization_industry}
                          onChange={(e) => setRegisterForm({ ...registerForm, organization_industry: e.target.value })}
                          style={{ ...lightInputStyleNoIcon, cursor: 'pointer' }}
                        >
                          {industries.map((ind) => (
                            <option key={ind.code} value={ind.code}>
                              {ind.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <label style={lightLabelStyle}>معرف المنشأة (UUID) *</label>
                        <input
                          type="text"
                          required={!registerForm.create_organization}
                          placeholder="abfcfde1-8038-4a08-af7a-b331f122dd5d"
                          value={registerForm.organization_id}
                          onChange={(e) => setRegisterForm({ ...registerForm, organization_id: e.target.value })}
                          style={lightInputStyleNoIcon}
                        />
                      </div>

                      <div>
                        <label style={lightLabelStyle}>الدور الوظيفي *</label>
                        <select
                          value={registerForm.role}
                          onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                          style={{ ...lightInputStyleNoIcon, cursor: 'pointer' }}
                        >
                          {roles.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Passwords */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={lightLabelStyle}>كلمة المرور *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="8 رموز على الأقل"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                    <div>
                      <label style={lightLabelStyle}>تأكيد كلمة المرور *</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="تطابق كلمة المرور"
                        value={registerForm.password_confirm}
                        onChange={(e) => setRegisterForm({ ...registerForm, password_confirm: e.target.value })}
                        style={lightInputStyleNoIcon}
                      />
                    </div>
                  </div>
                  {fieldErrors.password_confirm && <div style={lightErrorStyle}>{fieldErrors.password_confirm[0]}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      ...lightPrimaryBtnStyle,
                      marginTop: '6px',
                      opacity: loading ? 0.75 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'جاري إنشاء الحساب...' : 'تأكيد التسجيل وبدء الاستخدام'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Clean Medical Security Note */}
          <div
            style={{
              marginTop: '22px',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '16px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={14} color="#0284c7" />
            <span>نظام محمي ومشفر وفق معايير أمان السجلات الطبية والصناعية</span>
          </div>
        </div>
      </main>
    </div>
  );
}

const lightInputStyle = {
  width: '100%',
  padding: '10px 12px 10px 36px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const lightInputStyleNoIcon = {
  width: '100%',
  padding: '10px 12px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  color: '#0f172a',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const lightInputIconStyle = {
  position: 'absolute',
  left: '10px',
  top: '11px',
  color: '#94a3b8',
};

const lightLabelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#334155',
};

const lightErrorStyle = {
  color: '#dc2626',
  fontSize: '11px',
  marginTop: '3px',
};

const lightPrimaryBtnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  background: '#0284c7',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
};
