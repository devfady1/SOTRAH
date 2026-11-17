import { apiClient } from './client';

export const ownerTenantsApi = {
  // Organizations
  getOrganizations: async (params = {}) => {
    const res = await apiClient.get('/owner/organizations/', { params });
    return res.data;
  },
  createOrganization: async (payload) => {
    const res = await apiClient.post('/owner/organizations/', payload);
    return res.data;
  },
  getOrganization: async (id) => {
    const res = await apiClient.get(`/owner/organizations/${id}/`);
    return res.data;
  },
  updateOrganization: async (id, payload) => {
    const res = await apiClient.patch(`/owner/organizations/${id}/`, payload);
    return res.data;
  },
  setOrganizationStatus: async (id, action, reason = '') => {
    const res = await apiClient.post(`/owner/organizations/${id}/status/`, {
      action,
      reason,
    });
    return res.data;
  },

  // Subscription Plans
  getPlans: async () => {
    const res = await apiClient.get('/owner/plans/');
    return res.data;
  },
  createPlan: async (payload) => {
    const res = await apiClient.post('/owner/plans/', payload);
    return res.data;
  },
  updatePlan: async (id, payload) => {
    const res = await apiClient.patch(`/owner/plans/${id}/`, payload);
    return res.data;
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/owner/invoices/', { params });
    return res.data;
  },
  createInvoice: async (payload) => {
    const res = await apiClient.post('/owner/invoices/', payload);
    return res.data;
  },
  markInvoicePaid: async (id, payload = {}) => {
    const res = await apiClient.post(`/owner/invoices/${id}/mark-paid/`, payload);
    return res.data;
  },

  // Users
  getUsers: async (params = {}) => {
    const res = await apiClient.get('/owner/users/', { params });
    return res.data;
  },
  createUser: async (payload) => {
    const res = await apiClient.post('/owner/users/', payload);
    return res.data;
  },
  updateUser: async (id, payload) => {
    const res = await apiClient.patch(`/owner/users/${id}/`, payload);
    return res.data;
  },
};
