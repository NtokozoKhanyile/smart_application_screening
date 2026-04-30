# Backend API Documentation

The backend is a **FastAPI** application that handles university application submissions, AI-powered screening, and admin review workflows.

## Architectural Improvements (April 2026)
- **Service Layer Pattern**: All business logic moved from routers to `app/services/`.
- **Standardized Decisions**: Engine now outputs `recommended`, `review`, or `rejected`.
- **Hybrid Properties**: Added server-side name formatting via `Application.full_name`.
- **Improved Security**: Centralized auth logic and standardized error responses.

---

## Quick Start

### Docker (Recommended)
From the project root:
```bash
docker-compose up --build
```

### Manual Installation
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. Configure `.env` with `DATABASE_URL` and `REDIS_URL`.
6. `uvicorn app.main:app --reload`

---

## Core API Endpoints

### Applications
- `POST /applications/` - Create draft.
- `GET /applications/me` - List own applications.
- `GET /applications/stats/me` - Get application summary stats.
- `POST /applications/{id}/submit` - Trigger AI screening.
- `PATCH /applications/{id}/status` - (Admin) Manually set status.

### Admin
- `GET /admin/dashboard` - Global screening statistics.

---

## Testing
Run the suite with environment variables:
```bash
$env:DATABASE_URL='sqlite:///./test.db'; $env:SECRET_KEY='...'; pytest backend/tests
```

**Last updated:** April 2026
