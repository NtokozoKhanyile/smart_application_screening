import api from './api'

export const applicationAPI = {
  create: (data) => api.post('/applications/', data),
  getAll: () => api.get('/applications/me'),
  getAllAdmin: () => api.get('/applications/all'),
  getById: (id) => api.get(`/applications/${id}`),
  update: (id, data) => api.put(`/applications/${id}/edit`, data),
  submit: (id) => api.post(`/applications/${id}/submit`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
}