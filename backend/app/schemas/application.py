from pydantic import BaseModel
from datetime import datetime
from app.db.models.application import ApplicationStatus


class SubjectMark(BaseModel):
    subject_id: int
    mark: int


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
    status: str
    user_id: int
    course_id: int
    status: ApplicationStatus
    reason: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus
