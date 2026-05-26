from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.models.prediction import ScreeningResult


def get_screening_stats(db: Session):
    total_screened = db.query(func.count(ScreeningResult.id)).scalar()

    # Decisions standardized in scoring_engine: "recommended", "review", "rejected"
    # Note: admin.py previously looked for "screened" which was a bug
    recommended = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.decision == "recommended")
        .scalar()
    )

    rejections = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.decision == "rejected")
        .scalar()
    )

    under_review = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.decision == "review")
        .scalar()
    )

    admin_overrides = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.reviewed_by_admin)
        .scalar()
    )

    avg_score = db.query(func.avg(ScreeningResult.prediction_score)).scalar()

    return {
        "total_screened": total_screened,
        "recommended": recommended,
        "rejections": rejections,
        "under_review": under_review,
        "admin_overrides": admin_overrides,
        "average_ai_score": round(avg_score or 0, 2),
    }
