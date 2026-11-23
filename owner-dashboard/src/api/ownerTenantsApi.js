import client from './client';

// Overview & Analytics & Health
export const getOverview = () =>
  client.get('/owner/overview/');

export const getGrowth = (months = 6) =>
  client.get(`/owner/analytics/growth/?months=${months}`);

export const getHealth = () =>
  client.get('/owner/health/');

// Organizations (Tenants)
export const getOrganizations = (params) =>
  client.get('/owner/organizations/', { params });

export const createOrganization = (data) =>
  client.post('/owner/organizations/', data);

export const getOrganization = (id) =>
  client.get(`/owner/organizations/${id}/`);

export const updateOrganization = (id, data) =>
  client.patch(`/owner/organizations/${id}/`, data);

export const setOrgStatus = (id, action, reason) =>
  client.post(`/owner/organizations/${id}/status/`, { action, reason });

// Subscription Plans
export const getPlans = () =>
  client.get('/owner/plans/');

export const createPlan = (data) =>
  client.post('/owner/plans/', data);

export const updatePlan = (id, data) =>
  client.patch(`/owner/plans/${id}/`, data);

// Invoices
export const getInvoices = (params) =>
  client.get('/owner/invoices/', { params });

export const createInvoice = (data) =>
  client.post('/owner/invoices/', data);

export const markInvoicePaid = (id, data) =>
  client.post(`/owner/invoices/${id}/mark-paid/`, data);

// Users
export const getUsers = (params) =>
  client.get('/owner/users/', { params });

export const createUser = (data) =>
  client.post('/owner/users/', data);

export const updateUser = (id, data) =>
  client.patch(`/owner/users/${id}/`, data);

// Audit Logs
export const getAuditLogs = (params) =>
  client.get('/owner/audit-logs/', { params });

// Announcements
export const getAnnouncements = (params) =>
  client.get('/owner/announcements/', { params });

export const createAnnouncement = (data) =>
  client.post('/owner/announcements/', data);

export const updateAnnouncement = (id, data) =>
  client.patch(`/owner/announcements/${id}/`, data);

export const deleteAnnouncement = (id) =>
  client.delete(`/owner/announcements/${id}/`);
