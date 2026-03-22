export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const APP_NAME = 'Lumina'
export const APP_TAGLINE = 'AI-Powered Admissions Screening'

export const ROLES = {
  APPLICANT: 'applicant',
  ADMIN: 'admin',
}

export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  RECOMMENDED: 'recommended',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
}

export const SCREENING_DECISION = {
  RECOMMENDED: 'recommended',
  REJECTED: 'rejected',
  REVIEW: 'review',
}

export const FINAL_DECISION = {
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  UNDER_REVIEW: 'under_review',
}

export const DOCUMENT_TYPES = {
  ACADEMIC_RESULTS: 'latest_academic_results',
  ID_COPY: 'id_copy',
  GUARDIAN_ID: 'guardian_id_copy',
}

export const DOCUMENT_TYPE_LABELS = {
  latest_academic_results: 'Latest Academic Results',
  id_copy: 'ID Copy',
  guardian_id_copy: 'Guardian ID Copy',
}

export const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  recommended: 'Recommended',
  accepted: 'Accepted',
  rejected: 'Rejected',
}

export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Applicant
  STUDENT_DASHBOARD: '/dashboard',
  APPLICATION_FORM: '/applications/new',
  APPLICATION_EDIT: '/applications/:id/edit',
  APPLICATION_DETAIL: '/applications/:id',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_SCREENING: '/admin/screening',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_COURSES: '/admin/courses',
}