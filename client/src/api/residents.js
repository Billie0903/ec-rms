import { api } from './client.js';

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  return s ? `?${s}` : '';
};

export const residentsApi = {
  list: (params) => api.get(`/residents${qs(params)}`),
  get: (id) => api.get(`/residents/${id}`).then((r) => r.data),
  create: (data) => api.post('/residents', data).then((r) => r.data),
  update: (id, data) => api.put(`/residents/${id}`, data).then((r) => r.data),
  requestArchive: (id, reason) => api.post(`/residents/${id}/archive-requests`, { reason }).then((r) => r.data),
  archive: (id, reason) => api.post(`/residents/${id}/archive`, { reason }).then((r) => r.data),
  restore: (id) => api.post(`/residents/${id}/restore`).then((r) => r.data),

  listAllergies: (id) => api.get(`/residents/${id}/allergies`).then((r) => r.data),
  createAllergy: (id, data) => api.post(`/residents/${id}/allergies`, data).then((r) => r.data),
  updateAllergy: (allergyId, data) => api.put(`/allergies/${allergyId}`, data).then((r) => r.data),
  deleteAllergy: (allergyId) => api.delete(`/allergies/${allergyId}`),

  listConditions: (id) => api.get(`/residents/${id}/conditions`).then((r) => r.data),
  createCondition: (id, data) => api.post(`/residents/${id}/conditions`, data).then((r) => r.data),
  updateCondition: (conditionId, data) => api.put(`/conditions/${conditionId}`, data).then((r) => r.data),
  deleteCondition: (conditionId) => api.delete(`/conditions/${conditionId}`),
};

export const archiveRequestsApi = {
  list: (status = 'pending') => api.get(`/archive-requests${qs({ status })}`).then((r) => r.data),
  review: (id, decision, note) => api.patch(`/archive-requests/${id}`, { decision, note }).then((r) => r.data),
};
