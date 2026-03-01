from fastapi import APIRouter
from app.api.routes import auth, applications, predictions, admin, courses, subjects, documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(applications.router, prefix="/applications", tags=["applications"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(predictions.router)
api_router.include_router(admin.router)
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])