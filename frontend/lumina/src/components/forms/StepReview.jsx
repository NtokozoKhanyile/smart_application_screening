const StepReview = ({ formData, onSubmit, onBack, onEdit, isSubmitting }) => {
  const courseMap = formData.courseMap || {}
  const subjectMap = formData.subjectMap || {}
  const courseName = courseMap[formData.course_id] || `Course #${formData.course_id}`

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Review & Submit</h3>
        <p className="text-sm text-gray-500">Review your application before submitting.</p>
      </div>

      <div className="space-y-4">
        {/* Personal Information */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Personal Information</h4>
            <button onClick={() => onEdit(1)} className="text-navy-700 text-xs hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Name: </span><span className="font-medium">{formData.first_name} {formData.middle_name} {formData.surname}</span></div>
            <div><span className="text-gray-500">Email: </span><span className="font-medium">{formData.email}</span></div>
            <div><span className="text-gray-500">Phone: </span><span className="font-medium">{formData.phone_number}</span></div>
            <div><span className="text-gray-500">ID: </span><span className="font-medium">{formData.id_number}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Address: </span><span className="font-medium">{formData.address}</span></div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Guardian Information</h4>
            <button onClick={() => onEdit(2)} className="text-navy-700 text-xs hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">Name: </span><span className="font-medium">{formData.guardian_name}</span></div>
            <div><span className="text-gray-500">Phone: </span><span className="font-medium">{formData.guardian_phone_number}</span></div>
            {formData.guardian_email && (
              <div><span className="text-gray-500">Email: </span><span className="font-medium">{formData.guardian_email}</span></div>
            )}
          </div>
        </div>

        {/* Academic Information */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Academic Information</h4>
            <button onClick={() => onEdit(3)} className="text-navy-700 text-xs hover:underline">Edit</button>
          </div>
          <div className="text-sm">
            <div className="mb-2">
              <span className="text-gray-500">Course: </span>
              <span className="font-medium">{courseName}</span>
            </div>
            <div className="space-y-1">
              {formData.subjects?.map((s, i) => (
                <div key={i} className="flex justify-between py-1 px-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">
                    {subjectMap[s.subject_id] || `Subject #${s.subject_id}`}
                  </span>
                  <span className={`font-semibold ${
                    s.mark >= 70 ? 'text-green-600' : s.mark >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>{s.mark}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="btn-secondary px-8">← Back</button>
        <button type="button" onClick={onSubmit} disabled={isSubmitting} className="btn-gold px-8 flex items-center gap-2">
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : 'Submit Application'}
        </button>
      </div>
    </div>
  )
}

export default StepReview