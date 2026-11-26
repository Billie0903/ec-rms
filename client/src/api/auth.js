import { api } from './client.js';

export const authApi = {
  me: () => api.get('/auth/me').then((r) => r.data.user),
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data.user),
  logout: () => api.post('/auth/logout'),
  checkInvite: (token) => api.get(`/auth/invites/${encodeURIComponent(token)}`).then((r) => r.data),
  activate: (payload) => api.post('/auth/activate', payload).then((r) => r.data.user),
};
