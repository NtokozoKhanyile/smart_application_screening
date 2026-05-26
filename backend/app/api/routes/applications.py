from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import (
    get_current_user,
    require_application_owner_or_admin,
    require_role,
    require_admin,
)
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.application import Application
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse as ApplicationOut,
    ApplicationStatusUpdate,
)
from app.services import application_service as service

router = APIRouter()


@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    application_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_application(db, current_user.id, application_in)


@router.put("/{application_id}/edit", response_model=ApplicationOut)
def update_application(
    application_id: int,
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_application(
        db, application_id, current_user.id, application_data
    )


@router.post("/{application_id}/submit", response_model=ApplicationOut)
def submit_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.submit_application(db, application_id, current_user.id)


@router.get("/all", response_model=List[ApplicationOut])
def get_all_applications(
    db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin"))
):
    return service.get_all_applications(db)


@router.get("/pending", response_model=List[ApplicationOut])
def get_pending_applications(
    db: Session = Depends(get_db), admin_user: User = Depends(require_role("admin"))
):
    return service.get_all_applications(db, status="under_review")


@router.get("/me", response_model=List[ApplicationOut])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_user_applications(db, current_user.id)


@router.get("/stats/me")
def get_my_application_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return service.get_user_application_stats(db, current_user.id)


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = service.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role != "admin" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return application


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    application = service.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    return service.update_application_status(
        db, application, status_update.status, admin_user.id
    )


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    application: Application = Depends(require_application_owner_or_admin),
    db: Session = Depends(get_db),
):
    service.delete_application(db, application)
    return {"message": "Application deleted successfully"}
