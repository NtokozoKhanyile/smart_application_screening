from sqlalchemy.orm import Session
from app.db.models.document import Document

def create_document(
    db: Session,
    application_id: int,
    filename: str,
    file_path: str,
    content_type: str,
) -> Document:
    document = Document(
        application_id=application_id,
        filename=filename,
        file_path=file_path,
        content_type=content_type,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
