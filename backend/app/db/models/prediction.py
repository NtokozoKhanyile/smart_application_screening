from sqlalchemy import Column, Integer, Float, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)

    prediction_score = Column(Float, nullable=False)
    decision = Column(String, nullable=False)
    model_version = Column(String, nullable=False)
    reviewed_by_admin = Column(Boolean, default=False)
    explanation = Column(Text, nullable=True)  # AI explanation / rejection reason

    # Admin Override Fields
    final_decision = Column(String, nullable=True)  # accept / reject
    admin_notes = Column(String, nullable=True)
    reviewed_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    application = relationship(
        "Application", back_populates="screening_result", uselist=False
    )