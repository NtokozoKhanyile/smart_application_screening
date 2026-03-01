import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import uuid4

from app.api import deps
from app.db.models.application import Application
from app.db.models.document import Document
from app.schemas.document import DocumentResponse

router = APIRouter()

UPLOAD_FOLDER = "uploads"


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

    # Create uploads directory if it doesn't exist
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    # Generate a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)

    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Create a new Document record in the database
    document = Document(
        application_id=application_id,
        filename=file.filename,
        file_path=file_path,
        content_type=file.content_type,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    return document
