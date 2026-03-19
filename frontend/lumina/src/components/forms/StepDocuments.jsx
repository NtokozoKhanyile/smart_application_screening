import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-toastify'
import { documentAPI } from '../../services/documentService'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../utils/constants'

const Dropzone = ({ contentType, onFileSelect, isUploading, isUploaded, uploadedFile, required }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    onDrop: (files) => files[0] && onFileSelect(files[0]),
  })

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {DOCUMENT_TYPE_LABELS[contentType]}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
        isUploaded ? 'border-green-400 bg-green-50' : isDragActive ? 'border-navy-500 bg-navy-50' : 'border-gray-300 hover:border-navy-400'
      }`}>
        <input {...getInputProps()} />
        {isUploaded ? (
          <div className="flex items-center justify-center gap-2 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{uploadedFile?.name} — Uploaded</span>
          </div>
        ) : isUploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div>
            <svg className="w-7 h-7 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  )
}

const StepDocuments = ({ applicationId, onNext, onBack }) => {
  const [uploads, setUploads] = useState({})
  const [uploading, setUploading] = useState({})
  const [uploaded, setUploaded] = useState({})

  const handleUpload = async (contentType, file) => {
    if (!applicationId) return toast.error('Application not saved yet.')
    setUploading(prev => ({ ...prev, [contentType]: true }))
    try {
      await documentAPI.upload(applicationId, contentType, file)
      setUploaded(prev => ({ ...prev, [contentType]: true }))
      setUploads(prev => ({ ...prev, [contentType]: file }))
      toast.success(`${DOCUMENT_TYPE_LABELS[contentType]} uploaded!`)
    } catch {
      toast.error(`Failed to upload ${DOCUMENT_TYPE_LABELS[contentType]}`)
    } finally {
      setUploading(prev => ({ ...prev, [contentType]: false }))
    }
  }

  const canProceed = uploaded[DOCUMENT_TYPES.ACADEMIC_RESULTS] && uploaded[DOCUMENT_TYPES.ID_COPY]

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Document Upload</h3>
        <p className="text-sm text-gray-500">Academic results and ID copy are required.</p>
      </div>

      <div className="space-y-4">
        {Object.values(DOCUMENT_TYPES).map(docType => (
          <Dropzone
            key={docType}
            contentType={docType}
            onFileSelect={(file) => handleUpload(docType, file)}
            isUploading={uploading[docType]}
            isUploaded={uploaded[docType]}
            uploadedFile={uploads[docType]}
            required={docType !== DOCUMENT_TYPES.GUARDIAN_ID}
          />
        ))}
      </div>

      <div className="flex justify-between mt-6">
        <button type="button" onClick={onBack} className="btn-secondary px-8">← Back</button>
        <button type="button" onClick={onNext} disabled={!canProceed} className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  )
}

export default StepDocuments