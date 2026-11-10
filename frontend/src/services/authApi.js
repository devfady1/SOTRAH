/**
 * Sotrah SaaS Authentication API Service
 * Handles communication with Django REST Framework Auth endpoints.
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/auth';

export const saveAuthData = (tokens, user) => {
  if (tokens?.access) {
    localStorage.setItem('sotrah_access_token', tokens.access);
  }
  if (tokens?.refresh) {
    localStorage.setItem('sotrah_refresh_token', tokens.refresh);
  }
  if (user) {
    localStorage.setItem('sotrah_user', JSON.stringify(user));
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('sotrah_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getStoredAccessToken = () => {
  return localStorage.getItem('sotrah_access_token');
};

export const clearAuthData = () => {
  localStorage.removeItem('sotrah_access_token');
  localStorage.removeItem('sotrah_refresh_token');
  localStorage.removeItem('sotrah_user');
};

/**
 * تسجيل الدخول عبر الـ API
 * POST /api/v1/auth/login/
 */
export const loginUser = async ({ email, password }) => {
  const response = await fetch(`${API_BASE_URL}/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || 'فشل تسجيل الدخول، يرجى التأكد من البيانات المدخلة.',
      errors: data.errors || data.detail || null,
    };
  }

  saveAuthData(data.tokens, data.user);
  return data;
};

/**
 * إنشاء حساب جديد عبر الـ API
 * POST /api/v1/auth/register/
 */
export const registerUser = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.message || 'تعذر إنشاء الحساب، يرجى مراجعة البيانات.',
      errors: data.errors || data.detail || null,
    };
  }

  saveAuthData(data.tokens, data.user);
  return data;
};

/**
 * جلب بيانات المستخدم المسجل دخوله
 * GET /api/v1/auth/me/
 */
export const fetchCurrentUser = async () => {
  const token = getStoredAccessToken();
  if (!token) throw new Error('لا يوجد توكن دخول');

  const response = await fetch(`${API_BASE_URL}/me/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    clearAuthData();
    throw new Error(data.message || 'انتهت صلاحية جلسة الدخول');
  }

  localStorage.setItem('sotrah_user', JSON.stringify(data.user));
  return data.user;
};

/**
 * قائمة القطاعات الصناعية المتاحة
 * GET /api/v1/auth/industries/
 */
export const fetchIndustries = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/industries/`);
    const data = await res.json();
    return data.industries || [];
  } catch {
    return [
      { code: 'CONSTRUCTION', label: 'المقاولات والتشييد' },
      { code: 'MANUFACTURING', label: 'المصانع والإنتاج' },
      { code: 'OIL_AND_GAS', label: 'البترول والغاز الطبيعي' },
      { code: 'MINING', label: 'التعدين والمحاجر' },
      { code: 'LOGISTICS', label: 'اللوجستيات والموانئ' },
      { code: 'HEALTHCARE', label: 'الرعاية الصحية والمستشفيات' },
      { code: 'OTHER', label: 'قطاعات أخرى' },
    ];
  }
};

/**
 * قائمة الأدوار المتاحة
 * GET /api/v1/auth/roles/
 */
export const fetchRoles = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/roles/`);
    const data = await res.json();
    return data.roles || [];
  } catch {
    return [
      { code: 'COMPANY_ADMIN', label: 'مدير الشركة / المنشأة (Company Admin)' },
      { code: 'SAFETY_OFFICER', label: 'مسؤول السلامة والصحة المهنية (HSE Officer)' },
      { code: 'MEDICAL_STAFF', label: 'الطبيب / المسعف المهني (Medical Officer)' },
      { code: 'HR_MANAGER', label: 'مدير الموارد البشرية (HR Manager)' },
      { code: 'FIELD_SUPERVISOR', label: 'مشرف الميدان والوردية (Field Supervisor)' },
      { code: 'WORKER', label: 'عامل ميداني (Smart Vest Wearer)' },
    ];
  }
};
