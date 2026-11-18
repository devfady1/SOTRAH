import React, { useEffect, useState, useCallback } from 'react';
import {
  getVests,
  createVest,
  deleteVest,
  assignVest,
  unassignVest,
  getGateways,
  createGateway,
  assignGateway,
  unassignGateway,
} from '../api/ownerFleetApi';
import { getOrganizations } from '../api/ownerTenantsApi';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { Plus, Trash2, Link2, Unlink2, Search, Shield, Wifi, Battery } from 'lucide-react';

const VEST_STATUSES = ['IN_STOCK', 'ASSIGNED', 'ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'];
const GW_STATUSES = ['IN_STOCK', 'ONLINE', 'OFFLINE', 'MAINTENANCE'];

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState('vests');
  const [vests, setVests] = useState({ count: 0, results: [] });
  const [gateways, setGateways] = useState({ count: 0, results: [] });
  const [organizations, setOrganizations] = useState([]);
  const [vestPage, setVestPage] = useState(1);
  const [gwPage, setGwPage] = useState(1);
  const [vestFilters, setVestFilters] = useState({ status: '', search: '', unassigned: '' });
  const [gwFilters, setGwFilters] = useState({ status: '', search: '', unassigned: '' });
  const [loading, setLoading] = useState(false);

  // Vests Modals
  const [showAddVest, setShowAddVest] = useState(false);
  const [vestForm, setVestForm] = useState({
    serial_number: '',
    mac_address: '',
    sim_iccid: '',
    hardware_revision: 'v2.1',
    firmware_version: '1.0.4',
    battery_health_pct: 100,
    notes: '',
  });
  const [vestSubmitting, setVestSubmitting] = useState(false);
  const [vestError, setVestError] = useState('');

  const [showAssignVest, setShowAssignVest] = useState(false);
  const [assigningVest, setAssigningVest] = useState(null);
  const [assignOrgId, setAssignOrgId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [showUnassignVest, setShowUnassignVest] = useState(false);
  const [unassigningVest, setUnassigningVest] = useState(null);
  const [unassignStatus, setUnassignStatus] = useState('IN_STOCK');
  const [unassignSubmitting, setUnassignSubmitting] = useState(false);

  // Gateways Modals
  const [showAddGw, setShowAddGw] = useState(false);
  const [gwForm, setGwForm] = useState({
    gateway_uid: '',
    model_name: 'Raspberry Pi 4 Model B (4GB)',
    firmware_version: '1.2.0',
    ip_address: '',
    notes: '',
  });
  const [gwSubmitting, setGwSubmitting] = useState(false);
  const [gwError, setGwError] = useState('');

  const [showAssignGw, setShowAssignGw] = useState(false);
  const [assigningGw, setAssigningGw] = useState(null);
  const [assignGwOrgId, setAssignGwOrgId] = useState('');

  useEffect(() => {
    getOrganizations({ page_size: 100 })
      .then((res) => {
        const list = res?.data?.results || (Array.isArray(res?.data) ? res.data : []);
        setOrganizations(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error(err);
        setOrganizations([]);
      });
  }, []);

  const loadVests = useCallback(() => {
    setLoading(true);
    const params = {
      page: vestPage,
      page_size: 20,
      ...Object.fromEntries(Object.entries(vestFilters).filter(([, v]) => v !== '')),
    };
    getVests(params)
      .then((res) => {
        const d = res?.data;
        if (d && Array.isArray(d.results)) {
          setVests(d);
        } else if (Array.isArray(d)) {
          setVests({ count: d.length, results: d });
        } else {
          setVests({ count: 0, results: [] });
        }
      })
      .catch((err) => {
        console.error(err);
        setVests({ count: 0, results: [] });
      })
      .finally(() => setLoading(false));
  }, [vestPage, vestFilters]);

  const loadGateways = useCallback(() => {
    setLoading(true);
    const params = {
      page: gwPage,
      page_size: 20,
      ...Object.fromEntries(Object.entries(gwFilters).filter(([, v]) => v !== '')),
    };
    getGateways(params)
      .then((res) => {
        const d = res?.data;
        if (d && Array.isArray(d.results)) {
          setGateways(d);
        } else if (Array.isArray(d)) {
          setGateways({ count: d.length, results: d });
        } else {
          setGateways({ count: 0, results: [] });
        }
      })
      .catch((err) => {
        console.error(err);
        setGateways({ count: 0, results: [] });
      })
      .finally(() => setLoading(false));
  }, [gwPage, gwFilters]);

  useEffect(() => {
    if (activeTab === 'vests') loadVests();
  }, [activeTab, loadVests]);

  useEffect(() => {
    if (activeTab === 'gateways') loadGateways();
  }, [activeTab, loadGateways]);

  const handleAddVest = async (e) => {
    e.preventDefault();
    setVestSubmitting(true);
    setVestError('');
    try {
      const payload = Object.fromEntries(Object.entries(vestForm).filter(([, v]) => v !== ''));
      await createVest(payload);
      setShowAddVest(false);
      setVestForm({
        serial_number: '',
        mac_address: '',
        sim_iccid: '',
        hardware_revision: 'v2.1',
        firmware_version: '1.0.4',
        battery_health_pct: 100,
        notes: '',
      });
      loadVests();
    } catch (err) {
      setVestError(err.response?.data?.message || 'فشلت إضافة السترة');
    } finally {
      setVestSubmitting(false);
    }
  };

  const handleAssignVest = async (e) => {
    e.preventDefault();
    setAssignSubmitting(true);
    setAssignError('');
    try {
      await assignVest(assigningVest.id, assignOrgId);
      setShowAssignVest(false);
      loadVests();
    } catch (err) {
      setAssignError(err.response?.data?.message || 'فشل تخصيص السترة');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleUnassignVest = async () => {
    setUnassignSubmitting(true);
    try {
      await unassignVest(unassigningVest.id, unassignStatus);
      setShowUnassignVest(false);
      loadVests();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل سحب السترة');
    } finally {
      setUnassignSubmitting(false);
    }
  };

  const handleDeleteVest = async (vest) => {
    if (
      !window.confirm(
        `هل أنت متأكد تماماً من إخراج السترة "${vest.serial_number}" من الخدمة وإلغاء تسجيلها؟`
      )
    )
      return;
    try {
      await deleteVest(vest.id);
      loadVests();
    } catch (err) {
      alert(err.response?.data?.message || 'لا يمكن حذف السترة حالياً');
    }
  };

  const handleAddGw = async (e) => {
    e.preventDefault();
    setGwSubmitting(true);
    setGwError('');
    try {
      const payload = Object.fromEntries(Object.entries(gwForm).filter(([, v]) => v !== ''));
      await createGateway(payload);
      setShowAddGw(false);
      setGwForm({
        gateway_uid: '',
        model_name: 'Raspberry Pi 4 Model B (4GB)',
        firmware_version: '1.2.0',
        ip_address: '',
        notes: '',
      });
      loadGateways();
    } catch (err) {
      setGwError(err.response?.data?.message || 'فشلت إضافة البوابة');
    } finally {
      setGwSubmitting(false);
    }
  };

  const handleAssignGw = async (e) => {
    e.preventDefault();
    try {
      await assignGateway(assigningGw.id, assignGwOrgId);
      setShowAssignGw(false);
      loadGateways();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل تخصيص البوابة');
    }
  };

  const vestsList = Array.isArray(vests?.results) ? vests.results : [];
  const gatewaysList = Array.isArray(gateways?.results) ? gateways.results : [];
  const orgsList = Array.isArray(organizations) ? organizations : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">أسطول العتاد ومخزون الأجهزة</h1>
          <p className="page-subtitle">
            إدارة أجهزة رادار السترات الذكية وبوابات المعالجة الحافة (Raspberry Pi 4)
          </p>
        </div>
        {activeTab === 'vests' && (
          <button className="btn btn-primary" onClick={() => setShowAddVest(true)}>
            <Plus size={16} /> إضافة سترة جديدة للمخزون
          </button>
        )}
        {activeTab === 'gateways' && (
          <button className="btn btn-primary" onClick={() => setShowAddGw(true)}>
            <Plus size={16} /> إضافة بوابة جديدة
          </button>
        )}
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'vests' ? 'active' : ''}`}
          onClick={() => setActiveTab('vests')}
        >
          <Shield size={14} style={{ display: 'inline', marginLeft: 6 }} />
          السترات الذكية ({vests.count || 0})
        </button>
        <button
          className={`tab ${activeTab === 'gateways' ? 'active' : ''}`}
          onClick={() => setActiveTab('gateways')}
        >
          <Wifi size={14} style={{ display: 'inline', marginLeft: 6 }} />
          بوابات المعالجة المحلية ({gateways.count || 0})
        </button>
      </div>

      {activeTab === 'vests' && (
        <>
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
                placeholder="بحث بالسيريال، MAC، أو المنشأة..."
                value={vestFilters.search}
                onChange={(e) => {
                  setVestFilters((f) => ({ ...f, search: e.target.value }));
                  setVestPage(1);
                }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={vestFilters.status}
              onChange={(e) => {
                setVestFilters((f) => ({ ...f, status: e.target.value }));
                setVestPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              {VEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={vestFilters.unassigned}
              onChange={(e) => {
                setVestFilters((f) => ({ ...f, unassigned: e.target.value }));
                setVestPage(1);
              }}
            >
              <option value="">كل التخصيصات</option>
              <option value="true">غير مخصصة (بالمخزون فقط)</option>
            </select>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">جاري تحميل قائمة السترات...</div>
            ) : vestsList.length === 0 ? (
              <div className="empty-state">لا توجد سترات مسجلة</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>الرقم التسلسلي</th>
                    <th>عنوان الـ MAC</th>
                    <th>إصدار النظام (Firmware)</th>
                    <th>صحة البطارية</th>
                    <th>الحالة التشغيلية</th>
                    <th>المنشأة المخصصة لها</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {vestsList.map((vest) => (
                    <tr key={vest.id}>
                      <td className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                        {vest.serial_number}
                      </td>
                      <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {vest.mac_address}
                      </td>
                      <td style={{ fontSize: 12 }}>{vest.firmware_version || 'v1.0.0'}</td>
                      <td>
                        {vest.battery_health_pct != null ? (
                          <span
                            className="mono"
                            style={{
                              fontSize: 12,
                              color:
                                vest.battery_health_pct < 30
                                  ? 'var(--sotrah-red)'
                                  : vest.battery_health_pct < 70
                                  ? 'var(--sotrah-amber)'
                                  : 'var(--sotrah-emerald)',
                            }}
                          >
                            <Battery
                              size={13}
                              style={{ display: 'inline', marginLeft: 4, verticalAlign: -2 }}
                            />
                            {vest.battery_health_pct}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <StatusBadge status={vest.status} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {vest.organization_name || (
                          <span style={{ color: 'var(--text-muted)' }}>غير مخصصة (بالمستودع)</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {['IN_STOCK', 'MAINTENANCE'].includes(vest.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              title="تخصيص لشركة"
                              onClick={() => {
                                setAssigningVest(vest);
                                setAssignOrgId('');
                                setAssignError('');
                                setShowAssignVest(true);
                              }}
                            >
                              <Link2 size={13} /> تخصيص
                            </button>
                          )}
                          {['ASSIGNED', 'ACTIVE'].includes(vest.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              title="سحب للمخزون"
                              onClick={() => {
                                setUnassigningVest(vest);
                                setUnassignStatus('IN_STOCK');
                                setShowUnassignVest(true);
                              }}
                            >
                              <Unlink2 size={13} /> سحب
                            </button>
                          )}
                          {['IN_STOCK', 'MAINTENANCE'].includes(vest.status) && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="إخراج من الخدمة نهائياً"
                              onClick={() => handleDeleteVest(vest)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination count={vests.count || 0} page={vestPage} onChange={setVestPage} />
        </>
      )}

      {activeTab === 'gateways' && (
        <>
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
                placeholder="بحث بالـ UID أو عنوان IP..."
                value={gwFilters.search}
                onChange={(e) => {
                  setGwFilters((f) => ({ ...f, search: e.target.value }));
                  setGwPage(1);
                }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto' }}
              value={gwFilters.status}
              onChange={(e) => {
                setGwFilters((f) => ({ ...f, status: e.target.value }));
                setGwPage(1);
              }}
            >
              <option value="">كل الحالات</option>
              {GW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">جاري تحميل قائمة البوابات...</div>
            ) : gatewaysList.length === 0 ? (
              <div className="empty-state">لا توجد بوابات معالجة مسجلة</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>معرّف البوابة (UID)</th>
                    <th>موديل العتاد</th>
                    <th>عنوان IP المحلي</th>
                    <th>حالة الاتصال</th>
                    <th>المنشأة المخصصة لها</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {gatewaysList.map((gw) => (
                    <tr key={gw.id}>
                      <td className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                        {gw.gateway_uid}
                      </td>
                      <td style={{ fontSize: 12 }}>{gw.model_name || 'Raspberry Pi 4 Model B'}</td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {gw.ip_address || '—'}
                      </td>
                      <td>
                        <StatusBadge status={gw.status} />
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {gw.organization_name || (
                          <span style={{ color: 'var(--text-muted)' }}>غير مخصصة</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {['IN_STOCK', 'MAINTENANCE'].includes(gw.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setAssigningGw(gw);
                                setAssignGwOrgId('');
                                setShowAssignGw(true);
                              }}
                            >
                              <Link2 size={13} /> تخصيص
                            </button>
                          )}
                          {['ONLINE', 'OFFLINE', 'ASSIGNED'].includes(gw.status) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={async () => {
                                try {
                                  await unassignGateway(gw.id, 'IN_STOCK');
                                  loadGateways();
                                } catch (err) {
                                  alert(err.response?.data?.message || 'خطأ في السحب');
                                }
                              }}
                            >
                              <Unlink2 size={13} /> سحب
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination count={gateways.count || 0} page={gwPage} onChange={setGwPage} />
        </>
      )}

      {/* Add Vest Modal */}
      {showAddVest && (
        <Modal title="تسجيل سترة ذكية جديدة في المخزون" onClose={() => setShowAddVest(false)}>
          <form onSubmit={handleAddVest}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">الرقم التسلسلي (Serial Number) *</label>
                <input
                  className="form-input mono"
                  placeholder="SOTRAH-VEST-2026-XXXX"
                  value={vestForm.serial_number}
                  onChange={(e) => setVestForm((f) => ({ ...f, serial_number: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">عنوان الـ MAC (ESP32) *</label>
                <input
                  className="form-input mono"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  value={vestForm.mac_address}
                  onChange={(e) => setVestForm((f) => ({ ...f, mac_address: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">شريحة البيانات (SIM ICCID)</label>
                <input
                  className="form-input mono"
                  placeholder="89200000000000000000"
                  value={vestForm.sim_iccid}
                  onChange={(e) => setVestForm((f) => ({ ...f, sim_iccid: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">إصدار الفيرموير (Firmware)</label>
                <input
                  className="form-input"
                  value={vestForm.firmware_version}
                  onChange={(e) =>
                    setVestForm((f) => ({ ...f, firmware_version: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات العتاد</label>
              <input
                className="form-input"
                placeholder="تاريخ التجميع أو ميزات إضافية"
                value={vestForm.notes}
                onChange={(e) => setVestForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {vestError && <div className="error-msg mb-4">{vestError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddVest(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={vestSubmitting}>
                {vestSubmitting ? 'جاري التسجيل...' : 'تسجيل السترة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Vest Modal */}
      {showAssignVest && assigningVest && (
        <Modal
          title={`تخصيص السترة (${assigningVest.serial_number}) لمنشأة`}
          onClose={() => setShowAssignVest(false)}
        >
          <form onSubmit={handleAssignVest}>
            <div className="form-group">
              <label className="form-label">اختر المنشأة المستفيدة *</label>
              <select
                className="form-select"
                value={assignOrgId}
                onChange={(e) => setAssignOrgId(e.target.value)}
                required
              >
                <option value="">-- اضغط للاختيار --</option>
                {orgsList.map((org) => {
                  const isFull = org.vests_count >= org.max_vests;
                  return (
                    <option key={org.id} value={org.id} disabled={isFull}>
                      {org.name} ({org.vests_count}/{org.max_vests} سترة) {isFull ? '— مكتملة الحصة' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {assignError && <div className="error-msg mb-4">{assignError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAssignVest(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={assignSubmitting}>
                {assignSubmitting ? 'جاري التخصيص...' : 'تخصيص السترة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Unassign Vest Modal */}
      {showUnassignVest && unassigningVest && (
        <Modal
          title={`سحب السترة (${unassigningVest.serial_number})`}
          onClose={() => setShowUnassignVest(false)}
        >
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            سيتم إلغاء ارتباط السترة من منشأة "{unassigningVest.organization_name}". يرجى تحديد حالتها بعد السحب:
          </p>
          <div className="form-group">
            <label className="form-label">الحالة المستهدفة *</label>
            <select
              className="form-select"
              value={unassignStatus}
              onChange={(e) => setUnassignStatus(e.target.value)}
            >
              <option value="IN_STOCK">إعادة للمستودع العام (جاهزة للاستخدام)</option>
              <option value="MAINTENANCE">إرسال لفريق الصيانة والمعايرة</option>
            </select>
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-ghost"
              onClick={() => setShowUnassignVest(false)}
            >
              إلغاء
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUnassignVest}
              disabled={unassignSubmitting}
            >
              {unassignSubmitting ? 'جاري السحب...' : 'تأكيد السحب'}
            </button>
          </div>
        </Modal>
      )}

      {/* Add Gateway Modal */}
      {showAddGw && (
        <Modal title="تسجيل بوابة معالجة حافة (Edge Gateway) جديدة" onClose={() => setShowAddGw(false)}>
          <form onSubmit={handleAddGw}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">معرّف البوابة (Gateway UID) *</label>
                <input
                  className="form-input mono"
                  placeholder="GW-RPI4-XXXX"
                  value={gwForm.gateway_uid}
                  onChange={(e) => setGwForm((f) => ({ ...f, gateway_uid: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">الموديل ومواصفات العتاد</label>
                <input
                  className="form-input"
                  value={gwForm.model_name}
                  onChange={(e) => setGwForm((f) => ({ ...f, model_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">عنوان الـ IP المحلي في المصنع</label>
                <input
                  className="form-input mono"
                  placeholder="192.168.1.100"
                  value={gwForm.ip_address}
                  onChange={(e) => setGwForm((f) => ({ ...f, ip_address: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">إصدار سوفتوير البوابة (Edge OS)</label>
                <input
                  className="form-input"
                  value={gwForm.firmware_version}
                  onChange={(e) =>
                    setGwForm((f) => ({ ...f, firmware_version: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات وموقع التركيب</label>
              <input
                className="form-input"
                placeholder="غرفة التحكم المركزية - عنبر أ"
                value={gwForm.notes}
                onChange={(e) => setGwForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            {gwError && <div className="error-msg mb-4">{gwError}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddGw(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary" disabled={gwSubmitting}>
                {gwSubmitting ? 'جاري التسجيل...' : 'تسجيل البوابة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Gateway Modal */}
      {showAssignGw && assigningGw && (
        <Modal
          title={`تخصيص البوابة (${assigningGw.gateway_uid})`}
          onClose={() => setShowAssignGw(false)}
        >
          <form onSubmit={handleAssignGw}>
            <div className="form-group">
              <label className="form-label">المنشأة المستهدفة *</label>
              <select
                className="form-select"
                value={assignGwOrgId}
                onChange={(e) => setAssignGwOrgId(e.target.value)}
                required
              >
                <option value="">-- اضغط للاختيار --</option>
                {orgsList.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAssignGw(false)}
              >
                إلغاء
              </button>
              <button type="submit" className="btn btn-primary">
                تخصيص البوابة
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
