from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

from app.api.deps import (
    get_current_user,
    require_application_owner_or_admin,
    require_role,
    require_admin,
)
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.application import Application
from app.db.models.application_subject import ApplicationSubject
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse as ApplicationOut,
    ApplicationStatusUpdate,
    ApplicationStatus,
)
from app.db.models.prediction import ScreeningResult
from app.services.scoring_engine import evaluate_application

router = APIRouter()


@router.post("/", response_model=ApplicationOut)
def create_application(
    application_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application_data = application_in.dict()
    subjects = application_data.pop("subjects")

    new_application = Application(
        user_id=current_user.id, status=ApplicationStatus.draft, **application_data
    )

    db.add(new_application)
    db.flush()  # Get new_application.id before commit

    for subject in subjects:
        app_subject = ApplicationSubject(
            application_id=new_application.id,
            subject_id=subject["subject_id"],
            mark=subject["mark"],
        )
        db.add(app_subject)

    db.commit()
    db.refresh(new_application)

    return new_application


@router.put("/{application_id}/edit", response_model=ApplicationOut)
def update_application(
    application_id: int,
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id, Application.user_id == current_user.id
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot edit submitted application")

    # Update flat fields only — subjects are handled separately
    data = application_data.dict()
    subjects = data.pop("subjects")

    for key, value in data.items():
        setattr(application, key, value)

    # Replace subjects: delete existing rows then insert new ones
    db.query(ApplicationSubject).filter(
        ApplicationSubject.application_id == application_id
    ).delete()

    for subject in subjects:
        app_subject = ApplicationSubject(
            application_id=application_id,
            subject_id=subject["subject_id"],
            mark=subject["mark"],
        )
        db.add(app_subject)

    db.commit()
    db.refresh(application)

    return application


@router.post("/{application_id}/submit", response_model=ApplicationOut)
def submit_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id, Application.user_id == current_user.id
        )
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application.status != "draft":
        raise HTTPException(status_code=400, detail="Application already submitted")

    # Set status to submitted immediately
    application.status = ApplicationStatus.submitted
    db.commit()

    # Run scoring engine
    evaluation = evaluate_application(db, application)

    # Map AI decision to application status
    decision = evaluation["decision"]
    if decision == "rejected":
        application.status = ApplicationStatus.rejected
    elif decision == "recommended":
        application.status = ApplicationStatus.recommended
    else:  # "review"
        application.status = ApplicationStatus.under_review

    # Create a ScreeningResult record
    screening = ScreeningResult(
        application_id=application.id,
        prediction_score=evaluation["score"],
        decision=decision,
        model_version=evaluation.get("evaluation_version", "rule-engine-v1"),
        explanation=evaluation.get("explanation"),
    )
    db.add(screening)
    db.commit()
    db.refresh(application)

    return application


@router.get("/all", dependencies=[Depends(require_role("admin"))])
def get_all_applications(db: Session = Depends(get_db)):
    return (
        db.query(Application)
        .options(
            joinedload(Application.course),
            joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
            joinedload(Application.documents),
            joinedload(Application.screening_result),
        )
        .all()
    )


@router.get("/pending", dependencies=[Depends(require_role("admin"))])
def get_pending_applications(db: Session = Depends(get_db)):
    return (
        db.query(Application)
        .options(
            joinedload(Application.course),
            joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
            joinedload(Application.documents),
            joinedload(Application.screening_result),
        )
        .filter(Application.status == "pending")
        .all()
    )


@router.get("/me")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    applications = (
        db.query(Application)
        .options(
            joinedload(Application.course),
            joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
            joinedload(Application.documents),
            joinedload(Application.screening_result),
        )
        .filter(Application.user_id == current_user.id)
        .all()
    )
    return applications


@router.get("/{application_id}")
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .options(
            joinedload(Application.course),
            joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
            joinedload(Application.documents),
            joinedload(Application.screening_result),
        )
        .filter(Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if current_user.role != "admin" and application.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return application


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationOut,
)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
):
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    application.status = status_update.status

    screening = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.application_id == application.id)
        .first()
    )

    if screening:
        screening.reviewed_by_admin = True
        screening.final_decision = status_update.status
        screening.reviewed_by_admin_id = admin_user.id
        screening.admin_notes = (
            f"Status changed via /status patch by admin {admin_user.email}"
        )

    db.commit()
    db.refresh(application)

    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    application: Application = Depends(require_application_owner_or_admin),
    db: Session = Depends(get_db),
):
    db.delete(application)
    db.commit()

    return {"message": "Application deleted successfully"}