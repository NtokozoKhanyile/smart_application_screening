import os
import shutil
from uuid import uuid4
from fastapi import UploadFile, HTTPException, status

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "doc", "docx"}
CHUNK_SIZE = 1024 * 1024  # 1MB

os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_file(file: UploadFile) -> str:
    # ── Extension Validation ──────────────────────────────────────
    filename = file.filename or "unnamed"
    extension = filename.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '.{extension}' is not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # ── Secure Name Generation ────────────────────────────────────
    unique_name = f"{uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # ── Streaming Write (Prevents OOM) ─────────────────────────────
    try:
        with open(file_path, "wb") as buffer:
            while chunk := file.file.read(CHUNK_SIZE):
                buffer.write(chunk)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    return file_path
