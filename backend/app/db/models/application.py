import enum
from sqlalchemy import Column, Integer, Enum, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base

class ApplicationStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    screened = "screened"
    accepted = "accepted"
    rejected = "rejected"
    
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    # Ownership
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Personal info
    first_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    surname = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    id_number = Column(String, nullable=False)
    address = Column(String, nullable=False)

    # Guardian info
    guardian_name = Column(String, nullable=False)
    guardian_phone_number = Column(String, nullable=False)
    guardian_email = Column(String, nullable=True)

    # Status and timestamps
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.draft, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship(
        "Document",
        back_populates="application",
        cascade="all, delete-orphan"
    )
    
    screening_results = relationship(
        "ScreeningResult", 
        back_populates="application", 
        cascade="all, delete-orphan"
    )

    course = relationship(
        "Course", back_populates="applications"
        )
    
    subjects = relationship(
        "ApplicationSubject", 
        back_populates="application", 
        cascade="all, delete-orphan"
    )