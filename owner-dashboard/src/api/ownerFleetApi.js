import client from './client';

// Smart Vests
export const getVests = (params) =>
  client.get('/owner/vests/', { params });

export const createVest = (data) =>
  client.post('/owner/vests/', data);

export const updateVest = (id, data) =>
  client.patch(`/owner/vests/${id}/`, data);

export const deleteVest = (id) =>
  client.delete(`/owner/vests/${id}/`);

export const assignVest = (id, organization_id) =>
  client.post(`/owner/vests/${id}/assign/`, { organization_id });

export const unassignVest = (id, target_status) =>
  client.post(`/owner/vests/${id}/unassign/`, { target_status });

// Edge Gateways
export const getGateways = (params) =>
  client.get('/owner/gateways/', { params });

export const createGateway = (data) =>
  client.post('/owner/gateways/', data);

export const updateGateway = (id, data) =>
  client.patch(`/owner/gateways/${id}/`, data);

export const assignGateway = (id, organization_id) =>
  client.post(`/owner/gateways/${id}/assign/`, { organization_id });

export const unassignGateway = (id, target_status) =>
  client.post(`/owner/gateways/${id}/unassign/`, { target_status });
