import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import DashboardLayout from '../../components/layout/DashboardLayout'
import StepPersonalInfo from '../../components/forms/StepPersonalInfo'
import StepGuardian from '../../components/forms/StepGuardian'
import StepAcademic from '../../components/forms/StepAcademic'
import StepDocuments from '../../components/forms/StepDocuments'
import StepReview from '../../components/forms/StepReview'
import useApplicationForm from '../../hooks/useApplicationForm'
import useApplicationStore from '../../store/applicationStore'
import { ROUTES } from '../../utils/constants'

const STEPS = ['Personal Info', 'Guardian', 'Academic', 'Documents', 'Review']

const ProgressBar = ({ currentStep, totalSteps }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-2">
      {STEPS.map((step, idx) => (
        <div key={idx} className="flex flex-col items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
            idx + 1 < currentStep ? 'bg-green-500 text-white'
            : idx + 1 === currentStep ? 'bg-navy-700 text-white'
            : 'bg-gray-200 text-gray-400'
          }`}>
            {idx + 1 < currentStep ? '✓' : idx + 1}
          </div>
          <p className={`text-xs mt-1 text-center hidden md:block ${
            idx + 1 === currentStep ? 'text-navy-700 font-medium' : 'text-gray-400'
          }`}>{step}</p>
        </div>
      ))}
    </div>
    <div className="relative h-1.5 bg-gray-200 rounded-full mt-2">
      <div
        className="absolute top-0 left-0 h-full bg-navy-700 rounded-full transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
      />
    </div>
  </div>
)

const ApplicationForm = () => {
  const navigate = useNavigate()
  const { id: editId } = useParams() // present when route is /applications/:id/edit
  const { createApplication, updateApplication, submitApplication, fetchApplicationById } = useApplicationStore()
  const { currentStep, totalSteps, formData, updateFormData, nextStep, prevStep, goToStep, lastSaved, clearDraft } = useApplicationForm()
  const [applicationId, setApplicationId] = useState(editId ? parseInt(editId) : null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // When editing an existing draft, load its data into the form
  useEffect(() => {
    if (editId) {
      const loadDraft = async () => {
        try {
          const app = await fetchApplicationById(editId)
          if (app) {
            updateFormData({
              first_name: app.first_name,
              middle_name: app.middle_name,
              surname: app.surname,
              email: app.email,
              phone_number: app.phone_number,
              id_number: app.id_number,
              address: app.address,
              guardian_name: app.guardian_name,
              guardian_phone_number: app.guardian_phone_number,
              guardian_email: app.guardian_email,
              course_id: app.course_id,
              subjects: app.subjects?.map((s) => ({
                subject_id: s.subject_id,
                mark: s.mark,
              })) || [],
            })
          }
        } catch {
          toast.error('Failed to load draft. Please try again.')
          navigate(ROUTES.STUDENT_DASHBOARD)
        }
      }
      loadDraft()
    }
  }, [editId])

  const handleStep1 = (data) => { updateFormData(data); nextStep() }
  const handleStep2 = (data) => { updateFormData(data); nextStep() }

  const handleStep3 = async (data) => {
    updateFormData(data)
    try {
      if (applicationId) {
        // Editing an existing draft — update it
        await updateApplication(applicationId, { ...formData, ...data })
        toast.success('Draft updated!')
      } else {
        // New application — create it
        const app = await createApplication({ ...formData, ...data })
        setApplicationId(app.id)
        toast.success('Application draft saved!')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save application')
      return
    }
    nextStep()
  }

  const handleSubmit = async () => {
    if (!applicationId) return toast.error('No application found.')
    setIsSubmitting(true)
    try {
      await submitApplication(applicationId)
      clearDraft()
      toast.success('Application submitted successfully!')
      navigate(ROUTES.STUDENT_DASHBOARD)
    } catch (err) {
      toast.error(err.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editId ? 'Continue Application' : 'New Application'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Complete all steps to submit your application</p>
          </div>
          {lastSaved && (
            <span className="text-xs text-gray-400">Draft saved {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        <div className="card p-6">
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
          {currentStep === 1 && <StepPersonalInfo formData={formData} onNext={handleStep1} />}
          {currentStep === 2 && <StepGuardian formData={formData} onNext={handleStep2} onBack={prevStep} />}
          {currentStep === 3 && <StepAcademic formData={formData} onNext={handleStep3} onBack={prevStep} />}
          {currentStep === 4 && <StepDocuments applicationId={applicationId} onNext={nextStep} onBack={prevStep} />}
          {currentStep === 5 && <StepReview formData={formData} onSubmit={handleSubmit} onBack={prevStep} onEdit={goToStep} isSubmitting={isSubmitting} />}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ApplicationForm