import api from './api'

export const applicationAPI = {
  create: (data) => api.post('/applications/', data),
  getAll: () => api.get('/applications/me'),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.patch(`/applications/${id}`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
}