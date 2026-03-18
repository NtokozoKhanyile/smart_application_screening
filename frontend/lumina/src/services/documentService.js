import api from './api'

export const documentAPI = {
  upload: (applicationId, contentType, file) => {
    const formData = new FormData()
    formData.append('application_id', applicationId)
    formData.append('content_type', contentType)
    formData.append('file', file)
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}