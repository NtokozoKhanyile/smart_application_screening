from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    approval_threshold = Column(Float, nullable=False)

    subject_requirements = relationship(
        "CourseSubjectRequirement",
        back_populates="course",
        cascade="all, delete"
    )

    applications = relationship(
        "Application", back_populates="course"
    )



class CourseSubjectRequirement(Base):
    __tablename__ = "course_subject_requirements"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    minimum_mark = Column(Float, default=0)
    weight = Column(Float, nullable=False)

    #prevent duplicate subject per course
    __table_args__ = (
        UniqueConstraint('course_id', 'subject_id', name='uix_course_subject'),
    )

    course = relationship(
        "Course", back_populates="subject_requirements"
    )
    subject = relationship(
        "Subject"
    )
    

