import api from './api'

export const courseAPI = {
  getAll: () => api.get('/courses/'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getRequirements: (courseId) => api.get(`/courses/${courseId}/requirements`),
  addRequirement: (courseId, data) => api.post(`/courses/${courseId}/requirements`, data),
  updateRequirement: (courseId, reqId, data) => api.patch(`/courses/${courseId}/requirements/${reqId}`, data),
  deleteRequirement: (courseId, reqId) => api.delete(`/courses/${courseId}/requirements/${reqId}`),
}