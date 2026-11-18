import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, createUser, updateUser, getOrganizations } from '../api/ownerTenantsApi';
import { getRoles } from '../api/authApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { Plus, Search, Edit2, CheckCircle2, XCircle, Users } from 'lucide-react';

export default function UsersPage() {
  const [data, setData] = useState({ count: 0, results: [] });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    organization: '',
    role: '',
    is_active: '',
    is_verified: '',
  });
  const [roles, setRoles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'COMPANY_ADMIN',
    organization_id: '',
    phone_number: '',
    job_title: '',
    is_verified: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    getRoles()
      .then((res) => {
        if (Array.isArray(res)) {
          setRoles(res);
        } else if (Array.isArray(res?.data?.roles)) {
          setRoles(res.data.roles);
        } else if (Array.isArray(res?.roles)) {
          setRoles(res.roles);
        } else {
          setRoles([]);
        }
      })
      .catch((err) => {
        console.error('Error loading roles:', err);
        setRoles([]);
      });

    getOrganizations({ page_size: 100 })
      .then((res) => {
        const list = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
        setOrganizations(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Error loading organizations:', err);
        setOrganizations([]);
      });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      page_size: 20,
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')),
    };
    getUsers(params)
      .then((res) => {
        const resData = res?.data;
        if (resData && Array.isArray(resData.results)) {
          setData(resData);
        } else if (Array.isArray(resData)) {
          setData({ count: resData.length, results: resData });
        } else {
          setData({ count: 0, results: [] });
        }
      })
      .catch((err) => {
        console.error('Error loading users:', err);
        setData({ count: 0, results: [] });
      })
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    try {
      const payload = { ...userForm };
      if (!payload.organization_id) delete payload.organization_id;
      if (!payload.phone_number) delete payload.phone_number;
      if (!payload.job_title) delete payload.job_title;
      await createUser(payload);
      setShowAddModal(false);
      setUserForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'COMPANY_ADMIN',
        organization_id: '',
        phone_number: '',
        job_title: '',
        is_verified: true,
      });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'فشل إنشاء المستخدم');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleQuickToggle = async (user, field) => {
    try {
      await updateUser(user.id, { [field]: !user[field] });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر تعديل حالة المستخدم');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || '',
      organization: user.organization || '',
      phone_number: user.phone_number || '',
      job_title: user.job_title || '',
      is_active: user.is_active,
      is_verified: user.is_verified,
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError('');
    try {
      await updateUser(editingUser.id, editForm);
      setShowEditModal(false);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'فشل تحديث البيانات');
    } finally {
      setEditSubmitting(false);
    }
  };

  const rolesList = Array.isArray(roles) ? roles : [];
  const orgsList = Array.isArray(organizations) ? organizations : [];
  const usersList = Array.isArray(data?.results) ? data.results : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المستخدمين والحسابات</h1>
          <p className="page-subtitle">
            قاعدة بيانات جميع مستخدمي المنظومة والصلاحيات على مستوى كافة المنشآت
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> إضافة مستخدم جديد
        </button>
      </div>

      <div className="filters-bar">
        <div
          className="flex items-center gap-2"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            className="search-input"
            style={{ background: 'none', border: 'none', padding: 0 }}
            placeholder="بحث بالاسم أو البريد..."
            value={filters.search}
            onChange={(e) => {
              setFilters((f) => ({ ...f, search: e.target.value }));
              setPage(1);
            }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.organization}
          onChange={(e) => {
            setFilters((f) => ({ ...f, organization: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">كل المنشآت</option>
          {orgsList.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.role}
          onChange={(e) => {
            setFilters((f) => ({ ...f, role: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">كل الأدوار الوظيفية</option>
          {rolesList.map((r) => {
            const code = typeof r === 'object' ? r.code : r;
            const label = typeof r === 'object' ? r.label : r;
            return (
              <option key={code} value={code}>
                {label}
              </option>
            );
          })}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filters.is_active}
          onChange={(e) => {
            setFilters((f) => ({ ...f, is_active: e.target.value }));
            setPage(1);
          }}
        >
          <option value="">حالة النشاط</option>
          <option value="true">نشط فقط</option>
          <option value="false">معطل فقط</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">جاري تحميل المستخدمين...</div>
        ) : usersList.length === 0 ? (
          <div className="empty-state">
            <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <br />
            لا يوجد مستخدمون مطابقون لمعايير البحث
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الدور والصلاحية</th>
                <th>المنشأة</th>
                <th>رقم الهاتف</th>
                <th>التوثيق</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="text-primary" style={{ fontWeight: 600 }}>
                      {u.first_name} {u.last_name}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {u.email}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={u.role} />
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {u.organization_name || (
                      <span style={{ color: 'var(--sotrah-orange)' }}>إدارة المنصة المركزية</span>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {u.phone_number || '—'}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '3px 8px' }}
                      title="تبديل حالة التوثيق"
                      onClick={() => handleQuickToggle(u, 'is_verified')}
                    >
                      {u.is_verified ? (
                        <span style={{ color: 'var(--sotrah-emerald)', fontSize: 11 }}>
                          <CheckCircle2 size={12} style={{ display: 'inline', marginLeft: 3 }} /> موثق
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          <XCircle size={12} style={{ display: 'inline', marginLeft: 3 }} /> غير موثق
                        </span>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '3px 8px' }}
                      title="تبديل حالة الحساب"
                      onClick={() => handleQuickToggle(u, 'is_active')}
                    >
                      <StatusBadge status={u.is_active ? 'ACTIVE' : 'SUSPENDED'} />
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(u)}
                      title="تعديل المستخدم"
                    >
                      <Edit2 size={13} /> تعديل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination count={data.count || 0} page={page} onChange={setPage} />

      {/* Add User Modal */}
      {showAddModal && (
        <Modal title="إضافة حساب مستخدم جديد" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">الاسم الأول *</label>
                <input
                  className="form-input"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الاسم الأخير *</label>
                <input
                  className="form-input"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">البريد الإلكتروني *</label>
                <input
                  type="email"
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور *</label>
                <input
                  type="password"
                  className="form-input"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الدور الوظيفي *</label>
                <select
                  className="form-select"
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                  required
                >
                  {rolesList.map((r) => {
                    const code = typeof r === 'object' ? r.code : r;
                    const label = typeof r === 'object' ? r.label : r;
                    return (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المنشأة التابع لها</label>
                <select
                  className="form-select"
                  value={userForm.organization_id}
                  onChange={(e) => setUserForm((f) => ({ ...f, organization_id: e.target.value }))}
                >
                  <option value="">-- بدون منشأة (إدارة النظام العامة) --</option>
                  {orgsList.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">رقم الهاتف</label>
                <input
                  className="form-input"
                  value={userForm.phone_number}
                  onChange={(e) => setUserForm((f) => ({ ...f, phone_number: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">المسمى الوظيفي</label>
                <input
                  className="form-input"
                  value={userForm.job_title}
                  onChange={(e) => setUserForm((f) => ({ ...f, job_title: e.target.value }))}
                />
              </div>
            </div>

            {formError && <div className="error-msg mb-4">{formError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddModal(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                {formSubmitting ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <Modal
          title={`تعديل بيانات: ${editingUser.first_name} ${editingUser.last_name || ''}`}
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">الاسم الأول</label>
                <input
                  className="form-input"
                  value={editForm.first_name || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">الاسم الأخير</label>
                <input
                  className="form-input"
                  value={editForm.last_name || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">الدور</label>
                <select
                  className="form-select"
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {rolesList.map((r) => {
                    const code = typeof r === 'object' ? r.code : r;
                    const label = typeof r === 'object' ? r.label : r;
                    return (
                      <option key={code} value={code}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">المنشأة</label>
                <select
                  className="form-select"
                  value={editForm.organization || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, organization: e.target.value }))}
                >
                  <option value="">بدون منشأة (Super Admin)</option>
                  {orgsList.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editError && <div className="error-msg mb-4">{editError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowEditModal(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                {editSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
