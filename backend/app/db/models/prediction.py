from sqlalchemy import Column, Integer, Float, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)

    prediction_score = Column(Float, nullable=False)  # e.g. 0.87
    decision = Column(String, nullable=False)  # "pass" or "fail"
    model_version = Column(String, nullable=False)  # e.g. "v1.0"
    reviewed_by_admin = Column(Boolean, default=False)

    # Admin Override Fields
    final_decision = Column(String, nullable=True)  # accept / reject
    admin_notes = Column(String, nullable=True)
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    application = relationship(
        "Application", back_populates="screening_results", uselist=False
    )
