from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.application import Application
from app.schemas.document import DocumentResponse
from app.services import storage_service, document_service

router = APIRouter()


@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    application_id: int = Form(...),
    content_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    # Validate document type
    allowed_types = ["latest_academic_results", "id_copy", "guardian_id_copy"]
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid document type")

    # Check if the application exists and belongs to the current user
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id, Application.user_id == current_user.id
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Save the file using the hardened storage service
    file_path = storage_service.save_file(file)

    # Create the database record
    return document_service.create_document(
        db=db,
        application_id=application_id,
        filename=file.filename or "unnamed",
        file_path=file_path,
        content_type=content_type,
    )
