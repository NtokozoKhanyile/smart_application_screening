from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    application_id: int
    filename: str
    file_path: str
    content_type: str | None
    uploaded_at: datetime

    class Config:
        from_attributes = True
