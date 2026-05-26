from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from app.db.models.application import ApplicationStatus


# ── Subject Schemas ──────────────────────────────────────────────
class SubjectMark(BaseModel):
    subject_id: int
    mark: int = Field(..., ge=0, le=100)


class SubjectOut(BaseModel):
    id: int
    name: str = Field(..., min_length=1, max_length=100)

    class Config:
        from_attributes = True


class ApplicationSubjectOut(BaseModel):
    subject_id: int
    mark: float = Field(..., ge=0, le=100)
    subject: SubjectOut | None = None

    class Config:
        from_attributes = True


# ── Course Schema ────────────────────────────────────────────────
class CourseOut(BaseModel):
    id: int
    name: str = Field(..., min_length=1, max_length=200)
    approval_threshold: float | None = Field(None, ge=0, le=100)

    class Config:
        from_attributes = True


# ── Document Schema ──────────────────────────────────────────────
class DocumentOut(BaseModel):
    id: int
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., min_length=1, max_length=100)
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Screening Result Schema ──────────────────────────────────────
class ScreeningResultOut(BaseModel):
    id: int
    prediction_score: float = Field(..., ge=0, le=100)
    decision: str = Field(..., min_length=1, max_length=50)
    model_version: str | None = Field(None, max_length=50)
    reviewed_by_admin: bool = False
    final_decision: str | None = Field(None, max_length=50)
    admin_notes: str | None = None
    explanation: str | None = None

    class Config:
        from_attributes = True


# ── Application Schemas ──────────────────────────────────────────
class ApplicationCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    middle_name: str | None = Field(None, max_length=100)
    surname: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone_number: str = Field(..., min_length=1, max_length=20)
    id_number: str = Field(..., min_length=1, max_length=50)
    address: str = Field(..., min_length=1, max_length=500)
    course_id: int
    subjects: list[SubjectMark]
    guardian_name: str = Field(..., min_length=1, max_length=200)
    guardian_phone_number: str = Field(..., min_length=1, max_length=20)
    guardian_email: EmailStr | None = None


class ApplicationResponse(BaseModel):
    id: int
    first_name: str
    middle_name: str | None = None
    surname: str
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    id_number: str | None = None
    address: str | None = None
    guardian_name: str | None = None
    guardian_phone_number: str | None = None
    guardian_email: EmailStr | None = None
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
