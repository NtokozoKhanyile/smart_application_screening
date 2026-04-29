from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from typing import List, Optional

from app.db.models.application import Application, ApplicationStatus
from app.db.models.application_subject import ApplicationSubject
from app.db.models.prediction import ScreeningResult
from app.schemas.application import ApplicationCreate, ApplicationStatus as ApplicationStatusEnum
from app.services.scoring_engine import evaluate_application


def get_application_by_id(db: Session, application_id: int) -> Optional[Application]:
    return (
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


def get_user_applications(db: Session, user_id: int) -> List[Application]:
    return (
        db.query(Application)
        .options(
            joinedload(Application.course),
            joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
            joinedload(Application.documents),
            joinedload(Application.screening_result),
        )
        .filter(Application.user_id == user_id)
        .all()
    )


def get_all_applications(db: Session, status: Optional[str] = None) -> List[Application]:
    query = db.query(Application).options(
        joinedload(Application.course),
        joinedload(Application.subjects).joinedload(ApplicationSubject.subject),
        joinedload(Application.documents),
        joinedload(Application.screening_result),
    )
    if status:
        query = query.filter(Application.status == status)
    return query.all()


def create_application(db: Session, user_id: int, data: ApplicationCreate) -> Application:
    application_data = data.dict()
    subjects_data = application_data.pop("subjects")

    new_application = Application(
        user_id=user_id,
        status=ApplicationStatus.draft,
        **application_data
    )

    db.add(new_application)
    db.flush()  # Get ID without committing

    for subject in subjects_data:
        app_subject = ApplicationSubject(
            application_id=new_application.id,
            subject_id=subject["subject_id"],
            mark=subject["mark"],
        )
        db.add(app_subject)

    db.commit()
    db.refresh(new_application)
    return new_application


def update_application(
    db: Session, application_id: int, user_id: int, data: ApplicationCreate
) -> Application:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if application.status != ApplicationStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot edit submitted application",
        )

    update_data = data.dict()
    subjects_data = update_data.pop("subjects")

    for key, value in update_data.items():
        setattr(application, key, value)

    # Sync subjects: Remove old, add new
    db.query(ApplicationSubject).filter(
        ApplicationSubject.application_id == application_id
    ).delete()

    for subject in subjects_data:
        app_subject = ApplicationSubject(
            application_id=application_id,
            subject_id=subject["subject_id"],
            mark=subject["mark"],
        )
        db.add(app_subject)

    db.commit()
    db.refresh(application)
    return application


def delete_application(db: Session, application: Application) -> None:
    db.delete(application)
    db.commit()


def submit_application(db: Session, application_id: int, user_id: int) -> Application:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )

    if application.status != ApplicationStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already submitted",
        )

    application.status = ApplicationStatus.submitted
    db.commit()

    # Trigger automated screening
    evaluation = evaluate_application(db, application)

    decision = evaluation["decision"]
    if decision == "rejected":
        application.status = ApplicationStatus.rejected
    elif decision == "recommended":
        application.status = ApplicationStatus.recommended
    else:
        application.status = ApplicationStatus.under_review

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


def get_user_application_stats(db: Session, user_id: int):
    applications = db.query(Application).filter(Application.user_id == user_id).all()
    
    stats = {
        "total": len(applications),
        "draft": 0,
        "submitted": 0,
        "under_review": 0,
        "recommended": 0,
        "accepted": 0,
        "rejected": 0
    }
    
    for app in applications:
        stats[app.status.value] += 1
        
    return stats
