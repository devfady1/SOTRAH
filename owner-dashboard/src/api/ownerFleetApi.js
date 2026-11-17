import { apiClient } from './client';

export const ownerFleetApi = {
  // Overview & Analytics
  getOverview: async () => {
    const res = await apiClient.get('/owner/overview/');
    return res.data;
  },
  getGrowthAnalytics: async (months = 6) => {
    const res = await apiClient.get('/owner/analytics/growth/', { params: { months } });
    return res.data;
  },
  getHealth: async () => {
    const res = await apiClient.get('/owner/health/');
    return res.data;
  },

  // Smart Vests
  getVests: async (params = {}) => {
    const res = await apiClient.get('/owner/vests/', { params });
    return res.data;
  },
  createVest: async (payload) => {
    const res = await apiClient.post('/owner/vests/', payload);
    return res.data;
  },
  updateVest: async (id, payload) => {
    const res = await apiClient.patch(`/owner/vests/${id}/`, payload);
    return res.data;
  },
  deleteVest: async (id) => {
    const res = await apiClient.delete(`/owner/vests/${id}/`);
    return res.data;
  },
  assignVest: async (id, organization_id) => {
    const res = await apiClient.post(`/owner/vests/${id}/assign/`, { organization_id });
    return res.data;
  },
  unassignVest: async (id, target_status = 'IN_STOCK') => {
    const res = await apiClient.post(`/owner/vests/${id}/unassign/`, { target_status });
    return res.data;
  },

  // Gateways
  getGateways: async (params = {}) => {
    const res = await apiClient.get('/owner/gateways/', { params });
    return res.data;
  },
  createGateway: async (payload) => {
    const res = await apiClient.post('/owner/gateways/', payload);
    return res.data;
  },
  assignGateway: async (id, organization_id) => {
    const res = await apiClient.post(`/owner/gateways/${id}/assign/`, { organization_id });
    return res.data;
  },
  unassignGateway: async (id, target_status = 'IN_STOCK') => {
    const res = await apiClient.post(`/owner/gateways/${id}/unassign/`, { target_status });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/owner/audit-logs/', { params });
    return res.data;
  },

  // Announcements
  getAnnouncements: async (params = {}) => {
    const res = await apiClient.get('/owner/announcements/', { params });
    return res.data;
  },
  createAnnouncement: async (payload) => {
    const res = await apiClient.post('/owner/announcements/', payload);
    return res.data;
  },
  updateAnnouncement: async (id, payload) => {
    const res = await apiClient.patch(`/owner/announcements/${id}/`, payload);
    return res.data;
  },
  deleteAnnouncement: async (id) => {
    const res = await apiClient.delete(`/owner/announcements/${id}/`);
    return res.data;
  },
};
