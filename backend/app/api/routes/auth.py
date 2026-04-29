from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.services import auth as auth_service
from app.schemas.user import UserResponse  # Assuming this exists or should be used

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(email: str, password: str, db: Session = Depends(get_db)):
    auth_service.register_user(db, email, password)
    return {"message": "User registered successfully"}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    return auth_service.authenticate_user(db, form_data.username, form_data.password)


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    """Endpoint for returning basic info about the logged‑in user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }
