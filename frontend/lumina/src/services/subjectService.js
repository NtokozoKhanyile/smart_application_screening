import api from './api'

export const subjectAPI = {
  getAll: () => api.get('/subjects/'),
  create: (data) => api.post('/subjects/', data),
  delete: (id) => api.delete(`/subjects/${id}`),
}