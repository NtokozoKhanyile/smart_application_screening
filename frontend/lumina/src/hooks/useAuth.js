import useAuthStore from '../store/authStore'

const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  } = useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin: user?.role === 'admin',
    isApplicant: user?.role === 'applicant',
  }
}

export default useAuth