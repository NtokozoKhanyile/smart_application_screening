import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import AdminLayout from '../../components/layout/AdminLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner, { QueueItemSkeleton, SectionCardSkeleton } from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import Modal from '../../components/common/Modal'
import InfoRow from '../../components/common/InfoRow'
import SectionCard from '../../components/common/SectionCard'
import { applicationAPI } from '../../services/applicationService'
import api from '../../services/api'
import { formatDate, formatName } from '../../utils/formatters'
import { DOCUMENT_TYPE_LABELS } from '../../utils/constants'

const DECISIONS = {
  ACCEPT: 'accept',
  REJECT: 'reject',
  PENDING: 'pending',
}

// ── Score Bar ─────────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  if (score == null) return null
  const pct = Math.min(100, Math.max(0, Math.round(score)))
  const color = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">AI Score</span>
        <span className={`text-sm font-bold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Queue Item ────────────────────────────────────────────────────
const QueueItem = ({ app, isActive, onClick }) => {
  const score = app.screening_result?.prediction_score
  const decision = app.screening_result?.final_decision || app.screening_result?.decision
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
        isActive ? 'bg-navy-50 border-l-4 border-l-navy-700' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-900 truncate">
          {app.first_name && app.surname
            ? `${app.first_name} ${app.surname}`
            : `Applicant #${app.id}`}
        </p>
        {score != null && (
          <span className={`text-xs font-semibold ml-2 flex-shrink-0 ${
            score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'
          }`}>
            {Math.round(score)}%
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 truncate">{app.course?.name || `Course #${app.course_id}`}</p>
        {decision && <StatusBadge status={decision} />}
      </div>
    </button>
  )
}

// ── Keyboard Hint ─────────────────────────────────────────────────
const KeyHint = ({ keys, label }) => (
  <div className="flex items-center gap-1.5">
    {keys.map((k) => (
      <kbd key={k} className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded font-mono">{k}</kbd>
    ))}
    <span className="text-xs text-gray-400">{label}</span>
  </div>
)

// ── Main Component ────────────────────────────────────────────────
const ScreeningReview = () => {
  const [applications, setApplications] = useState([])
  const [screeningResults, setScreeningResults] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [pendingDecision, setPendingDecision] = useState(null) // decision awaiting confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [appsRes, resultsRes] = await Promise.all([
        applicationAPI.getAllAdmin(),
        api.get('/predictions/screening-results'),
      ])
      setApplications(appsRes.data)
      setScreeningResults(resultsRes.data)
      // Auto-select first
      if (appsRes.data.length > 0) setSelectedId(appsRes.data[0].id)
    } catch {
      toast.error('Failed to load screening data')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedApp = applications.find((a) => a.id === selectedId) || null
  const selectedResult = screeningResults.find((r) => r.application_id === selectedId) || selectedApp?.screening_result || null

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    const name = `${app.first_name || ''} ${app.surname || ''}`.toLowerCase()
    return name.includes(q) || (app.email || '').toLowerCase().includes(q)
  })

  const currentIndex = filteredApps.findIndex((a) => a.id === selectedId)

  const goNext = useCallback(() => {
    if (currentIndex < filteredApps.length - 1) {
      setSelectedId(filteredApps[currentIndex + 1].id)
      setNotes('')
    }
  }, [currentIndex, filteredApps])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedId(filteredApps[currentIndex - 1].id)
      setNotes('')
    }
  }, [currentIndex, filteredApps])

  const initiateDecision = (decision) => {
    if (!selectedApp) return
    setPendingDecision(decision)
    setShowConfirm(true)
  }

  const confirmDecision = async () => {
    if (!pendingDecision) return
    if (!selectedResult) return toast.error('This application has no screening result yet. It must be submitted and screened before a decision can be recorded.')
    setIsSubmitting(true)
    try {
      await api.patch(`/predictions/screening-results/${selectedResult.id}/review`, {
        final_decision: pendingDecision,
        admin_notes: notes,
      })
      toast.success(`Application ${pendingDecision === DECISIONS.ACCEPT ? 'accepted' : pendingDecision === DECISIONS.REJECT ? 'rejected' : 'marked pending'}`)
      setShowConfirm(false)
      setNotes('')
      setPendingDecision(null)
      await fetchData()
      goNext()
    } catch {
      toast.error('Failed to submit decision')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedApp) return
    setIsDeleting(true)
    try {
      await applicationAPI.delete(selectedApp.id)
      toast.success('Application deleted')
      setShowDeleteConfirm(false)
      await fetchData()
    } catch {
      toast.error('Failed to delete application')
    } finally {
      setIsDeleting(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
      if (e.key === 'a' || e.key === 'A') initiateDecision(DECISIONS.ACCEPT)
      if (e.key === 'r' || e.key === 'R') initiateDecision(DECISIONS.REJECT)
      if (e.key === 'p' || e.key === 'P') initiateDecision(DECISIONS.PENDING)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, selectedResult])

  const decisionLabel = {
    [DECISIONS.ACCEPT]: 'Accept',
    [DECISIONS.REJECT]: 'Reject',
    [DECISIONS.PENDING]: 'Mark as Pending',
  }

  const decisionColor = {
    [DECISIONS.ACCEPT]: 'text-green-700',
    [DECISIONS.REJECT]: 'text-red-600',
    [DECISIONS.PENDING]: 'text-amber-600',
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-between mb-4">
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-3 w-32 bg-gray-200 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <div className="h-7 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="flex-1">
              {Array.from({ length: 6 }).map((_, i) => <QueueItemSkeleton key={i} />)}
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <SectionCardSkeleton rows={4} />
            <SectionCardSkeleton rows={3} />
            <SectionCardSkeleton rows={5} />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Screening Review</h1>
          <p className="text-gray-500 text-sm mt-1">{applications.length} application{applications.length !== 1 ? 's' : ''} in queue</p>
        </div>
        <div className="flex items-center gap-4">
          <KeyHint keys={['↑', '↓']} label="navigate" />
          <KeyHint keys={['A']} label="accept" />
          <KeyHint keys={['R']} label="reject" />
          <KeyHint keys={['P']} label="pending" />
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="card">
          <EmptyState
            variant="queue"
            title="Queue is empty"
            description="All applications have been reviewed. Check back later for new submissions."
          />
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-200px)]">

          {/* ── Left: Queue ── */}
          <div className="w-72 flex-shrink-0 card overflow-hidden flex flex-col">
            {/* Queue search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
              </div>
            </div>

            {/* Queue list */}
            <div className="flex-1 overflow-y-auto">
              {filteredApps.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No results</p>
              ) : (
                filteredApps.map((app) => (
                  <QueueItem
                    key={app.id}
                    app={app}
                    isActive={app.id === selectedId}
                    onClick={() => { setSelectedId(app.id); setNotes('') }}
                  />
                ))
              )}
            </div>

            {/* Navigation footer */}
            <div className="p-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-xs text-gray-400">
                {currentIndex + 1} / {filteredApps.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex >= filteredApps.length - 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── Right: Detail ── */}
          {selectedApp ? (
            <div className="flex-1 overflow-y-auto space-y-4">

              {/* AI Result */}
              {selectedResult ? (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Screening Result</h3>
                  <div className="space-y-3">
                    <ScoreBar score={selectedResult.prediction_score} />
                    <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Application
                  </button>
                </div>
                <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">AI Decision</p>
                        <StatusBadge status={selectedResult.decision} />
                      </div>
                      {selectedResult.final_decision && (
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">Admin Decision</p>
                          <StatusBadge status={selectedResult.final_decision} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Model</p>
                        <p className="text-xs text-gray-700 font-mono">{selectedResult.model_version || '—'}</p>
                      </div>
                    </div>
                    {selectedResult.admin_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Previous Admin Notes</p>
                        <p className="text-xs text-amber-800">{selectedResult.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card p-5 text-center text-gray-400 text-sm">
                  No screening result yet for this application.
                </div>
              )}

              {/* Personal Info */}
              <SectionCard title="Personal Information">
                <InfoRow label="Full Name" value={formatName(selectedApp.first_name, selectedApp.middle_name, selectedApp.surname)} />
                <InfoRow label="Email" value={selectedApp.email} />
                <InfoRow label="Phone" value={selectedApp.phone_number} />
                <InfoRow label="ID Number" value={selectedApp.id_number} />
                <InfoRow label="Address" value={selectedApp.address} />
              </SectionCard>

              {/* Guardian Info */}
              <SectionCard title="Guardian Information">
                <InfoRow label="Guardian Name" value={selectedApp.guardian_name} />
                <InfoRow label="Guardian Phone" value={selectedApp.guardian_phone_number} />
                <InfoRow label="Guardian Email" value={selectedApp.guardian_email} />
              </SectionCard>

              {/* Academic Info */}
              <SectionCard title="Academic Information">
                <InfoRow label="Course" value={selectedApp.course?.name || `Course #${selectedApp.course_id}`} />
                {selectedApp.subjects?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedApp.subjects.map((s, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{s.subject?.name || `Subject #${s.subject_id}`}</span>
                        <span className={`text-sm font-semibold ${
                          s.mark >= 70 ? 'text-green-600' : s.mark >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>{s.mark}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              {/* Documents */}
              {selectedApp.documents?.length > 0 && (
                <SectionCard title="Documents">
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            {DOCUMENT_TYPE_LABELS[doc.content_type] || doc.content_type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</span>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Admin Action Panel */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Admin Decision</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-300 resize-none mb-4"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => initiateDecision(DECISIONS.ACCEPT)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept
                  </button>
                  <button
                    onClick={() => initiateDecision(DECISIONS.PENDING)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending
                  </button>
                  <button
                    onClick={() => initiateDecision(DECISIONS.REJECT)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 card flex items-center justify-center text-gray-400 text-sm">
              Select an application from the queue
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => { setShowConfirm(false); setPendingDecision(null) }}
        title="Confirm Decision"
      >
        <p className="text-gray-600 text-sm mb-2">
          You are about to{' '}
          <span className={`font-semibold ${decisionColor[pendingDecision]}`}>
            {decisionLabel[pendingDecision]}
          </span>{' '}
          the application for{' '}
          <span className="font-medium text-gray-900">
            {selectedApp?.first_name} {selectedApp?.surname}
          </span>.
        </p>
        {notes && (
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 text-sm text-gray-600 italic">
            "{notes}"
          </div>
        )}
        <p className="text-xs text-gray-400 mb-6">This action will be recorded in the audit trail.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setShowConfirm(false); setPendingDecision(null) }}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDecision}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors flex items-center gap-2 ${
              pendingDecision === DECISIONS.ACCEPT ? 'bg-green-600 hover:bg-green-700'
              : pendingDecision === DECISIONS.REJECT ? 'bg-red-600 hover:bg-red-700'
              : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirm {decisionLabel[pendingDecision]}
          </button>
        </div>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Application"
      >
        <p className="text-gray-600 text-sm mb-2">
          Are you sure you want to delete the application for{' '}
          <span className="font-medium text-gray-900">
            {selectedApp?.first_name} {selectedApp?.surname}
          </span>?
        </p>
        <p className="text-xs text-red-500 mb-6">This action is permanent and cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary" disabled={isDeleting}>Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2">
            {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </Modal>
    </AdminLayout>
  )
}

export default ScreeningReview