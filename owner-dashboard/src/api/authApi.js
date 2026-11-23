import client from './client';

export const login = (email, password) =>
  client.post('/auth/login/', { email, password });

export const getMe = () =>
  client.get('/auth/me/');

export const getRoles = () =>
  client.get('/auth/roles/').then((res) => {
    if (Array.isArray(res.data?.roles)) return res.data.roles;
    if (Array.isArray(res.data)) return res.data;
    return [];
  });

export const getIndustries = () =>
  client.get('/auth/industries/').then((res) => {
    if (Array.isArray(res.data?.industries)) return res.data.industries;
    if (Array.isArray(res.data)) return res.data;
    return [];
  });

export const refreshToken = (refresh) =>
  client.post('/auth/refresh/', { refresh });
