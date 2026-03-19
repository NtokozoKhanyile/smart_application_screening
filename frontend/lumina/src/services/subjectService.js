import api from './api'

export const subjectAPI = {
  getAll: () => api.get('/subjects/'),
}