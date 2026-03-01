from pydantic import BaseModel
from typing import Optional


class CourseBase(BaseModel):
    name: str
    approval_threshold: float


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CourseBase):
    name: Optional[str] = None
    approval_threshold: Optional[float] = None


class CourseResponse(CourseBase):
    id: int

    class Config:
        from_attributes = True


class CourseSubjectRequirementCreate(BaseModel):
    subject_id: int
    minimum_mark: float
    weight: float


class CourseSubjectRequirementUpdate(BaseModel):
    minimum_mark: Optional[float] = None
    weight: Optional[float] = None
