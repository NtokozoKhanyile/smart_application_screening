from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.services import prediction_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", dependencies=[Depends(require_admin)])
def get_admin_dashboard_stats(db: Session = Depends(get_db)):
    return prediction_service.get_screening_stats(db)
