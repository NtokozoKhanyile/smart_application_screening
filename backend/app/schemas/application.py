from pydantic import BaseModel
from datetime import datetime
from app.db.models.application import ApplicationStatus


# ── Subject Schemas ──────────────────────────────────────────────
class SubjectMark(BaseModel):
    subject_id: int
    mark: int


class SubjectOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ApplicationSubjectOut(BaseModel):
    subject_id: int
    mark: float
    subject: SubjectOut | None = None

    class Config:
        from_attributes = True


# ── Course Schema ────────────────────────────────────────────────
class CourseOut(BaseModel):
    id: int
    name: str
    approval_threshold: float | None = None

    class Config:
        from_attributes = True


# ── Document Schema ──────────────────────────────────────────────
class DocumentOut(BaseModel):
    id: int
    filename: str
    content_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Screening Result Schema ──────────────────────────────────────
class ScreeningResultOut(BaseModel):
    id: int
    prediction_score: float
    decision: str
    model_version: str | None = None
    reviewed_by_admin: bool = False
    final_decision: str | None = None
    admin_notes: str | None = None
    explanation: str | None = None

    class Config:
        from_attributes = True


# ── Application Schemas ──────────────────────────────────────────
class ApplicationCreate(BaseModel):
    first_name: str
    middle_name: str | None = None
    surname: str
    email: str
    phone_number: str
    id_number: str
    address: str
    course_id: int
    subjects: list[SubjectMark]
    guardian_name: str
    guardian_phone_number: str
    guardian_email: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    first_name: str
    middle_name: str | None = None
    surname: str
    email: str
    phone_number: str | None = None
    id_number: str | None = None
    address: str | None = None
    guardian_name: str | None = None
    guardian_phone_number: str | None = None
    guardian_email: str | None = None
    status: ApplicationStatus
    user_id: int
    course_id: int
    course: CourseOut | None = None
    subjects: list[ApplicationSubjectOut] = []
    documents: list[DocumentOut] = []
    screening_result: ScreeningResultOut | None = None
    reason: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus