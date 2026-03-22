import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { courseAPI } from '../../services/courseService'
import { subjectAPI } from '../../services/subjectService'

// ── Small reusable confirm modal ──────────────────────────────────
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-gray-600 text-sm mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
      <button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center gap-2">
        {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        Delete
      </button>
    </div>
  </Modal>
)

// ── Tab Button ────────────────────────────────────────────────────
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-navy-700 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
)

// ══════════════════════════════════════════════════════════════════
// COURSES TAB
// ══════════════════════════════════════════════════════════════════
const CoursesTab = ({ subjects }) => {
  const [courses, setCourses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showReqModal, setShowReqModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [editingReq, setEditingReq] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'course'|'req', id, courseId? }
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [requirements, setRequirements] = useState([])
  const [loadingReqs, setLoadingReqs] = useState(false)

  // Course form state
  const [courseForm, setCourseForm] = useState({ name: '', approval_threshold: '' })
  // Requirement form state
  const [reqForm, setReqForm] = useState({ subject_id: '', minimum_mark: '', weight: '' })

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    setIsLoading(true)
    try {
      const { data } = await courseAPI.getAll()
      setCourses(data)
    } catch { toast.error('Failed to load courses') }
    finally { setIsLoading(false) }
  }

  const fetchRequirements = async (courseId) => {
    setLoadingReqs(true)
    try {
      const { data } = await courseAPI.getRequirements(courseId)
      setRequirements(data)
    } catch { toast.error('Failed to load requirements') }
    finally { setLoadingReqs(false) }
  }

  const openCourseModal = (course = null) => {
    setEditingCourse(course)
    setCourseForm(course ? { name: course.name, approval_threshold: course.approval_threshold } : { name: '', approval_threshold: '' })
    setShowCourseModal(true)
  }

  const openReqModal = (req = null) => {
    setEditingReq(req)
    setReqForm(req ? { subject_id: req.subject_id, minimum_mark: req.minimum_mark, weight: req.weight } : { subject_id: '', minimum_mark: '', weight: '' })
    setShowReqModal(true)
  }

  const selectCourse = (course) => {
    setSelectedCourse(course)
    fetchRequirements(course.id)
  }

  const saveCourse = async () => {
    if (!courseForm.name.trim()) return toast.error('Course name is required')
    if (!courseForm.approval_threshold) return toast.error('Approval threshold is required')
    setIsSaving(true)
    try {
      if (editingCourse) {
        await courseAPI.update(editingCourse.id, { name: courseForm.name, approval_threshold: Number(courseForm.approval_threshold) })
        toast.success('Course updated')
        if (selectedCourse?.id === editingCourse.id) {
          setSelectedCourse({ ...selectedCourse, name: courseForm.name, approval_threshold: Number(courseForm.approval_threshold) })
        }
      } else {
        await courseAPI.create({ name: courseForm.name, approval_threshold: Number(courseForm.approval_threshold) })
        toast.success('Course created')
      }
      setShowCourseModal(false)
      fetchCourses()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save course')
    } finally { setIsSaving(false) }
  }

  const saveRequirement = async () => {
    if (!reqForm.subject_id) return toast.error('Subject is required')
    if (!reqForm.minimum_mark) return toast.error('Minimum mark is required')
    if (!reqForm.weight) return toast.error('Weight is required')
    setIsSaving(true)
    try {
      if (editingReq) {
        await courseAPI.updateRequirement(selectedCourse.id, editingReq.id, {
          minimum_mark: Number(reqForm.minimum_mark),
          weight: Number(reqForm.weight),
        })
        toast.success('Requirement updated')
      } else {
        await courseAPI.addRequirement(selectedCourse.id, {
          subject_id: Number(reqForm.subject_id),
          minimum_mark: Number(reqForm.minimum_mark),
          weight: Number(reqForm.weight),
        })
        toast.success('Requirement added')
      }
      setShowReqModal(false)
      fetchRequirements(selectedCourse.id)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to save requirement')
    } finally { setIsSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'course') {
        await courseAPI.delete(deleteTarget.id)
        toast.success('Course deleted')
        if (selectedCourse?.id === deleteTarget.id) setSelectedCourse(null)
        fetchCourses()
      } else {
        await courseAPI.deleteRequirement(selectedCourse.id, deleteTarget.id)
        toast.success('Requirement deleted')
        fetchRequirements(selectedCourse.id)
      }
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete')
    } finally { setIsDeleting(false) }
  }

  const subjectName = (id) => subjects.find((s) => s.id === Number(id))?.name || `Subject #${id}`

  return (
    <div className="flex gap-6">
      {/* ── Left: Course List ── */}
      <div className="w-72 flex-shrink-0 card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Courses</h3>
          <button onClick={() => openCourseModal()} className="text-xs text-white bg-navy-700 hover:bg-navy-800 px-2.5 py-1 rounded-lg transition-colors">
            + New
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
        ) : courses.length === 0 ? (
          <EmptyState variant="stats" title="No courses yet" description="Create your first course." />
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => selectCourse(course)}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${
                  selectedCourse?.id === course.id ? 'bg-navy-50 border-l-4 border-l-navy-700' : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Threshold: {course.approval_threshold}%</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openCourseModal(course) }}
                    className="p-1 text-gray-400 hover:text-navy-700 rounded"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'course', id: course.id }) }}
                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Requirements ── */}
      <div className="flex-1 card overflow-hidden">
        {!selectedCourse ? (
          <EmptyState variant="stats" title="Select a course" description="Click a course on the left to manage its subject requirements." />
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{selectedCourse.name} — Requirements</h3>
                <p className="text-xs text-gray-400 mt-0.5">Approval threshold: {selectedCourse.approval_threshold}%</p>
              </div>
              <button onClick={() => openReqModal()} className="text-xs text-white bg-navy-700 hover:bg-navy-800 px-2.5 py-1 rounded-lg transition-colors">
                + Add Requirement
              </button>
            </div>

            {loadingReqs ? (
              <div className="flex justify-center py-8"><LoadingSpinner size="sm" /></div>
            ) : requirements.length === 0 ? (
              <EmptyState variant="stats" title="No requirements" description="Add subject requirements for this course." />
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Subject', 'Min Mark', 'Weight', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{subjectName(req.subject_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.minimum_mark}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{req.weight}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openReqModal(req)} className="text-navy-700 hover:text-navy-900 text-xs font-medium hover:underline">Edit</button>
                          <button onClick={() => setDeleteTarget({ type: 'req', id: req.id })} className="text-red-400 hover:text-red-600 text-xs font-medium hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Course Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title={editingCourse ? 'Edit Course' : 'New Course'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Course Name <span className="text-red-500">*</span></label>
            <input
              type="text" value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="input-field w-full" placeholder="e.g. BSc Computer Science"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Approval Threshold (%) <span className="text-red-500">*</span></label>
            <input
              type="number" min="0" max="100" value={courseForm.approval_threshold}
              onChange={(e) => setCourseForm({ ...courseForm, approval_threshold: e.target.value })}
              className="input-field w-full" placeholder="e.g. 70"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setShowCourseModal(false)} className="btn-secondary" disabled={isSaving}>Cancel</button>
          <button onClick={saveCourse} disabled={isSaving} className="btn-primary flex items-center gap-2">
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editingCourse ? 'Save Changes' : 'Create Course'}
          </button>
        </div>
      </Modal>

      {/* Requirement Modal */}
      <Modal isOpen={showReqModal} onClose={() => setShowReqModal(false)} title={editingReq ? 'Edit Requirement' : 'Add Requirement'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Subject <span className="text-red-500">*</span></label>
            <select
              value={reqForm.subject_id}
              onChange={(e) => setReqForm({ ...reqForm, subject_id: e.target.value })}
              className="input-field w-full"
              disabled={!!editingReq}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Minimum Mark (%) <span className="text-red-500">*</span></label>
            <input
              type="number" min="0" max="100" value={reqForm.minimum_mark}
              onChange={(e) => setReqForm({ ...reqForm, minimum_mark: e.target.value })}
              className="input-field w-full" placeholder="e.g. 60"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Weight <span className="text-red-500">*</span></label>
            <input
              type="number" min="0" max="10" step="0.1" value={reqForm.weight}
              onChange={(e) => setReqForm({ ...reqForm, weight: e.target.value })}
              className="input-field w-full" placeholder="e.g. 1.5"
            />
            <p className="text-xs text-gray-400 mt-1">Weight affects how much this subject influences the AI score.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => setShowReqModal(false)} className="btn-secondary" disabled={isSaving}>Cancel</button>
          <button onClick={saveRequirement} disabled={isSaving} className="btn-primary flex items-center gap-2">
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {editingReq ? 'Save Changes' : 'Add Requirement'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title={deleteTarget?.type === 'course' ? 'Delete Course' : 'Delete Requirement'}
        message={deleteTarget?.type === 'course'
          ? 'Are you sure you want to delete this course? All associated requirements will also be deleted.'
          : 'Are you sure you want to delete this subject requirement?'}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// SUBJECTS TAB
// ══════════════════════════════════════════════════════════════════
const SubjectsTab = ({ subjects, onRefresh }) => {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))

  const createSubject = async () => {
    if (!newName.trim()) return toast.error('Subject name is required')
    setIsSaving(true)
    try {
      await subjectAPI.create({ name: newName.trim() })
      toast.success('Subject created')
      setShowModal(false)
      setNewName('')
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create subject')
    } finally { setIsSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await subjectAPI.delete(deleteTarget.id)
      toast.success('Subject deleted')
      setDeleteTarget(null)
      onRefresh()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete subject')
    } finally { setIsDeleting(false) }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search subjects..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-300"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="text-sm text-white bg-navy-700 hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
          + New Subject
        </button>
      </div>

      <div className="px-4 py-2 border-b border-gray-100">
        <p className="text-xs text-gray-400">{filtered.length} subject{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState variant="search" title="No subjects found" description="Try a different search term." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:gap-0">
          {filtered.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 group">
              <span className="text-sm text-gray-700">{subject.name}</span>
              <button
                onClick={() => setDeleteTarget(subject)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Subject Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setNewName('') }} title="New Subject">
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-1">Subject Name <span className="text-red-500">*</span></label>
          <input
            type="text" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createSubject()}
            className="input-field w-full" placeholder="e.g. Mathematics"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => { setShowModal(false); setNewName('') }} className="btn-secondary" disabled={isSaving}>Cancel</button>
          <button onClick={createSubject} disabled={isSaving} className="btn-primary flex items-center gap-2">
            {isSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Create Subject
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect existing applications and course requirements.`}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
const CourseManager = () => {
  const [activeTab, setActiveTab] = useState('courses')
  const [subjects, setSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  useEffect(() => { fetchSubjects() }, [])

  const fetchSubjects = async () => {
    setLoadingSubjects(true)
    try {
      const { data } = await subjectAPI.getAll()
      setSubjects(data)
    } catch { toast.error('Failed to load subjects') }
    finally { setLoadingSubjects(false) }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Manage courses, subject requirements, and subjects</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <TabButton active={activeTab === 'courses'} onClick={() => setActiveTab('courses')}>
          Courses & Requirements
        </TabButton>
        <TabButton active={activeTab === 'subjects'} onClick={() => setActiveTab('subjects')}>
          Subjects
        </TabButton>
      </div>

      {loadingSubjects ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="md" message="Loading..." /></div>
      ) : activeTab === 'courses' ? (
        <CoursesTab subjects={subjects} />
      ) : (
        <SubjectsTab subjects={subjects} onRefresh={fetchSubjects} />
      )}
    </AdminLayout>
  )
}

export default CourseManager