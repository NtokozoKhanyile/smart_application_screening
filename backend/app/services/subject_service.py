from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models.subject import Subject
from app.schemas.subject import SubjectCreate

def get_all_subjects(db: Session):
    return db.query(Subject).all()

def get_subject_by_id(db: Session, subject_id: int):
    return db.query(Subject).filter(Subject.id == subject_id).first()

def create_subject(db: Session, subject_in: SubjectCreate) -> Subject:
    existing = db.query(Subject).filter(Subject.name == subject_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject with this name already exists")
    
    subject = Subject(name=subject_in.name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

def delete_subject(db: Session, subject: Subject) -> None:
    db.delete(subject)
    db.commit()
