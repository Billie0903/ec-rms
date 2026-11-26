import { api } from './client.js';

const d = (r) => r.data;

export const careApi = {
  listMedications: (rid, includeStopped) => api.get(`/residents/${rid}/medications?includeStopped=${includeStopped}`).then(d),
  createMedication: (rid, body) => api.post(`/residents/${rid}/medications`, body).then(d),
  updateMedication: (id, body) => api.put(`/medications/${id}`, body).then(d),
  stopMedication: (id) => api.patch(`/medications/${id}/stop`, {}).then(d),

  listVitals: (rid, days = 30) => api.get(`/residents/${rid}/vitals?days=${days}`).then(d),
  createVitals: (rid, body) => api.post(`/residents/${rid}/vitals`, body).then(d),

  listCareNotes: (rid, category) => api.get(`/residents/${rid}/care-notes${category ? `?category=${category}` : ''}`).then(d),
  createCareNote: (rid, body) => api.post(`/residents/${rid}/care-notes`, body).then(d),
  updateCareNote: (id, body) => api.put(`/care-notes/${id}`, body).then(d),
  deleteCareNote: (id) => api.delete(`/care-notes/${id}`),

  listSchedules: (rid, when = 'upcoming') => api.get(`/residents/${rid}/schedules?when=${when}`).then(d),
  createSchedule: (rid, body) => api.post(`/residents/${rid}/schedules`, body).then(d),
  updateSchedule: (id, body) => api.put(`/schedules/${id}`, body).then(d),
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
};
