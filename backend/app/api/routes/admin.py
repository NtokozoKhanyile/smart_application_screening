from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import require_admin
from app.db.session import get_db
from app.services import prediction_service, analytics_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", dependencies=[Depends(require_admin)])
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    return prediction_service.get_screening_stats(db)


@router.get("/analytics", dependencies=[Depends(require_admin)])
def get_admin_analytics(
    db: Session = Depends(get_db),
    days: Optional[int] = Query(None, description="Filter data by last N days")
):
    """Returns comprehensive analytics for the admin dashboard."""
    return analytics_service.get_comprehensive_analytics(db, days=days)
