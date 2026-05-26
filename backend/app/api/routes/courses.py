from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.courses import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    CourseSubjectRequirementCreate,
    CourseSubjectRequirementUpdate,
)
from app.api.deps import require_admin
from app.services import course_service as service

router = APIRouter()


@router.post("/", response_model=CourseResponse, dependencies=[Depends(require_admin)])
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    return service.create_course(db, course_in)


@router.get("/", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return service.get_all_courses(db)


@router.patch(
    "/{course_id}", response_model=CourseResponse, dependencies=[Depends(require_admin)]
)
def update_course(
    course_id: int, course_in: CourseUpdate, db: Session = Depends(get_db)
):
    course = service.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return service.update_course(db, course, course_in)


@router.post("/{course_id}/requirements")
def add_course_requirement(
    course_id: int,
    requirement_in: CourseSubjectRequirementCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    course = service.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return service.add_course_requirement(db, course_id, requirement_in)


@router.patch("/{course_id}/requirements/{requirement_id}")
def update_course_requirement(
    course_id: int,
    requirement_id: int,
    requirement_in: CourseSubjectRequirementUpdate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    requirement = service.get_requirement_by_id(db, requirement_id, course_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return service.update_course_requirement(db, requirement, requirement_in)


@router.delete(
    "/{course_id}/requirements/{requirement_id}", dependencies=[Depends(require_admin)]
)
def delete_course_requirement(
    course_id: int,
    requirement_id: int,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    requirement = service.get_requirement_by_id(db, requirement_id, course_id)
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    service.delete_course_requirement(db, requirement)
    return {"detail": "Requirement deleted"}


@router.get(
    "/{course_id}/requirements", response_model=list[CourseSubjectRequirementCreate]
)
def list_course_requirements(course_id: int, db: Session = Depends(get_db)):
    course = service.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course.subject_requirements


@router.delete("/{course_id}", dependencies=[Depends(require_admin)])
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = service.get_course_by_id(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    service.delete_course(db, course)
    return {"detail": "Course deleted successfully"}
