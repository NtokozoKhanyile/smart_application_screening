# Backend API Documentation

The backend is a **FastAPI** application that handles university application submissions, AI-powered screening, and admin review workflows.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Authentication](#authentication)
- [Running Tests](#running-tests)
- [Development](#development)
- [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL (or SQLite for local development)
- Virtual environment (venv or conda)

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables** (create `.env` file):
   ```env
   DATABASE_URL=postgresql://user:password@localhost/app_screening
   SECRET_KEY=your-secret-key-here-min-32-chars
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Seed initial data** (optional):
   ```bash
   python seed_subjects.py
   ```

7. **Start the server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API will be available at `http://localhost:8000`  
   Interactive docs: `http://localhost:8000/docs`

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app setup & middleware
│   ├── api/
│   │   ├── router.py           # Main API router
│   │   ├── deps.py             # Dependency injection (auth)
│   │   └── routes/
│   │       ├── auth.py         # Login, register, /auth/me
│   │       ├── applications.py # Create, submit, list applications
│   │       ├── predictions.py  # Screening & admin review
│   │       ├── admin.py        # Admin dashboard stats
│   │       ├── courses.py      # Course management
│   │       ├── subjects.py     # Subject management
│   │       └── documents.py    # File uploads
│   ├── db/
│   │   ├── session.py          # Database connection
│   │   ├── base.py             # SQLAlchemy declarative base
│   │   └── models/
│   │       ├── user.py
│   │       ├── application.py
│   │       ├── application_subject.py
│   │       ├── prediction.py   # ScreeningResult model
│   │       ├── course.py
│   │       ├── subject.py
│   │       ├── document.py
│   │       └── ...
│   ├── schemas/                # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── application.py
│   │   ├── prediction.py
│   │   └── ...
│   ├── services/
│   │   ├── scoring_engine.py   # ML scoring logic
│   │   ├── auth.py
│   │   ├── prediction_service.py
│   │   └── storage_service.py  # File handling
│   ├── core/
│   │   ├── config.py           # Settings & environment
│   │   ├── security.py         # JWT & password hashing
│   │   └── dependencies.py
│   ├── ml/
│   │   ├── preprocess.py       # Data preprocessing
│   │   └── train.py            # Model training
│   └── utils/
│       └── helpers.py
├── tests/
│   ├── conftest.py             # Pytest fixtures
│   ├── test_application.py
│   ├── test_predictions.py
│   ├── test_auth.py
│   └── test_scoring_engine.py
├── alembic/                    # Database migrations
├── uploads/                    # User-uploaded documents
├── requirements.txt
├── alembic.ini
└── seed_subjects.py
```

---

## API Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=SecurePass123
```
**Response:** `200 OK`
```json
{"message": "User registered successfully"}
```

#### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=SecurePass123
```
**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {access_token}
```
**Response:** `200 OK`
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "applicant"
}
```

---

### Applications

#### Create Application (Draft)
```http
POST /applications/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "course_id": 1,
  "first_name": "John",
  "middle_name": "A",
  "surname": "Doe",
  "email": "john@example.com",
  "phone_number": "+27123456789",
  "id_number": "0000000000001",
  "address": "123 Main St",
  "guardian_name": "Jane Doe",
  "guardian_phone_number": "+27111111111",
  "guardian_email": "jane@example.com",
  "subjects": [
    {"subject_id": 1, "mark": 85},
    {"subject_id": 2, "mark": 78}
  ]
}
```
**Response:** `201 Created`

#### List My Applications
```http
GET /applications/me
Authorization: Bearer {access_token}
```
**Response:** `200 OK` – Returns array of applications owned by user.

#### Get Application
```http
GET /applications/{application_id}
Authorization: Bearer {access_token}
```

#### Submit Application (Triggers Screening)
```http
POST /applications/{application_id}/submit
Authorization: Bearer {access_token}
```
**Response:** `200 OK`
```json
{
  "id": 1,
  "status": "screened",
  "user_id": 1,
  "course_id": 1,
  "created_at": "2026-02-28T10:30:00",
  ...
}
```

#### Update Application Status (Admin Only)
```http
PATCH /applications/{application_id}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{"status": "accepted"}
```

---

### Predictions (Screening)

#### Screen Application (Admin Only)
```http
POST /predictions/applications/{application_id}/screen
Authorization: Bearer {admin_token}
```
**Response:** `200 OK`
```json
{
  "application_id": 1,
  "prediction_score": 72.5,
  "decision": "screened",
  "explanation": "suggested-approve: Meets approval threshold. Final Score: 72.5"
}
```

#### Get Screening Result
```http
GET /predictions/applications/{application_id}
Authorization: Bearer {admin_token}
```

#### Get All Screening Results (Admin Only)
```http
GET /predictions/screening-results
Authorization: Bearer {admin_token}
```

#### Admin Review Screening (Admin Only)
```http
PATCH /predictions/screening-results/{result_id}/review
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "final_decision": "accept",
  "admin_notes": "Strong candidate with excellent grades"
}
```

---

### Admin Dashboard

#### Get Dashboard Stats (Admin Only)
```http
GET /admin/dashboard
Authorization: Bearer {admin_token}
```
**Response:** `200 OK`
```json
{
  "total_screened": 150,
  "ai_approvals": 95,
  "ai_rejections": 55,
  "admin_overrides": 12,
  "average_ai_score": 68.4
}
```

---

### Documents

#### Upload Document
```http
POST /documents/upload
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

application_id: 1
content_type: latest_academic_results
file: <binary file>
```

Valid `content_type` values:
- `latest_academic_results`
- `id_copy`
- `guardian_id_copy`

---

## Database Models

### User
- `id` (PK)
- `email` (unique)
- `hashed_password`
- `role` (enum: "applicant", "admin")
- `created_at`

### Application
- `id` (PK)
- `user_id` (FK)
- `course_id` (FK)
- `status` (enum: draft, pending, screened, accepted, rejected)
- `first_name`, `middle_name`, `surname`
- `email`, `phone_number`, `id_number`, `address`
- `guardian_name`, `guardian_phone_number`, `guardian_email`
- `created_at`

### ApplicationSubject
- `id` (PK)
- `application_id` (FK)
- `subject_id` (FK)
- `mark` (float)

### ScreeningResult
- `id` (PK)
- `application_id` (FK, unique)
- `prediction_score` (float)
- `decision` (enum: screened, rejected, review)
- `model_version`
- `reviewed_by_admin` (bool)
- `final_decision` (string: accept, reject)
- `admin_notes` (text)
- `reviewed_by_admin_id` (FK)

### Course
- `id` (PK)
- `name`
- `approval_threshold` (int)
- Subject requirements (many-to-many via CourseSubjectRequirement)

### Subject
- `id` (PK)
- `name` (unique)

### Document
- `id` (PK)
- `application_id` (FK)
- `filename`
- `file_path`
- `content_type`
- `uploaded_at`

---

## Authentication

The API uses **JWT (JSON Web Tokens)** for stateless authentication.

- **Token expiry:** Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 1440 minutes = 24 hours)
- **Algorithm:** HS256 (HMAC SHA-256)
- **Secret key:** Set via `SECRET_KEY` environment variable (minimum 32 characters)

All protected endpoints require the header:
```
Authorization: Bearer {access_token}
```

**Role-based access:**
- `applicant`: Can create/submit applications, upload documents, view own data
- `admin`: Can review screening results, override decisions, view all applications, access dashboard

---

## Running Tests

### Run all tests:
```bash
pytest
```

### Run specific test file:
```bash
pytest tests/test_application.py -v
```

### Run specific test:
```bash
pytest tests/test_application.py::test_create_application -v
```

### Test coverage:
```bash
pytest --cov=app --cov-report=html
```

**Test files:**
- `test_auth.py` – Authentication endpoints
- `test_application.py` – Application CRUD and submission
- `test_predictions.py` – Screening and admin review
- `test_scoring_engine.py` – AI scoring logic

---

## Development

### Database Migrations

When you modify database models, create a migration:

```bash
alembic revision --autogenerate -m "descriptive message"
```

Review the generated migration in `alembic/versions/`, then apply it:

```bash
alembic upgrade head
```

To rollback:

```bash
alembic downgrade -1
```

### Adding New Features

1. **Create database model** in `app/db/models/`
2. **Create Pydantic schema** in `app/schemas/`
3. **Create route handler** in `app/api/routes/`
4. **Generate migration** and test locally
5. **Write tests** in `tests/`
6. **Update this README** with new endpoint docs

### Linting & Formatting (Optional)

```bash
pip install black flake8
black app/
flake8 app/ --max-line-length=100
```

---

## Deployment

### Environment Variables for Production

```env
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db-host/app_db
SECRET_KEY=your-very-secure-random-32-character-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Docker

A `Dockerfile.txt` is included for containerized deployment:

```bash
docker build -t app-screening-backend .
docker run -p 8000:8000 --env-file .env app-screening-backend
```

### Running in Production

Use a production-grade ASGI server:

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### CORS Configuration

Default CORS allows `*` origins (suitable for development). For production, restrict to specific frontend domain in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Handling

All errors follow a standard format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common status codes:**
- `200` – Success
- `201` – Created
- `400` – Bad request (invalid data)
- `401` – Unauthorized (missing/invalid token)
- `403` – Forbidden (insufficient permissions)
- `404` – Not found
- `409` – Conflict (duplicate entry)
- `422` – Validation error
- `500` – Server error

---

## Support & Contributing

For issues or contributions:
1. Create an issue describing the problem
2. Fork and create a feature branch
3. Submit a pull request with tests

---

**Last updated:** February 2026
