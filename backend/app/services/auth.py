from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.utils.security_helpers import validate_password_strength

# A static dummy hash for timing attack mitigation
DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s5WrTHotdZSCy"


def register_user(db: Session, email: str, password: str) -> User:
    # 1. Validate password complexity first
    validate_password_strength(password)

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=email,
        hashed_password=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    # MITIGATION: Always run verify_password to prevent timing attacks
    # If user doesn't exist, we compare against a dummy hash
    is_valid = False
    if user:
        is_valid = verify_password(password, user.hashed_password)
    else:
        # Still spend the CPU cycles on a dummy check
        verify_password(password, DUMMY_HASH)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }
