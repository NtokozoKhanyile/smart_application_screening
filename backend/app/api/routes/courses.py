from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.course import Course, CourseSubjectRequirement
from app.db.models.user import User
from app.schemas.courses import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    CourseSubjectRequirementCreate,
    CourseSubjectRequirementUpdate,
)
from app.api.deps import require_admin

router = APIRouter()


@router.post("/", response_model=CourseResponse, dependencies=[Depends(require_admin)])
def create_course(course_in: CourseCreate, db: Session = Depends(get_db)):
    existing = db.query(Course).filter(Course.name == course_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course already exists")

    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@router.patch(
    "/{course_id}", response_model=CourseResponse, dependencies=[Depends(require_admin)]
)
def update_course(
    course_id: int, course_in: CourseUpdate, db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course_in.name is not None:
        existing = (
            db.query(Course)
            .filter(Course.name == course_in.name, Course.id != course_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Course name already Exists")

        course.name = course_in.name

    if course_in.approval_threshold is not None:
        course.approval_threshold = course_in.approval_threshold

    db.commit()
    db.refresh(course)
    return course


@router.post("/{course_id}/requirements")
def add_course_requirement(
    course_id: int,
    requirement_in: CourseSubjectRequirementCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Prevent duplicate subject requirement
    existing = (
        db.query(CourseSubjectRequirement)
        .filter(
            CourseSubjectRequirement.course_id == course_id,
            CourseSubjectRequirement.subject_id == requirement_in.subject_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Requirement already exists for this subject"
        )

    requirement = CourseSubjectRequirement(
        course_id=course_id,
        subject_id=requirement_in.subject_id,
        minimum_mark=requirement_in.minimum_mark,
        weight=requirement_in.weight,
    )

    db.add(requirement)
    db.commit()
    db.refresh(requirement)

    return requirement


@router.patch("/{course_id}/requirements/{requirement_id}")
def update_course_requirement(
    course_id: int,
    requirement_id: int,
    requirement_in: CourseSubjectRequirementUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    requirement = (
        db.query(CourseSubjectRequirement)
        .filter(
            CourseSubjectRequirement.id == requirement_id,
            CourseSubjectRequirement.course_id == course_id,
        )
        .first()
    )

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    if requirement_in.minimum_mark is not None:
        requirement.minimum_mark = requirement_in.minimum_mark

    if requirement_in.weight is not None:
        requirement.weight = requirement_in.weight

    db.commit()
    db.refresh(requirement)

    return requirement


@router.delete(
    "/{course_id}/requirements/{requirement_id}", dependencies=[Depends(require_admin)]
)
def delete_course_requirement(
    course_id: int,
    requirement_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    requirement = (
        db.query(CourseSubjectRequirement)
        .filter(
            CourseSubjectRequirement.id == requirement_id,
            CourseSubjectRequirement.course_id == course_id,
        )
        .first()
    )

    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    db.delete(requirement)
    db.commit()

    return {"detail": "Requirement deleted"}


@router.get(
    "/{course_id}/requirements", response_model=list[CourseSubjectRequirementCreate]
)
def list_course_requirements(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course.subject_requirements


@router.delete("/{course_id}", dependencies=[Depends(require_admin)])
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"detail": "Course deleted successfully"}
