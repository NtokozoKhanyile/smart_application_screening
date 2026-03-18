import { create } from 'zustand'
import { applicationAPI } from '../services/applicationService'

const useApplicationStore = create((set) => ({
  applications: [],
  currentApplication: null,
  isLoading: false,
  error: null,

  fetchApplications: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await applicationAPI.getAll()
      set({ applications: data, isLoading: false })
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to fetch applications'
      set({ error: message, isLoading: false })
    }
  },

  fetchApplicationById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await applicationAPI.getById(id)
      set({ currentApplication: data, isLoading: false })
      return data
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to fetch application'
      set({ error: message, isLoading: false })
    }
  },

  createApplication: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: newApp } = await applicationAPI.create(data)
      set((state) => ({
        applications: [newApp, ...state.applications],
        isLoading: false,
      }))
      return newApp
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create application'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  updateApplication: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const { data: updated } = await applicationAPI.update(id, data)
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id ? updated : app
        ),
        currentApplication: updated,
        isLoading: false,
      }))
      return updated
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update application'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  submitApplication: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data: submitted } = await applicationAPI.submit(id)
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id ? submitted : app
        ),
        currentApplication: submitted,
        isLoading: false,
      }))
      return submitted
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit application'
      set({ error: message, isLoading: false })
      throw new Error(message)
    }
  },

  clearCurrentApplication: () => set({ currentApplication: null }),
  clearError: () => set({ error: null }),
}))

export default useApplicationStore