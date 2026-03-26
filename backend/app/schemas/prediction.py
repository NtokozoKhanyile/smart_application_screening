from pydantic import BaseModel, validator
from typing import Optional, Literal

DecisionType = Literal["screened", "rejected", "review"]


class ScreeningResultCreate(BaseModel):
    application_id: int
    prediction_score: float
    decision: DecisionType
    model_version: str

    @validator("decision")
    def check_decision(cls, v):
        if v not in ("screened", "rejected", "review"):
            raise ValueError("decision must be 'screened', 'rejected' or 'review'")
        return v


class ScreeningResultOut(BaseModel):
    id: int
    application_id: int
    prediction_score: float
    decision: str
    model_version: str
    reviewed_by_admin: bool
    explanation: Optional[str] = None
    final_decision: Optional[str] = None
    admin_notes: Optional[str] = None

    class Config:
        from_attributes = True


class AdminReviewRequest(BaseModel):
    final_decision: Literal["accept", "reject", "pending"]
    admin_notes: Optional[str] = None


class ScreeningResultResponse(BaseModel):
    id: int
    application_id: int
    prediction_score: float
    decision: str
    model_version: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True