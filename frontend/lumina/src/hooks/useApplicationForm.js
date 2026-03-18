import { useState, useEffect, useRef } from 'react'

const TOTAL_STEPS = 5
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

const useApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('application_draft')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })
  const [lastSaved, setLastSaved] = useState(null)
  const autoSaveTimer = useRef(null)

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        localStorage.setItem('application_draft', JSON.stringify(formData))
        setLastSaved(new Date())
      }
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(autoSaveTimer.current)
  }, [formData])

  const updateFormData = (stepData) => {
    setFormData((prev) => ({ ...prev, ...stepData }))
  }

  const saveNow = () => {
    localStorage.setItem('application_draft', JSON.stringify(formData))
    setLastSaved(new Date())
  }

  const clearDraft = () => {
    localStorage.removeItem('application_draft')
    setFormData({})
    setLastSaved(null)
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      saveNow()
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1)
  }

  const goToStep = (step) => {
    if (step >= 1 && step <= TOTAL_STEPS) setCurrentStep(step)
  }

  return {
    currentStep,
    totalSteps: TOTAL_STEPS,
    formData,
    lastSaved,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    saveNow,
    clearDraft,
  }
}

export default useApplicationForm