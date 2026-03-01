from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.db.session import get_db
from app.db.models.subject import Subject
from app.db.models.user import User
from app.api.deps import require_admin
from app.schemas.subject import SubjectOut, SubjectCreate

router = APIRouter()


@router.get("/")
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()


@router.post("/", response_model=SubjectOut)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    existing_subject = db.query(Subject).filter(Subject.name == subject_in.name).first()
    if existing_subject:
        raise HTTPException(
            status_code=400, detail="Subject with this name already exists"
        )
    subject = Subject(name=subject_in.name)

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return {"detail": "Subject deleted successfully"}
