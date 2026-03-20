import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import useAuthStore from '../store/authStore'
import { ROUTES } from '../utils/constants'

const WARN_BEFORE_MS = 5 * 60 * 1000 // 5 minutes

const decodeJWTExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null // convert to ms
  } catch {
    return null
  }
}

const useSessionExpiry = () => {
  const { token, logout, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const warnTimerRef = useRef(null)
  const expireTimerRef = useRef(null)
  const warnToastRef = useRef(null)

  useEffect(() => {
    // Clear any existing timers
    clearTimeout(warnTimerRef.current)
    clearTimeout(expireTimerRef.current)
    if (warnToastRef.current) toast.dismiss(warnToastRef.current)

    if (!token || !isAuthenticated) return

    const expiresAt = decodeJWTExpiry(token)
    if (!expiresAt) return

    const now = Date.now()
    const msUntilExpiry = expiresAt - now
    const msUntilWarning = msUntilExpiry - WARN_BEFORE_MS

    // Token already expired
    if (msUntilExpiry <= 0) {
      logout()
      navigate(ROUTES.LOGIN)
      return
    }

    // Schedule warning toast
    if (msUntilWarning > 0) {
      warnTimerRef.current = setTimeout(() => {
        warnToastRef.current = toast.warning(
          '⚠️ Your session expires in 5 minutes. Please save your work.',
          { autoClose: false, closeOnClick: false, draggable: false }
        )
      }, msUntilWarning)
    } else {
      // Less than 5 mins remaining — show warning immediately
      warnToastRef.current = toast.warning(
        '⚠️ Your session expires soon. Please save your work.',
        { autoClose: false, closeOnClick: false, draggable: false }
      )
    }

    // Schedule auto logout on expiry
    expireTimerRef.current = setTimeout(() => {
      if (warnToastRef.current) toast.dismiss(warnToastRef.current)
      toast.error('Your session has expired. Please log in again.')
      logout()
      navigate(ROUTES.LOGIN)
    }, msUntilExpiry)

    return () => {
      clearTimeout(warnTimerRef.current)
      clearTimeout(expireTimerRef.current)
      if (warnToastRef.current) toast.dismiss(warnToastRef.current)
    }
  }, [token, isAuthenticated])
}

export default useSessionExpiry