import os
from uuid import uuid4
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file(file: UploadFile) -> str:
    extension = file.filename.split(".")[-1]
    unique_name = f"{uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return file_path
