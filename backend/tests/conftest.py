from httpx import Client
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.db.models import User
from app.core.config import settings
from app.core.security import create_access_token
from passlib.context import CryptContext
import tempfile
import os

from app.main import app
from app.db.base import Base
from app.db.session import get_db

# Use a temporary file-based SQLite DB for tests so multiple connections
# (TestClient + SQLAlchemy sessions) see the same database.
_fd, _DB_PATH = tempfile.mkstemp(suffix=".db")
os.close(_fd)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Ensure all model modules are imported so `Base.metadata` includes
    # the `applications` table and others before creating tables.
    import app.db.models  # noqa: F401

    # Create the database tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)
    # Remove temporary DB file
    try:
        os.remove(_DB_PATH)
    except OSError:
        pass

@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency to use the testing database
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

# JWT Test Fixture
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@pytest.fixture(scope="function")
def auth_headers(client, db):
    # Create a test user
    user = User(
        email="test@example.com",
        hashed_password=pwd_context.hash("Password123"),
        role="applicant"
    )
    db.add(user)
    db.commit()
    
    # Login through the real endpoint to get a valid token
    response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "Password123"
    }
    )

    assert response.status_code == 200, "Login failed in auth_headers fixture"

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def admin_headers(client, db):
    # Create an admin user
    admin_user = User(
        email="admin@example.com",
        hashed_password=pwd_context.hash("AdminPass123"),
        role="admin"
    )
    db.add(admin_user)
    db.commit()

    # Login through the real endpoint to get a valid token
    response = client.post("/auth/login", data={
        "username": "admin@example.com",
        "password": "AdminPass123"
    })
    assert response.status_code == 200, "Admin login failed in admin_headers fixture"

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}