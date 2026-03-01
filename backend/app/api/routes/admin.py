from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import require_admin
from app.db.session import get_db
from app.db.models.prediction import ScreeningResult

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", dependencies=[Depends(require_admin)])
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    total_screened = db.query(func.count(ScreeningResult.id)).scalar()

    # decisions currently returned by scoring engine are "screened" or "rejected"
    ai_approvals = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.decision == "screened")
        .scalar()
    )

    ai_rejections = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.decision == "rejected")
        .scalar()
    )

    admin_overrides = (
        db.query(func.count(ScreeningResult.id))
        .filter(ScreeningResult.reviewed_by_admin == True)
        .scalar()
    )

    avg_score = db.query(func.avg(ScreeningResult.prediction_score)).scalar()

    return {
        "total_screened": total_screened,
        "ai_approvals": ai_approvals,
        "ai_rejections": ai_rejections,
        "admin_overrides": admin_overrides,
        "average_ai_score": round(avg_score or 0, 2),
    }
