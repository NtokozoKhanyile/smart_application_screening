import { create } from 'zustand'

const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (modalName, data = null) =>
    set({ activeModal: modalName, modalData: data }),

  closeModal: () =>
    set({ activeModal: null, modalData: null }),
}))

export default useUIStore