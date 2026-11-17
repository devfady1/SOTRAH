import { apiClient } from './client';

export const authApi = {
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login/', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/auth/me/');
    return res.data;
  },
  getRoles: async () => {
    const res = await apiClient.get('/auth/roles/');
    return res.data.roles || [];
  },
  getIndustries: async () => {
    const res = await apiClient.get('/auth/industries/');
    return res.data.industries || [];
  },
};
