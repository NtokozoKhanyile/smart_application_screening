import api from './api'

export const courseAPI = {
  getAll: () => api.get('/courses/'),
  getById: (id) => api.get(`/courses/${id}`),
}