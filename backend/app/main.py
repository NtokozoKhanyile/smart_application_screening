from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base
from app.api.router import api_router
from app.api.routes import applications
from app.api.routes import predictions


app = FastAPI(
    title="AI Application Screening API",
    version="1.0.0",
    description="Backend API for AI-powered application screening"
)

# CORS configuration – allow frontend origins to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables (DEV only – disable when using Alembic migrations)
# NOTE: Avoid creating tables at import time so test suites can control
# the database lifecycle (pytest uses an in-memory DB). If you need
# to create tables for local development, run this file as a script.
if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)

# Register API routes
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "API is running"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

app.include_router(
    predictions.router, 
    tags=["Screening"])
