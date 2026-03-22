import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import useApplicationStore from '../../store/applicationStore'
import { applicationAPI } from '../../services/applicationService'
import Modal from '../../components/common/Modal'
import useAuth from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatters'
import { toast } from 'react-toastify'
import { ROUTES, APPLICATION_STATUS } from '../../utils/constants'

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div className="card p-4 lg:p-5 flex items-center gap-3 lg:gap-4">
    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs lg:text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

// ── Main Component ───────────────────────────────────────────────
const StudentDashboard = () => {
  const { user } = useAuth()
  const { applications, isLoading, fetchApplications } = useApplicationStore()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await applicationAPI.delete(deleteTarget.id)
      await fetchApplications()
      toast.success('Application deleted')
    } catch {
      toast.error('Failed to delete application')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === APPLICATION_STATUS.UNDER_REVIEW).length,
    screened: applications.filter((a) => a.status === APPLICATION_STATUS.RECOMMENDED).length,
    accepted: applications.filter((a) => a.status === APPLICATION_STATUS.ACCEPTED).length,
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-xs lg:text-sm mt-1">
            Welcome back, <span className="font-medium text-navy-700">{user?.email}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.APPLICATION_FORM)}
          className="btn-primary flex items-center gap-2 text-sm px-3 py-2 lg:px-4 lg:py-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">New Application</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5 lg:mb-6">
        <StatCard
          label="Total"
          value={stats.total}
          color="bg-navy-50 text-navy-700"
          icon={
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Screened"
          value={stats.screened}
          color="bg-purple-50 text-purple-600"
          icon={
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label="Accepted"
          value={stats.accepted}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm lg:text-base font-semibold text-gray-900">My Applications</h2>
          <span className="text-xs lg:text-sm text-gray-400">{applications.length} total</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="md" message="Loading applications..." />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            variant="applications"
            title="No applications yet"
            description="Start your journey by creating your first application."
            action={() => navigate(ROUTES.APPLICATION_FORM)}
            actionLabel="Create Application"
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Course', 'Status', 'Submitted', 'Decision', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {app.course?.name || `Course #${app.course_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(app.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {app.screening_result ? (
                          <StatusBadge status={app.screening_result.final_decision || app.screening_result.decision} />
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="text-navy-700 hover:text-navy-900 text-sm font-medium hover:underline"
                          >
                            View →
                          </button>
                          {app.status === 'draft' && (
                            <button
                              onClick={() => setDeleteTarget(app)}
                              className="text-red-400 hover:text-red-600 text-sm font-medium hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {applications.map((app) => (
                <div key={app.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {app.course?.name || `Course #${app.course_id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(app.created_at)}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Decision:</span>
                      {app.screening_result ? (
                        <StatusBadge status={app.screening_result.final_decision || app.screening_result.decision} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/applications/${app.id}`)}
                        className="text-navy-700 text-sm font-medium hover:underline"
                      >
                        View →
                      </button>
                      {app.status === 'draft' && (
                        <button
                          onClick={() => setDeleteTarget(app)}
                          className="text-red-400 text-sm font-medium hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Application"
      >
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete your <span className="font-medium">{deleteTarget?.course?.name || 'draft'}</span> application? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="btn-secondary" disabled={isDeleting}>Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2">
            {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default StudentDashboard