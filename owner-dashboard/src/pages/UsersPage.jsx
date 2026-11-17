import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Shield,
  Edit2,
  RefreshCw,
  Phone,
  Mail,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { ownerTenantsApi } from '../api/ownerTenantsApi';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reference data
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterVerified, setFilterVerified] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Create Form State
  const initialCreateForm = {
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'SAFETY_OFFICER',
    organization_id: '',
    phone_number: '',
    job_title: '',
    is_verified: true,
  };
  const [createForm, setCreateForm] = useState(initialCreateForm);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: '',
    organization: '',
    phone_number: '',
    job_title: '',
    is_active: true,
    is_verified: true,
  });

  // Load Reference Data (Roles, Orgs)
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [rolesRes, orgsRes] = await Promise.all([
          authApi.getRoles(),
          ownerTenantsApi.getOrganizations({ page_size: 200 }),
        ]);
        setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.roles || []);
        const orgList = orgsRes?.results || (Array.isArray(orgsRes) ? orgsRes : []);
        setOrganizations(orgList);
      } catch (err) {
        console.error('Failed to load reference data:', err);
      }
    };
    loadRefs();
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        page_size: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (filterRole) params.role = filterRole;
      if (filterOrg) params.organization = filterOrg;
      if (filterActive !== '') params.is_active = filterActive;
      if (filterVerified !== '') params.is_verified = filterVerified;

      const res = await ownerTenantsApi.getUsers(params);
      if (res.results) {
        setUsers(res.results);
        setTotalCount(res.count || res.results.length);
      } else if (Array.isArray(res)) {
        setUsers(res);
        setTotalCount(res.length);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err?.response?.data?.detail || err?.response?.data?.message || 'فشل تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterOrg, filterActive, filterVerified]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Open Edit Modal
  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      role: u.role || 'WORKER',
      organization: u.organization || u.organization_id || '',
      phone_number: u.phone_number || '',
      job_title: u.job_title || '',
      is_active: u.is_active ?? true,
      is_verified: u.is_verified ?? true,
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  // Quick Toggle Active Status
  const handleToggleActive = async (u) => {
    if (u.id === currentUser?.id) {
      alert('لا يمكنك تعطيل حسابك الشخصي أثناء تسجيل الدخول');
      return;
    }
    const newStatus = !u.is_active;
    const confirmMsg = newStatus
      ? `هل أنت متأكد من إعادة تفعيل حساب المستخدم "${u.first_name} ${u.last_name}"؟`
      : `هل أنت متأكد من تعطيل حساب المستخدم "${u.first_name} ${u.last_name}" ومنعه من تسجيل الدخول؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await ownerTenantsApi.updateUser(u.id, { is_active: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.detail || err?.response?.data?.message || 'فشل تغيير حالة المستخدم');
    }
  };

  // Quick Toggle Verified Status
  const handleToggleVerified = async (u) => {
    const newStatus = !u.is_verified;
    try {
      await ownerTenantsApi.updateUser(u.id, { is_verified: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err?.response?.data?.detail || err?.response?.data?.message || 'فشل تحديث حالة توثيق الحساب');
    }
  };

  // Submit Create User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        email: createForm.email,
        first_name: createForm.first_name,
        last_name: createForm.last_name,
        password: createForm.password,
        role: createForm.role,
        is_verified: createForm.is_verified,
      };
      if (createForm.organization_id) payload.organization_id = createForm.organization_id;
      if (createForm.phone_number) payload.phone_number = createForm.phone_number;
      if (createForm.job_title) payload.job_title = createForm.job_title;

      await ownerTenantsApi.createUser(payload);
      setCreateModalOpen(false);
      setCreateForm(initialCreateForm);
      fetchUsers();
    } catch (err) {
      console.error('Create user error:', err);
      const resData = err?.response?.data;
      let msg = resData?.message || resData?.detail;
      if (!msg && typeof resData === 'object') {
        msg = Object.entries(resData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      }
      setFormError(msg || 'فشل إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        role: editForm.role,
        phone_number: editForm.phone_number,
        job_title: editForm.job_title,
        is_active: editForm.is_active,
        is_verified: editForm.is_verified,
      };
      if (editForm.role !== 'SUPER_ADMIN') {
        payload.organization = editForm.organization || null;
      }
      await ownerTenantsApi.updateUser(selectedUser.id, payload);
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Edit user error:', err);
      const resData = err?.response?.data;
      let msg = resData?.message || resData?.detail;
      if (!msg && typeof resData === 'object') {
        msg = Object.entries(resData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      }
      setFormError(msg || 'فشل تحديث بيانات المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  // Find Role Label
  const getRoleLabel = (code) => {
    const found = roles.find((r) => r.code === code);
    return found?.label || code;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-[#ff5d1a]" />
            مستخدمو المنصة (Platform Users)
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            إدارة كافة الحسابات، الصلاحيات، والتفعيل عبر كافة المنشآت والشركات
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setCreateForm(initialCreateForm);
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] text-white rounded-lg font-medium shadow-md shadow-[#ff5d1a]/20 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="bg-[#101218] border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم، البريد، أو الهاتف..."
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg pr-9 pl-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">جميع الصلاحيات (Roles)</option>
              {roles.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Org Filter */}
          <div>
            <select
              value={filterOrg}
              onChange={(e) => {
                setFilterOrg(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">جميع المنشآت</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">الحالة</option>
              <option value="true">نشط</option>
              <option value="false">معطل</option>
            </select>

            <select
              value={filterVerified}
              onChange={(e) => {
                setFilterVerified(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-[#ff5d1a]"
            >
              <option value="">التوثيق</option>
              <option value="true">موثق</option>
              <option value="false">غير موثق</option>
            </select>
          </div>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchUsers}
            className="mr-auto text-xs bg-red-500/20 px-3 py-1 rounded hover:bg-red-500/30 text-white"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#101218] border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#181a20] text-gray-400 text-xs border-b border-gray-800">
                <th className="py-3 px-4 font-semibold">المستخدم</th>
                <th className="py-3 px-4 font-semibold">المنشأة</th>
                <th className="py-3 px-4 font-semibold">الدور والصلاحية</th>
                <th className="py-3 px-4 font-semibold">الهاتف / المسمى</th>
                <th className="py-3 px-4 font-semibold text-center">التوثيق</th>
                <th className="py-3 px-4 font-semibold text-center">حالة الحساب</th>
                <th className="py-3 px-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#ff5d1a]" />
                      <span>جاري تحميل بيانات المستخدمين...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    لا يوجد مستخدمون يطابقون محددات البحث الحالية
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#ff5d1a]/10 border border-[#ff5d1a]/30 flex items-center justify-center font-bold text-xs text-[#ff5d1a]">
                            {(u.first_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              <span>
                                {u.first_name} {u.last_name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-500" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="py-3 px-4">
                        {u.organization_name ? (
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">{u.organization_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">منصة رئيسية (Platform)</span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-[#ff5d1a]" />
                          <span className="font-medium text-white text-xs">
                            {getRoleLabel(u.role)}
                          </span>
                        </div>
                      </td>

                      {/* Phone / Job Title */}
                      <td className="py-3 px-4 text-xs text-gray-400">
                        {u.job_title && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <Briefcase className="w-3 h-3 text-gray-500" />
                            <span>{u.job_title}</span>
                          </div>
                        )}
                        {u.phone_number ? (
                          <div className="flex items-center gap-1 font-mono text-gray-400">
                            <Phone className="w-3 h-3 text-gray-500" />
                            <span dir="ltr">{u.phone_number}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>

                      {/* Verified */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleVerified(u)}
                          title="انقر لتعديل حالة التوثيق"
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors"
                        >
                          {u.is_verified ? (
                            <span className="flex items-center gap-1 text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full hover:bg-green-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              موثق
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full hover:bg-amber-500/20">
                              <XCircle className="w-3 h-3" />
                              غير موثق
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isSelf}
                          title={isSelf ? 'لا يمكن تعطيل حسابك' : 'انقر لتغيير حالة التفعيل'}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                            u.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                          } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {u.is_active ? 'نشط' : 'معطل'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                          title="تعديل بيانات المستخدم"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-800 bg-[#14161f]">
          <Pagination
            currentPage={page}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      {/* Modal: Create User */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="إضافة مستخدم جديد للنظام"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الاسم الأول *</label>
              <input
                type="text"
                required
                value={createForm.first_name}
                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">اسم العائلة *</label>
              <input
                type="text"
                required
                value={createForm.last_name}
                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">البريد الإلكتروني *</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">كلمة المرور *</label>
            <input
              type="password"
              required
              minLength={8}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              placeholder="على الأقل 8 خانات"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الدور والصلاحية *</label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">المنشأة التابع لها</label>
              <select
                disabled={createForm.role === 'SUPER_ADMIN'}
                value={createForm.organization_id}
                onChange={(e) => setCreateForm({ ...createForm, organization_id: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a] disabled:opacity-50"
              >
                <option value="">بدون منشأة (منصة رئيسية)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">رقم الهاتف</label>
              <input
                type="text"
                dir="ltr"
                value={createForm.phone_number}
                onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                placeholder="+201xxxxxxxxx"
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={createForm.job_title}
                onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })}
                placeholder="مثال: مسؤول سلامة مهنية"
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_verified"
              checked={createForm.is_verified}
              onChange={(e) => setCreateForm({ ...createForm, is_verified: e.target.checked })}
              className="accent-[#ff5d1a] w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="is_verified" className="text-xs text-gray-300 cursor-pointer">
              حساب موثق ومفعل تلقائياً دون الحاجة لتأكيد البريد
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`تعديل بيانات: ${selectedUser?.first_name || ''} ${selectedUser?.last_name || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الاسم الأول *</label>
              <input
                type="text"
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">اسم العائلة *</label>
              <input
                type="text"
                required
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الدور والصلاحية *</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              >
                {roles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">المنشأة</label>
              <select
                disabled={editForm.role === 'SUPER_ADMIN'}
                value={editForm.organization || ''}
                onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a] disabled:opacity-50"
              >
                <option value="">بدون منشأة (منصة رئيسية)</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">رقم الهاتف</label>
              <input
                type="text"
                dir="ltr"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                value={editForm.job_title}
                onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                className="w-full bg-[#181a20] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff5d1a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_active}
                disabled={selectedUser?.id === currentUser?.id}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="accent-[#ff5d1a] w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-300">حساب نشط (Active)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.is_verified}
                onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                className="accent-[#ff5d1a] w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs text-gray-300">حساب موثق (Verified)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#ff5d1a] hover:bg-[#e04f14] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
