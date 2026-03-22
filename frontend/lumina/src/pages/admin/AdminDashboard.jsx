import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner, { DashboardSkeleton, TableRowSkeleton } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import api from '../../services/api'
import { applicationAPI } from '../../services/applicationService'
import { formatDate } from '../../utils/formatters'
import { ROUTES } from '../../utils/constants'

// ── Stat Card ─────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">
        {value ?? <span className="text-gray-300 text-lg">—</span>}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

// ── Quick Action Button ───────────────────────────────────────────
const ActionButton = ({ label, description, icon, onClick, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex items-center gap-4 ${
      variant === 'primary'
        ? 'bg-navy-700 border-navy-700 text-white hover:bg-navy-800'
        : 'bg-white border-gray-200 text-gray-800 hover:border-navy-300'
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
      variant === 'primary' ? 'bg-navy-600' : 'bg-gray-100'
    }`}>
      {icon}
    </div>
    <div>
      <p className={`text-sm font-semibold ${variant === 'primary' ? 'text-white' : 'text-gray-900'}`}>
        {label}
      </p>
      <p className={`text-xs mt-0.5 ${variant === 'primary' ? 'text-navy-200' : 'text-gray-400'}`}>
        {description}
      </p>
    </div>
  </button>
)

// ── Main Component ────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentApplications, setRecentApplications] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentApplications()
  }, [])

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const { data } = await api.get('/admin/dashboard')
      setStats(data)
    } catch {
      toast.error('Failed to load dashboard stats')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchRecentApplications = async () => {
    setLoadingApps(true)
    try {
      const { data } = await applicationAPI.getAllAdmin()
      // Sort by created_at descending, take latest 5
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setRecentApplications(sorted.slice(0, 5))
    } catch {
      toast.error('Failed to load recent applications')
    } finally {
      setLoadingApps(false)
    }
  }

  const pendingCount = recentApplications.filter
    ? stats?.total_screened - stats?.ai_approvals - stats?.ai_rejections
    : null

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all screening activity</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchRecentApplications() }}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 bg-gray-200 rounded-lg" />
                <div className="h-3 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Screened"
            value={stats?.total_screened}
            color="bg-navy-50 text-navy-700"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="AI Approvals"
            value={stats?.ai_approvals}
            color="bg-green-50 text-green-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="AI Rejections"
            value={stats?.ai_rejections}
            color="bg-red-50 text-red-500"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Admin Overrides"
            value={stats?.admin_overrides}
            color="bg-amber-50 text-amber-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <StatCard
            label="Avg AI Score"
            value={stats?.average_ai_score != null ? `${Math.round(stats.average_ai_score)}%` : null}
            color="bg-purple-50 text-purple-600"
            sub="across all screened"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Applications</h2>
            <button
              onClick={() => navigate(ROUTES.ADMIN_APPLICATIONS)}
              className="text-sm text-navy-700 hover:underline font-medium"
            >
              View all →
            </button>
          </div>

          {loadingApps ? (
            <table className="w-full">
              <tbody className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[28, 20, 16, 16, 12].map((w, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className={`h-3.5 bg-gray-200 rounded-lg w-${w}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : recentApplications.length === 0 ? (
            <EmptyState
              variant="applications"
              title="No applications yet"
              description="Applications will appear here once students start submitting."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Applicant', 'Course', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {app.first_name && app.surname
                          ? `${app.first_name} ${app.surname}`
                          : app.email || `#${app.id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {app.course?.name || `Course #${app.course_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(ROUTES.ADMIN_SCREENING)}
                          className="text-navy-700 hover:text-navy-900 text-sm font-medium hover:underline"
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 px-1">Quick Actions</h2>
          <ActionButton
            variant="primary"
            label="Review Pending"
            description="Process applications awaiting review"
            onClick={() => navigate(ROUTES.ADMIN_SCREENING)}
            icon={
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <ActionButton
            label="View All Applications"
            description="Browse and filter all submissions"
            onClick={() => navigate(ROUTES.ADMIN_APPLICATIONS)}
            icon={
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
          />
          <ActionButton
            label="Analytics"
            description="Charts and decision breakdowns"
            onClick={() => navigate(ROUTES.ADMIN_ANALYTICS)}
            icon={
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard