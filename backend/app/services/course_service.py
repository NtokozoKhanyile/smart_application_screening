from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models.course import Course, CourseSubjectRequirement
from app.schemas.courses import CourseCreate, CourseUpdate, CourseSubjectRequirementCreate, CourseSubjectRequirementUpdate

def get_all_courses(db: Session):
    return db.query(Course).all()

def get_course_by_id(db: Session, course_id: int):
    return db.query(Course).filter(Course.id == course_id).first()

def create_course(db: Session, course_in: CourseCreate) -> Course:
    existing = db.query(Course).filter(Course.name == course_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course already exists")
    
    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

def update_course(db: Session, course: Course, course_in: CourseUpdate) -> Course:
    if course_in.name is not None:
        existing = db.query(Course).filter(Course.name == course_in.name, Course.id != course.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Course name already exists")
        course.name = course_in.name
    
    if course_in.approval_threshold is not None:
        course.approval_threshold = course_in.approval_threshold
        
    db.commit()
    db.refresh(course)
    return course

def delete_course(db: Session, course: Course) -> None:
    db.delete(course)
    db.commit()

# ── Requirements ──────────────────────────────────────────────

def get_requirement_by_id(db: Session, requirement_id: int, course_id: int):
    return db.query(CourseSubjectRequirement).filter(
        CourseSubjectRequirement.id == requirement_id,
        CourseSubjectRequirement.course_id == course_id
    ).first()

def add_course_requirement(db: Session, course_id: int, requirement_in: CourseSubjectRequirementCreate):
    existing = db.query(CourseSubjectRequirement).filter(
        CourseSubjectRequirement.course_id == course_id,
        CourseSubjectRequirement.subject_id == requirement_in.subject_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Requirement already exists for this subject")
    
    requirement = CourseSubjectRequirement(
        course_id=course_id,
        subject_id=requirement_in.subject_id,
        minimum_mark=requirement_in.minimum_mark,
        weight=requirement_in.weight
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement

def update_course_requirement(db: Session, requirement: CourseSubjectRequirement, requirement_in: CourseSubjectRequirementUpdate):
    if requirement_in.minimum_mark is not None:
        requirement.minimum_mark = requirement_in.minimum_mark
    if requirement_in.weight is not None:
        requirement.weight = requirement_in.weight
        
    db.commit()
    db.refresh(requirement)
    return requirement

def delete_course_requirement(db: Session, requirement: CourseSubjectRequirement):
    db.delete(requirement)
    db.commit()
