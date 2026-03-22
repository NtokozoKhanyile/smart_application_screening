import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { FullPageLoader } from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'
import useAuth from './hooks/useAuth'
import { ROUTES, ROLES } from './utils/constants'
import useSessionExpiry from './hooks/useSessionExpiry'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'

// Lazy load heavy pages
const StudentDashboard = lazy(() => import('./pages/applicant/StudentDashboard'))
const ApplicationForm  = lazy(() => import('./pages/applicant/ApplicationForm'))
const ApplicationDetail = lazy(() => import('./pages/applicant/ApplicationDetail'))
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const ApplicationsManager = lazy(() => import('./pages/admin/ApplicationsManager'))
const ScreeningReview  = lazy(() => import('./pages/admin/ScreeningReview'))
const Analytics        = lazy(() => import('./pages/admin/Analytics'))
const CourseManager    = lazy(() => import('./pages/admin/CourseManager'))

// ── Protected Route ───────────────────────────────────────────────
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return children
}

// ── Public Route (redirect if already logged in) ──────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated && user) {
    if (user.role === ROLES.ADMIN) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
    }
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />
  }

  return children
}

// ── App ───────────────────────────────────────────────────────────
const App = () => {
  useSessionExpiry()
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path={ROUTES.REGISTER} element={
            <PublicRoute><Register /></PublicRoute>
          } />
          <Route path={ROUTES.FORGOT_PASSWORD} element={
            <PublicRoute><ForgotPassword /></PublicRoute>
          } />

          {/* Applicant Routes */}
          <Route path={ROUTES.STUDENT_DASHBOARD} element={
            <ProtectedRoute requiredRole={ROLES.APPLICANT}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.APPLICATION_FORM} element={
            <ProtectedRoute requiredRole={ROLES.APPLICANT}>
              <ApplicationForm />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.APPLICATION_EDIT} element={
            <ProtectedRoute requiredRole={ROLES.APPLICANT}>
              <ApplicationForm />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.APPLICATION_DETAIL} element={
            <ProtectedRoute requiredRole={ROLES.APPLICANT}>
              <ApplicationDetail />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path={ROUTES.ADMIN_DASHBOARD} element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_APPLICATIONS} element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <ApplicationsManager />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_SCREENING} element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <ScreeningReview />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_ANALYTICS} element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ADMIN_COURSES} element={
            <ProtectedRoute requiredRole={ROLES.ADMIN}>
              <CourseManager />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-navy-700">404</h1>
                <p className="text-gray-500 mt-2 mb-6">Page not found</p>
                <a href={ROUTES.LOGIN} className="btn-primary">Go Home</a>
              </div>
            </div>
          } />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App