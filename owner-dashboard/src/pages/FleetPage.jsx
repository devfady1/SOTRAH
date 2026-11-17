import React, { useState, useEffect } from 'react';
import {
  Radio,
  Server,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  BatteryCharging,
  Trash2,
  Share2,
  Undo2,
} from 'lucide-react';
import { ownerFleetApi } from '../api/ownerFleetApi';
import { ownerTenantsApi } from '../api/ownerTenantsApi';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';

export default function FleetPage() {
  const [activeTab, setActiveTab] = useState('vests'); // 'vests' | 'gateways'
  const [vestsData, setVestsData] = useState({ count: 0, results: [] });
  const [gatewaysData, setGatewaysData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [vestPage, setVestPage] = useState(1);
  const [vestStatus, setVestStatus] = useState('');
  const [vestSearch, setVestSearch] = useState('');

  const [gwPage, setGwPage] = useState(1);
  const [gwStatus, setGwStatus] = useState('');
  const [gwSearch, setGwSearch] = useState('');

  // Organizations for assignment
  const [orgs, setOrgs] = useState([]);

  // Modals
  const [createVestOpen, setCreateVestOpen] = useState(false);
  const [newVestForm, setNewVestForm] = useState({
    serial_number: '',
    mac_address: '',
    hardware_revision: 'REV_C_60GHZ',
    firmware_version: 'v2.4.1',
    battery_health_pct: 100,
  });

  const [createGwOpen, setCreateGwOpen] = useState(false);
  const [newGwForm, setNewGwForm] = useState({
    gateway_uid: '',
    model_name: 'Raspberry Pi 4 Model B (4GB)',
    firmware_version: 'v1.8.0',
    ip_address: '192.168.1.100',
  });

  const [assignTarget, setAssignTarget] = useState(null); // { type: 'vest'|'gw', item: obj }
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [unassignTarget, setUnassignTarget] = useState(null);
  const [unassignStatus, setUnassignStatus] = useState('IN_STOCK');

  const loadVests = (page = 1) => {
    setLoading(true);
    ownerFleetApi
      .getVests({
        page,
        page_size: 15,
        status: vestStatus || undefined,
        search: vestSearch || undefined,
      })
      .then((res) => {
        setVestsData(res);
        setVestPage(page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadGateways = (page = 1) => {
    setLoading(true);
    ownerFleetApi
      .getGateways({
        page,
        page_size: 15,
        status: gwStatus || undefined,
        search: gwSearch || undefined,
      })
      .then((res) => {
        setGatewaysData(res);
        setGwPage(page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    ownerTenantsApi.getOrganizations({ page_size: 100 }).then((res) => setOrgs(res.results || []));
  }, []);

  useEffect(() => {
    if (activeTab === 'vests') loadVests(1);
    else loadGateways(1);
  }, [activeTab, vestStatus, gwStatus]);

  const handleCreateVest = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await ownerFleetApi.createVest(newVestForm);
      setCreateVestOpen(false);
      setNewVestForm({
        serial_number: '',
        mac_address: '',
        hardware_revision: 'REV_C_60GHZ',
        firmware_version: 'v2.4.1',
        battery_health_pct: 100,
      });
      loadVests(1);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إضافة السترة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateGateway = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await ownerFleetApi.createGateway(newGwForm);
      setCreateGwOpen(false);
      setNewGwForm({
        gateway_uid: '',
        model_name: 'Raspberry Pi 4 Model B (4GB)',
        firmware_version: 'v1.8.0',
        ip_address: '192.168.1.100',
      });
      loadGateways(1);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل إضافة البوابة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (assignTarget.type === 'vest') {
        await ownerFleetApi.assignVest(assignTarget.item.id, selectedOrgId);
        loadVests(vestPage);
      } else {
        await ownerFleetApi.assignGateway(assignTarget.item.id, selectedOrgId);
        loadGateways(gwPage);
      }
      setAssignTarget(null);
      setSelectedOrgId('');
    } catch (err) {
      alert(err.response?.data?.message || 'فشل التخصيص للمنشأة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (unassignTarget.type === 'vest') {
        await ownerFleetApi.unassignVest(unassignTarget.item.id, unassignStatus);
        loadVests(vestPage);
      } else {
        await ownerFleetApi.unassignGateway(unassignTarget.item.id, unassignStatus);
        loadGateways(gwPage);
      }
      setUnassignTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل سحب العتاد للمخزون');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVest = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إخراج هذه السترة من الخدمة نهائياً؟')) return;
    try {
      await ownerFleetApi.deleteVest(id);
      loadVests(vestPage);
    } catch (err) {
      alert(err.response?.data?.message || 'فشل حذف السترة');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            إدارة أسطول العتاد — السترات الذكية والبوابات (Hardware Fleet)
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            رصد المخزون وتخصيص السترات وبوابات Raspberry Pi 4 للمنشآت
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === 'vests' ? setCreateVestOpen(true) : setCreateGwOpen(true))}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'var(--sotrah-orange)',
            border: 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={16} />
          <span>{activeTab === 'vests' ? 'إضافة سترة جديدة للمخزون' : 'إضافة بوابة معالجة جديدة'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('vests')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'vests' ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
            color: activeTab === 'vests' ? 'var(--sotrah-orange)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'vests' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Radio size={16} />
          <span>السترات الذكية (Smart Vests)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateways')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'gateways' ? 'rgba(255, 93, 26, 0.15)' : 'transparent',
            color: activeTab === 'gateways' ? 'var(--sotrah-orange)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'gateways' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Server size={16} />
          <span>البوابات المحلية (Edge Gateways)</span>
        </button>
      </div>

      {/* TAB 1: VESTS */}
      {activeTab === 'vests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="البحث بالرقم التسلسلي أو MAC Address..."
              value={vestSearch}
              onChange={(e) => setVestSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadVests(1)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px', minWidth: '260px' }}
            />
            <select
              value={vestStatus}
              onChange={(e) => setVestStatus(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
            >
              <option value="">كل حالات السترات</option>
              <option value="IN_STOCK">بالمخزون (In Stock)</option>
              <option value="ASSIGNED">مخصصة لشركة (Assigned)</option>
              <option value="ACTIVE">نشطة ميدانياً (Active)</option>
              <option value="MAINTENANCE">في الصيانة (Maintenance)</option>
              <option value="DECOMMISSIONED">خارج الخدمة (Decommissioned)</option>
            </select>
          </div>

          {/* Vests Table */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>جاري التحميل...</div>
            ) : vestsData.results?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>لا توجد سترات مطابقة.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '14px 18px' }}>الرقم التسلسلي</th>
                    <th style={{ padding: '14px 18px' }}>MAC Address</th>
                    <th style={{ padding: '14px 18px' }}>الفيرموير</th>
                    <th style={{ padding: '14px 18px' }}>صحة البطارية</th>
                    <th style={{ padding: '14px 18px' }}>الحالة</th>
                    <th style={{ padding: '14px 18px' }}>المنشأة المخصصة لها</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {vestsData.results.map((vest) => (
                    <tr key={vest.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {vest.serial_number}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {vest.mac_address}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--sotrah-cyan)', fontSize: '12px' }}>
                        {vest.firmware_version}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#fff' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <BatteryCharging size={14} color="#10b981" />
                          <span>{vest.battery_health_pct}%</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={vest.status} label={vest.status_display} />
                      </td>
                      <td style={{ padding: '14px 18px', color: '#fff' }}>
                        {vest.organization_name || <span style={{ color: 'var(--text-muted)' }}>غير مخصصة (مخزون)</span>}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {vest.organization ? (
                            <button
                              type="button"
                              onClick={() => setUnassignTarget({ type: 'vest', item: vest })}
                              style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Undo2 size={12} />
                              <span>سحب للمخزون</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setAssignTarget({ type: 'vest', item: vest })}
                                style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Share2 size={12} />
                                <span>تخصيص لشركة</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVest(vest.id)}
                                title="إخراج من الخدمة"
                                style={{ padding: '5px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pagination
              count={vestsData.count}
              pageSize={15}
              currentPage={vestPage}
              onPageChange={(page) => loadVests(page)}
            />
          </div>
        </div>
      )}

      {/* TAB 2: GATEWAYS */}
      {activeTab === 'gateways' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="البحث بالـ Gateway UID أو IP..."
              value={gwSearch}
              onChange={(e) => setGwSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadGateways(1)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px', minWidth: '240px' }}
            />
            <select
              value={gwStatus}
              onChange={(e) => setGwStatus(e.target.value)}
              style={{ padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
            >
              <option value="">كل الحالات</option>
              <option value="IN_STOCK">بالمخزون</option>
              <option value="ONLINE">متصلة أونلاين</option>
              <option value="OFFLINE">غير متصلة (أوفلاين)</option>
              <option value="MAINTENANCE">صيانة</option>
            </select>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>جاري التحميل...</div>
            ) : gatewaysData.results?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>لا توجد بوابات مطابقة.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '14px 18px' }}>معرف البوابة (UID)</th>
                    <th style={{ padding: '14px 18px' }}>الموديل</th>
                    <th style={{ padding: '14px 18px' }}>عنوان الـ IP</th>
                    <th style={{ padding: '14px 18px' }}>الحالة</th>
                    <th style={{ padding: '14px 18px' }}>المنشأة المخصصة لها</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {gatewaysData.results.map((gw) => (
                    <tr key={gw.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px', color: '#fff', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {gw.gateway_uid}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                        {gw.model_name}
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--sotrah-cyan)' }}>
                        {gw.ip_address || '—'}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <StatusBadge status={gw.status} label={gw.status_display} />
                      </td>
                      <td style={{ padding: '14px 18px', color: '#fff' }}>
                        {gw.organization_name || <span style={{ color: 'var(--text-muted)' }}>غير مخصصة (مخزون)</span>}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {gw.organization ? (
                          <button
                            type="button"
                            onClick={() => setUnassignTarget({ type: 'gw', item: gw })}
                            style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Undo2 size={12} />
                            <span>سحب للمخزون</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAssignTarget({ type: 'gw', item: gw })}
                            style={{ padding: '5px 10px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Share2 size={12} />
                            <span>تخصيص لشركة</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <Pagination
              count={gatewaysData.count}
              pageSize={15}
              currentPage={gwPage}
              onPageChange={(page) => loadGateways(page)}
            />
          </div>
        </div>
      )}

      {/* Create Vest Modal */}
      <Modal isOpen={createVestOpen} onClose={() => setCreateVestOpen(false)} title="إضافة سترة ذكية جديدة للمخزون">
        <form onSubmit={handleCreateVest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>الرقم التسلسلي (Serial Number) *</label>
            <input
              type="text"
              required
              placeholder="مثال: SOTRAH-VEST-2026-0007"
              value={newVestForm.serial_number}
              onChange={(e) => setNewVestForm({ ...newVestForm, serial_number: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>عنوان MAC Address *</label>
            <input
              type="text"
              required
              placeholder="مثال: 24:6F:28:AB:CD:EF"
              value={newVestForm.mac_address}
              onChange={(e) => setNewVestForm({ ...newVestForm, mac_address: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>إصدار العتاد (Hardware)</label>
              <input
                type="text"
                value={newVestForm.hardware_revision}
                onChange={(e) => setNewVestForm({ ...newVestForm, hardware_revision: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>الفيرموير المبدئي</label>
              <input
                type="text"
                value={newVestForm.firmware_version}
                onChange={(e) => setNewVestForm({ ...newVestForm, firmware_version: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-orange)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {actionLoading ? 'جاري التسجيل...' : 'تسجيل السترة بالمخزون'}
          </button>
        </form>
      </Modal>

      {/* Create Gateway Modal */}
      <Modal isOpen={createGwOpen} onClose={() => setCreateGwOpen(false)} title="إضافة بوابة معالجة محلية جديدة">
        <form onSubmit={handleCreateGateway} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>معرف البوابة (UID) *</label>
            <input
              type="text"
              required
              placeholder="مثال: SOTRAH-GW-2026-0004"
              value={newGwForm.gateway_uid}
              onChange={(e) => setNewGwForm({ ...newGwForm, gateway_uid: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>طراز العتاد (Model)</label>
            <input
              type="text"
              value={newGwForm.model_name}
              onChange={(e) => setNewGwForm({ ...newGwForm, model_name: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>عنوان الـ IP المحلي</label>
            <input
              type="text"
              value={newGwForm.ip_address}
              onChange={(e) => setNewGwForm({ ...newGwForm, ip_address: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-orange)', color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {actionLoading ? 'جاري التسجيل...' : 'تسجيل البوابة'}
          </button>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={!!assignTarget} onClose={() => setAssignTarget(null)} title="تخصيص العتاد لمنشأة">
        <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            العتاد المحدد: <strong style={{ color: '#fff' }}>{assignTarget?.item?.serial_number || assignTarget?.item?.gateway_uid}</strong>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              المنشأة المستهدفة *
            </label>
            <select
              required
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="">اختر الشركة أو المصنع...</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (السترات: {o.vests_count} من {o.max_vests})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={actionLoading || !selectedOrgId}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-cyan)', color: '#000', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {actionLoading ? 'جاري التخصيص...' : 'تأكيد التخصيص'}
          </button>
        </form>
      </Modal>

      {/* Unassign Modal */}
      <Modal isOpen={!!unassignTarget} onClose={() => setUnassignTarget(null)} title="سحب العتاد إلى المخزون المركزي">
        <form onSubmit={handleUnassignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            سيتم فك ارتباط العتاد عن المنشأة الحالية وإعادته لإدارة المخزون العام.
          </p>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              الحالة المستهدفة للعتاد بعد السحب *
            </label>
            <select
              value={unassignStatus}
              onChange={(e) => setUnassignStatus(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff' }}
            >
              <option value="IN_STOCK">بالمخزون وجاهز للتخصيص (In Stock)</option>
              <option value="MAINTENANCE">صيانة وفحص فني (Maintenance)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--sotrah-amber)', color: '#000', fontWeight: 700, cursor: 'pointer', marginTop: '10px' }}
          >
            {actionLoading ? 'جاري السحب...' : 'تأكيد سحب العتاد للمخزون'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
