import { create } from 'zustand'
import { authService } from '../services/authService'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await authService.login(email, password)
      const token = data.access_token

      // Store token
      localStorage.setItem('access_token', token)

      // Fetch user info
      const { data: user } = await authService.getMe()
      localStorage.setItem('user', JSON.stringify(user))

      set({ token, user, isAuthenticated: true, isLoading: false })
      return user
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      await authService.register(email, password)
      set({ isLoading: false })
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, token: null, isAuthenticated: false })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore