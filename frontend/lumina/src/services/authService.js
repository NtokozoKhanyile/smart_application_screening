import api from './api'

export const authService = {
  register: (email, password) => {
    const formData = new URLSearchParams()
    formData.append('email', email)
    formData.append('password', password)
    return api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  login: (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  getMe: () => api.get('/auth/me'),

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
}