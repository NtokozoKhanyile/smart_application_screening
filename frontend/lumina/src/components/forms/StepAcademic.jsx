import { useState, useEffect } from 'react'
import FormError from './FormError'
import { courseAPI } from '../../services/courseService'
import { subjectAPI } from '../../services/subjectService'

const StepAcademic = ({ formData, onNext, onBack }) => {
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(formData.course_id || '')
  const [subjectEntries, setSubjectEntries] = useState(
    formData.subjects || [{ subject_id: '', mark: '' }]
  )
  const [error, setError] = useState('')

  useEffect(() => {
    courseAPI.getAll().then(r => setCourses(r.data)).catch(() => {})
    subjectAPI.getAll().then(r => setSubjects(r.data)).catch(() => {})
  }, [])

  const addSubject = () =>
    setSubjectEntries([...subjectEntries, { subject_id: '', mark: '' }])

  const removeSubject = (idx) =>
    setSubjectEntries(subjectEntries.filter((_, i) => i !== idx))

  const updateSubject = (idx, field, value) => {
    const updated = [...subjectEntries]
    updated[idx][field] = value
    setSubjectEntries(updated)
  }

  const handleNext = () => {
    setError('')
    if (!selectedCourse) return setError('Please select a course.')
    const valid = subjectEntries.filter(
      s => s.subject_id && s.mark !== '' && Number(s.mark) >= 0 && Number(s.mark) <= 100
    )
    if (valid.length === 0) return setError('Please add at least one subject with a valid mark.')
    onNext({
      course_id: Number(selectedCourse),
      subjects: valid.map(s => ({ subject_id: Number(s.subject_id), mark: Number(s.mark) })),
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Academic Information</h3>
        <p className="text-sm text-gray-500">Select your course and enter your subject marks.</p>
      </div>

      <FormError message={error} />

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Course <span className="text-red-500">*</span>
        </label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="input-field">
          <option value="">Select a course</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Subject Marks</label>
          <button type="button" onClick={addSubject} className="text-navy-700 text-sm font-medium">
            + Add Subject
          </button>
        </div>
        <div className="space-y-3">
          {subjectEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <select value={entry.subject_id} onChange={e => updateSubject(idx, 'subject_id', e.target.value)} className="input-field flex-1">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input
                type="number" min="0" max="100"
                value={entry.mark}
                onChange={e => updateSubject(idx, 'mark', e.target.value)}
                placeholder="Mark"
                className="input-field w-24"
              />
              {subjectEntries.length > 1 && (
                <button type="button" onClick={() => removeSubject(idx)} className="text-red-400 hover:text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="btn-secondary px-8">← Back</button>
        <button type="button" onClick={handleNext} className="btn-primary px-8">Next →</button>
      </div>
    </div>
  )
}

export default StepAcademic