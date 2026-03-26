from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.prediction import ScreeningResult
from app.db.models.application import Application, ApplicationStatus
from app.schemas.prediction import (
    ScreeningResultCreate,
    ScreeningResultOut,
    AdminReviewRequest,
)
from app.db.models.user import User
from app.api.deps import require_admin, get_current_user
from app.services.scoring_engine import evaluate_application

router = APIRouter(prefix="/predictions", tags=["Screening"])


@router.post("/", response_model=ScreeningResultOut)
def create_screening_result(
    result: ScreeningResultCreate,
    db: Session = Depends(get_db),
    admin_user=Depends(require_admin),
):
    existing = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.application_id == result.application_id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Screening already exists for this application"
        )

    screening = ScreeningResult(**result.dict())
    db.add(screening)
    db.commit()
    db.refresh(screening)

    return screening


@router.post(
    "/applications/{application_id}/screen", dependencies=[Depends(require_admin)]
)
def screen_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    application = db.query(Application).filter(Application.id == application_id).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    evaluation = evaluate_application(db, application)
    decision = evaluation["decision"]

    result = ScreeningResult(
        application_id=application.id,
        prediction_score=evaluation["score"],
        decision=decision,
        model_version=evaluation.get("evaluation_version", "rule-engine-v1"),
        explanation=evaluation.get("explanation"),
    )

    # Update application status to match AI decision
    if decision == "rejected":
        application.status = ApplicationStatus.rejected
    elif decision == "recommended":
        application.status = ApplicationStatus.recommended
    else:
        application.status = ApplicationStatus.under_review

    db.add(result)
    db.commit()
    db.refresh(result)

    return {
        "application_id": application.id,
        "prediction_score": result.prediction_score,
        "decision": result.decision,
        "explanation": result.explanation,
    }


@router.patch(
    "/screening-results/{result_id}/review", dependencies=[Depends(require_admin)]
)
def admin_override_screening(
    result_id: int,
    review: AdminReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = db.query(ScreeningResult).filter(ScreeningResult.id == result_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    # Update screening result
    result.reviewed_by_admin = True
    result.final_decision = review.final_decision
    result.admin_notes = review.admin_notes
    result.reviewed_by_admin_id = current_user.id

    # Auto-update the application status to match admin decision
    application = db.query(Application).filter(
        Application.id == result.application_id
    ).first()

    if application:
        if review.final_decision == "accepted":
            application.status = ApplicationStatus.accepted
        elif review.final_decision == "rejected":
            application.status = ApplicationStatus.rejected
        elif review.final_decision == "under_review":
            application.status = ApplicationStatus.under_review

    db.commit()
    db.refresh(result)

    return {
        "message": "Screening decision reviewed by admin",
        "screening_result": result,
    }


@router.get(
    "/applications/{application_id}",
    response_model=ScreeningResultOut,
    dependencies=[Depends(require_admin)],
)
def get_screening_result_for_application(
    application_id: int, db: Session = Depends(get_db)
):
    result = (
        db.query(ScreeningResult)
        .filter(ScreeningResult.application_id == application_id)
        .first()
    )

    if not result:
        raise HTTPException(status_code=404, detail="Screening result not found")

    return result


@router.get("/screening-results", dependencies=[Depends(require_admin)])
def get_all_screening_results(db: Session = Depends(get_db)):
    results = db.query(ScreeningResult).all()
    return results