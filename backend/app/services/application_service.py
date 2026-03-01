from sqlalchemy.orm import Session
from app.db.models.application import Application
from app.schemas.application import ApplicationCreate


def create_application(db: Session, data: ApplicationCreate):
    application = Application(
        candidate_name=data.candidate_name,
        email=data.email,
        resume_text=data.resume_text
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def get_applications(db: Session):
    return db.query(Application).all()
