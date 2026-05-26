import re
import time
from fastapi import HTTPException, status, Request
from typing import Dict, Tuple
from app.core.config import settings

# Simple In-Memory store: { "ip": (attempts, last_attempt_time) }
login_attempts: Dict[str, Tuple[int, float]] = {}


def validate_password_strength(password: str) -> None:
    """
    Checks if a password meets the required complexity standards.
    Standard: 8+ chars, Uppercase, Lowercase, Digit, Special Char.
    """
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter",
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter",
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit",
        )

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character",
        )


def rate_limit_auth(request: Request):
    """
    Primitive rate limiter to prevent brute-force attacks.
    Limits to 5 attempts per minute per IP.
    """
    if settings.testing:
        return

    client_ip = request.client.host
    now = time.time()

    if client_ip in login_attempts:
        attempts, last_time = login_attempts[client_ip]

        # Reset if more than 60 seconds have passed
        if now - last_time > 60:
            login_attempts[client_ip] = (1, now)
        else:
            if attempts >= 5:
                # Calculate remaining lockout time
                retry_after = int(60 - (now - last_time))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many login attempts. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )
            login_attempts[client_ip] = (attempts + 1, now)
    else:
        login_attempts[client_ip] = (1, now)
