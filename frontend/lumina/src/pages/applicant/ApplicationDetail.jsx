import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Modal from '../../components/common/Modal'
import InfoRow from '../../components/common/InfoRow'
import SectionCard from '../../components/common/SectionCard'
import ScreeningResultCard from '../../components/common/ScreeningResultCard'
import useApplicationStore from '../../store/applicationStore'
import { applicationAPI } from '../../services/applicationService'
import { formatDate, formatName } from '../../utils/formatters'
import { APPLICATION_STATUS, ROUTES } from '../../utils/constants'

const ApplicationDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentApplication, isLoading, fetchApplicationById } = useApplicationStore()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchApplicationById(id)
  }, [id])

  const handleResubmit = async () => {
    setIsSubmitting(true)
    try {
      await applicationAPI.submit(id)
      toast.success('Application resubmitted!')
      fetchApplicationById(id)
    } catch {
      toast.error('Failed to resubmit application')
    } finally {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" message="Loading application..." />
        </div>
      </DashboardLayout>
    )
  }

  if (!currentApplication) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <p className="text-gray-500">Application not found.</p>
          <button onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const app = currentApplication
  const isDraft = app.status === APPLICATION_STATUS.DRAFT
  const isRejected = app.status === APPLICATION_STATUS.REJECTED

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(ROUTES.STUDENT_DASHBOARD)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application: {app.id}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Created {formatDate(app.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={app.status} />
          {isDraft && (
            <button
              onClick={() => navigate(`/applications/${app.id}/edit`)}
              className="btn-secondary"
            >
              Continue Editing
            </button>
          )}
          {isRejected && (
            <button onClick={() => setShowSubmitModal(true)} className="btn-primary">
              Resubmit
            </button>
          )}
        </div>
      </div>

      {/* Screening Result — sourced from nested application data, no extra API call */}
      <ScreeningResultCard result={app.screening_result} />

      {/* Personal Info */}
      <SectionCard title="Personal Information">
        <InfoRow label="Full Name" value={formatName(app.first_name, app.middle_name, app.surname)} />
        <InfoRow label="Email" value={app.email} />
        <InfoRow label="Phone" value={app.phone_number} />
        <InfoRow label="ID Number" value={app.id_number} />
        <InfoRow label="Address" value={app.address} />
      </SectionCard>

      {/* Guardian Info */}
      <SectionCard title="Guardian Information">
        <InfoRow label="Guardian Name" value={app.guardian_name} />
        <InfoRow label="Guardian Phone" value={app.guardian_phone_number} />
        <InfoRow label="Guardian Email" value={app.guardian_email} />
      </SectionCard>

      {/* Academic Info */}
      <SectionCard title="Academic Information">
        <InfoRow label="Course" value={app.course?.name || `Course #${app.course_id}`} />
        {app.subjects?.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-2">Subject Marks</p>
            <div className="space-y-2">
              {app.subjects.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{s.subject?.name || `Subject #${s.subject_id}`}</span>
                  <span className={`text-sm font-semibold ${
                    s.mark >= 70 ? 'text-green-600' : s.mark >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>{s.mark}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Documents */}
      {app.documents?.length > 0 && (
        <SectionCard title="Documents">
          <div className="space-y-2">
            {app.documents.map((doc, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">{doc.content_type}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Resubmit Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Resubmit Application">
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to resubmit? It will go through AI screening again.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowSubmitModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleResubmit} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resubmitting...</>
            ) : 'Yes, Resubmit'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

export default ApplicationDetail