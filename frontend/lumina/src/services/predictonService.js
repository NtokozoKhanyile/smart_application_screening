import api from './api'

export const predictionAPI = {
  screen: (applicationId) =>
    api.post(`/predictions/applications/${applicationId}/screen`),

  getResult: (applicationId) =>
    api.get(`/predictions/applications/${applicationId}`),

  getAllResults: () =>
    api.get('/predictions/screening-results'),

  review: (resultId, data) =>
    api.patch(`/predictions/screening-results/${resultId}/review`, data),
}