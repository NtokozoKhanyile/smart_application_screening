from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import require_admin
from app.schemas.subject import SubjectOut, SubjectCreate
from app.services import subject_service as service

router = APIRouter()


@router.get("/")
def list_subjects(db: Session = Depends(get_db)):
    return service.get_all_subjects(db)


@router.post("/", response_model=SubjectOut)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    return service.create_subject(db, subject_in)


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    subject = service.get_subject_by_id(db, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    service.delete_subject(db, subject)
    return {"detail": "Subject deleted successfully"}
