from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class ApplicationSubject(Base):
    __tablename__ = "application_subjects"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))

    mark = Column(Integer, nullable=False)

    application = relationship("Application", back_populates="subjects")
    subject = relationship("Subject")
