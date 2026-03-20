import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner, { TableSkeleton } from '../../components/common/LoadingSpinner'
import { applicationAPI } from '../../services/applicationService'
import { formatDate } from '../../utils/formatters'
import { APPLICATION_STATUS, ROUTES } from '../../utils/constants'
import { toast } from 'react-toastify'

const PAGE_SIZE = 20

// ── Search & Filter Bar ───────────────────────────────────────────
const FilterBar = ({ search, onSearch, statusFilter, onStatus, decisionFilter, onDecision, courseFilter, onCourse, courses }) => (
  <div className="flex flex-wrap gap-3 px-6 py-4 border-b border-gray-200 bg-gray-50">
    {/* Search */}
    <div className="relative flex-1 min-w-48">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-300 bg-white"
      />
    </div>

    {/* Status */}
    <select
      value={statusFilter}
      onChange={(e) => onStatus(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300 text-gray-600"
    >
      <option value="">All Statuses</option>
      {Object.values(APPLICATION_STATUS).map((s) => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>

    {/* Course */}
    <select
      value={courseFilter}
      onChange={(e) => onCourse(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300 text-gray-600"
    >
      <option value="">All Courses</option>
      {courses.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>

    {/* Decision */}
    <select
      value={decisionFilter}
      onChange={(e) => onDecision(e.target.value)}
      className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy-300 text-gray-600"
    >
      <option value="">All Decisions</option>
      <option value="screened">Screened</option>
      <option value="rejected">Rejected</option>
      <option value="review">Review</option>
      <option value="accept">Accepted</option>
      <option value="reject">Rejected (Admin)</option>
    </select>
  </div>
)

// ── Pagination ────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
          return (
            <button
              key={pageNum}
              onClick={() => onPage(pageNum)}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                pageNum === page
                  ? 'bg-navy-700 text-white border-navy-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          )
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const ApplicationsManager = () => {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [decisionFilter, setDecisionFilter] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchApplications()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, courseFilter, decisionFilter])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const { data } = await applicationAPI.getAllAdmin()
      setApplications(data)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  // Derive unique course names for filter dropdown
  const courses = useMemo(() => {
    const names = applications
      .map((a) => a.course?.name)
      .filter(Boolean)
    return [...new Set(names)].sort()
  }, [applications])

  // Filter
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const fullName = `${app.first_name || ''} ${app.surname || ''}`.toLowerCase()
      const email = (app.email || '').toLowerCase()
      const q = search.toLowerCase()

      if (q && !fullName.includes(q) && !email.includes(q)) return false
      if (statusFilter && app.status !== statusFilter) return false
      if (courseFilter && app.course?.name !== courseFilter) return false
      if (decisionFilter) {
        const decision = app.screening_result?.final_decision || app.screening_result?.decision
        if (decision !== decisionFilter) return false
      }
      return true
    })
  }, [applications, search, statusFilter, courseFilter, decisionFilter])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA, valB
      if (sortField === 'name') {
        valA = `${a.first_name || ''} ${a.surname || ''}`.toLowerCase()
        valB = `${b.first_name || ''} ${b.surname || ''}`.toLowerCase()
      } else if (sortField === 'course') {
        valA = a.course?.name || ''
        valB = b.course?.name || ''
      } else if (sortField === 'created_at') {
        valA = new Date(a.created_at)
        valB = new Date(b.created_at)
      } else {
        valA = a[sortField] || ''
        valB = b[sortField] || ''
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortDir])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="ml-1 text-gray-300">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // CSV Export
  const handleExport = () => {
    const headers = ['ID', 'First Name', 'Surname', 'Email', 'Course', 'Status', 'Decision', 'Score', 'Submitted']
    const rows = sorted.map((app) => [
      app.id,
      app.first_name || '',
      app.surname || '',
      app.email || '',
      app.course?.name || '',
      app.status || '',
      app.screening_result?.final_decision || app.screening_result?.decision || '',
      app.screening_result?.prediction_score ?? '',
      app.created_at ? new Date(app.created_at).toLocaleDateString() : '',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumina-applications-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${sorted.length} applications`)
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and review all submitted applications</p>
        </div>
        <button
          onClick={handleExport}
          disabled={sorted.length === 0}
          className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* Filter Bar */}
        <FilterBar
          search={search} onSearch={setSearch}
          statusFilter={statusFilter} onStatus={setStatusFilter}
          decisionFilter={decisionFilter} onDecision={setDecisionFilter}
          courseFilter={courseFilter} onCourse={setCourseFilter}
          courses={courses}
        />

        {/* Results count */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${filtered.length} application${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          {(search || statusFilter || courseFilter || decisionFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setCourseFilter(''); setDecisionFilter('') }}
              className="text-xs text-navy-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <table className="w-full">
            <TableSkeleton rows={8} cols={7} />
          </table>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No applications found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    { label: 'Student', field: 'name' },
                    { label: 'Course', field: 'course' },
                    { label: 'Status', field: 'status' },
                    { label: 'Decision', field: null },
                    { label: 'Score', field: null },
                    { label: 'Submitted', field: 'created_at' },
                    { label: 'Actions', field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={field ? () => handleSort(field) : undefined}
                      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                        field ? 'cursor-pointer hover:text-gray-700 select-none' : ''
                      }`}
                    >
                      {label}
                      {field && <SortIcon field={field} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((app) => {
                  const decision = app.screening_result?.final_decision || app.screening_result?.decision
                  const score = app.screening_result?.prediction_score
                  return (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {app.first_name && app.surname
                            ? `${app.first_name} ${app.surname}`
                            : `Applicant #${app.id}`}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{app.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.course?.name || `Course #${app.course_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3">
                        {decision
                          ? <StatusBadge status={decision} />
                          : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {score != null ? (
                          <span className={`text-sm font-semibold ${
                            score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {Math.round(score)}%
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </AdminLayout>
  )
}

export default ApplicationsManager