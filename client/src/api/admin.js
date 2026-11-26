import { api } from './client.js';

const d = (r) => r.data;
const qs = (p) => { const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== '' && v != null)).toString(); return s ? `?${s}` : ''; };

export const adminApi = {
  listUsers: (params = {}) => api.get(`/users${qs(params)}`).then(d),
  createUser: (body) => api.post('/users', body).then(d),
  updateUser: (id, body) => api.patch(`/users/${id}`, body).then(d),
  resendInvite: (id) => api.post(`/users/${id}/resend-invite`).then(d),

  listRelatives: (residentId) => api.get(`/residents/${residentId}/relatives`).then(d),
  linkRelative: (residentId, body) => api.post(`/residents/${residentId}/relatives`, body).then(d),
  updateLink: (linkId, body) => api.patch(`/resident-relatives/${linkId}`, body).then(d),

  listAudit: (params) => api.get(`/audit-logs${qs(params)}`),
};

export const familyApi = {
  list: () => api.get('/family/residents').then(d),
  get: (id) => api.get(`/family/residents/${id}`).then(d),
};
