import os
from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    database_url: str
    redis_url: Optional[str] = "redis://localhost:6379/0"
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    frontend_url: str
    testing: bool = False
    evaluation_version: str = "rules_v1.0.2"

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_long(cls, v: str) -> str:
        if len(v) < 32 and not os.getenv("DOTENV_PATH") == ".env.test":
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    # Optional SMTP configuration
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None

    class Config:
        env_file = os.getenv("DOTENV_PATH", ".env")
        case_sensitive = False  # allows DATABASE_URL → database_url


settings = Settings()
