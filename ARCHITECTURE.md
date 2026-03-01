# Architecture Overview

This document describes the high-level architecture and design decisions of the AI Application Screening Platform.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React SPA)                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐   │
│  │ Auth Pages   │  │ Student Pages  │  │ Admin Dashboard      │   │
│  └──────────────┘  └────────────────┘  └──────────────────────┘   │
│                                                                     │
│  └─────────────────── API Client / Axios ───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                               ↓ HTTP/REST
                    ┌──────────────────────┐
                    │   API Gateway /      │
                    │   CORS Middleware    │
                    └──────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Backend (FastAPI)                            │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ API Routes Layer                                           │   │
│  │ ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐   │   │
│  │ │Auth      │ │Application │ │Prediction │ │Admin     │   │   │
│  │ └──────────┘ └────────────┘ └───────────┘ └──────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Business Logic / Services Layer                            │   │
│  │ ┌──────────────────────┐  ┌────────────────────────────┐  │   │
│  │ │Scoring Engine        │  │Auth Service, Storage, etc. │  │   │
│  │ │• Rule evaluation     │  │                            │  │   │
│  │ │• Weighted scoring    │  │                            │  │   │
│  │ │• Threshold checks    │  │                            │  │   │
│  │ └──────────────────────┘  └────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                          ↓                                         │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Data Access Layer (SQLAlchemy ORM)                        │   │
│  │ ┌──────────────────────────────────────────────────────┐  │   │
│  │ │Models: User, Application, ScreeningResult, Course, │  │   │
│  │ │        Subject, Document, etc.                      │  │   │
│  │ └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │    PostgreSQL DB     │
                    │                      │
                    │ • User accounts      │
                    │ • Applications       │
                    │ • Screening results  │
                    │ • Audit logs         │
                    └──────────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │   File Storage       │
                    │   (uploads/ dir)     │
                    └──────────────────────┘
```

---

## Key Components

### 1. Frontend (React)

**Responsibilities:**
- User authentication UI (login, register)
- Application form builder
- Application submission workflow
- Admin dashboard for review and stats
- Document upload interface

**Technology:** React, Axios HTTP client, JWT token storage

**Key modules:**
- `components/` – Reusable UI components
- `pages/` – Page-level containers
- `services/api.js` – HTTP client for backend API

---

### 2. Backend (FastAPI)

#### API Layer (`app/api/routes/`)

Handles HTTP requests and responses. Each route file corresponds to a feature:

```
auth.py           → User registration, login, profile
applications.py   → CRUD for applications, submission workflow
predictions.py    → Screening execution, admin review
admin.py         → Dashboard statistics
courses.py       → Course management
subjects.py      → Subject management
documents.py     → File upload handling
```

**Request flow:**
1. Request arrives at route handler
2. Dependencies injected (DB session, current user auth)
3. Request validated by Pydantic schemas
4. Handler calls services to process business logic
5. Response model serialized and returned

**Example:**
```python
@router.post("/{application_id}/submit")
def submit_application(
    application_id: int,
    db: Session = Depends(get_db),              # Injected DB session
    current_user: User = Depends(get_current_user)  # Injected auth
):
    # Route handler authenticates user and validates application
    # Calls scoring_engine service
    # Updates database through ORM
    # Returns response
```

#### Services Layer (`app/services/`)

Contains business logic and is reusable across routes.

**Key services:**

| Service | Responsibility |
|---------|---|
| `scoring_engine.py` | AI evaluation logic, threshold checking, decision routing |
| `auth.py` | JWT creation, password hashing |
| `prediction_service.py` | Screening result management |
| `storage_service.py` | File upload and retrieval |

**Scoring Engine Logic:**
```python
evaluate_application(db, application) → {
    decision: "screened" | "rejected" | "review",
    score: float,
    explanation: string,
    evaluation_version: string
}
```

Process:
1. Fetch course requirements
2. Extract subject marks from application
3. Check minimum mark requirements
4. Calculate weighted score
5. Evaluate against approval threshold
6. Return decision with explanation

#### Data Access Layer (`app/db/`)

**Models** define database schema:
- `User` – Applicants and admins
- `Application` – Submission data
- `ApplicationSubject` – Join table for grades
- `ScreeningResult` – AI decision and admin review
- `Course` – Program configuration
- `Subject` – Academic subjects
- `Document` – Uploaded files

**Relationships:**
```
User ──► Application ──► ScreeningResult
           │                    │
           ├──► ApplicationSubject
           │          │
           └─────────► Subject
           
           ├──► Document
           │
           └──► Course ──► CourseSubjectRequirement ──► Subject
```

**Session Management:**
- Connection pooling via SQLAlchemy
- Dependency injection for request-scoped sessions
- Transaction management (commit/rollback)

---

## Data Flow: Application Submission

```
1. Student fills out form
   ├─ Personal info
   ├─ Guardian info
   └─ Subject grades

2. POST /applications/ (create draft)
   ├─ Validate input (Pydantic schema)
   ├─ Create Application record (status=draft)
   ├─ Create ApplicationSubject entries
   └─ Return application ID

3. Upload documents (optional)
   ├─ POST /documents/upload
   ├─ Validate file type
   ├─ Store file
   └─ Create Document record

4. POST /applications/{id}/submit
   ├─ Verify ownership & status
   ├─ Call evaluate_application() service
   │  ├─ Fetch Course & requirements
   │  ├─ Extract subject marks
   │  ├─ Check minimum requirements
   │  ├─ Calculate weighted score
   │  └─ Return: {decision, score, explanation}
   ├─ Create ScreeningResult record
   ├─ Update Application status
   └─ Return updated application

5. Student sees result (screened/rejected/pending)

6. If status = pending, admin reviews
   ├─ PATCH /predictions/screening-results/{id}/review
   ├─ Admin can accept or reject
   ├─ Update ScreeningResult.final_decision
   └─ Update Application.status
```

---

## Authentication & Authorization

```
Registration
    ↓
POST /auth/register
    ├─ Validate email format
    ├─ Check email not taken
    ├─ Hash password (bcrypt)
    ├─ Create User record (role=applicant)
    └─ Return success

Login
    ↓
POST /auth/login (email, password)
    ├─ Fetch user by email
    ├─ Verify password hash
    ├─ Create JWT token
    │  └─ Payload: {sub: user_id, role: user_role}
    └─ Return token (valid 24 hours by default)

Protected Request
    ↓
GET /applications/me
    ├─ Extract token from Authorization header
    ├─ Verify signature (HS256 + SECRET_KEY)
    ├─ Decode claims
    ├─ Fetch user by ID
    └─ Inject user into route handler

Authorization Check
    ├─ Admin routes check: user.role == "admin"
    └─ Resource ownership verified per route
```

**Key security features:**
- Passwords hashed with bcrypt (never stored plaintext)
- JWT tokens signed with server secret
- Tokens expire after 24 hours (configurable)
- Role-based access control (RBAC)
- CORS configured to prevent XSS

---

## Database Schema

### Users Table
```sql
users (id, email UNIQUE, hashed_password, role, created_at)
```

### Applications Table
```sql
applications (
    id,
    user_id FK→users,
    course_id FK→courses,
    first_name, middle_name, surname,
    email, phone_number, id_number, address,
    guardian_name, guardian_phone_number, guardian_email,
    status ENUM(draft, pending, screened, accepted, rejected),
    created_at
)
```

### ScreeningResults Table
```sql
screening_results (
    id,
    application_id FK→applications UNIQUE,
    prediction_score FLOAT,
    decision ENUM(screened, rejected, review),
    model_version STRING,
    reviewed_by_admin BOOL,
    final_decision STRING,
    admin_notes TEXT,
    reviewed_by_admin_id FK→users
)
```

### Courses Table
```sql
courses (id, name, approval_threshold INT)
```

### Subjects Table
```sql
subjects (id, name UNIQUE)
```

### ApplicationSubjects (join table)
```sql
application_subjects (id, application_id FK, subject_id FK, mark FLOAT)
```

### CourseSubjectRequirements
```sql
course_subject_requirements (
    id,
    course_id FK→courses,
    subject_id FK→subjects,
    minimum_mark FLOAT,
    weight FLOAT
)
```

---

## Configuration Management

**Environment variables** (`backend/.env`):
```
DATABASE_URL=postgresql://...          # Database connection
SECRET_KEY=...                         # JWT signing key (min 32 chars)
ALGORITHM=HS256                        # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES=1440       # Token validity (default: 24h)
```

**Application settings** (`app/core/config.py`):
```python
class Settings:
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    token_expire_minutes: int = 1440
```

---

## Error Handling Strategy

**Validation Errors** – Request shape or values invalid
```json
{
    "detail": [
        {
            "loc": ["body", "email"],
            "msg": "invalid email format",
            "type": "value_error.email"
        }
    ]
}
```

**Authentication Errors** – Missing or invalid token
```json
{
    "detail": "Could not validate credentials"
}
```

**Authorization Errors** – Insufficient permissions
```json
{
    "detail": "Admin privileges required"
}
```

**Business Logic Errors** – Invalid state transitions
```json
{
    "detail": "Application already submitted"
}
```

**Standard HTTP Status Codes:**
- `200` – Success (GET, PATCH)
- `201` – Created (POST)
- `400` – Client error (validation, state)
- `401` – Unauthorized (auth failed)
- `403` – Forbidden (permission denied)
- `404` – Not found (resource missing)
- `409` – Conflict (duplicate)
- `422` – Unprocessable entity (validation)
- `500` – Server error

---

## Deployment Architecture

### Development
```
Developer Machine
├─ Frontend: npm dev server (port 3000)
├─ Backend: uvicorn reload (port 8000)
└─ Database: Local PostgreSQL or SQLite
```

### Production
```
Internet
    ↓
CDN/Static Host (Frontend)
├─ Index.html + JS/CSS bundles
├─ Cache static assets
└─ Redirect API calls to backend

    ↓
Application Load Balancer
    ↓
API Servers (Multiple instances)
├─ Gunicorn workers
├─ Uvicorn ASGI servers
├─ Environment-based config
└─ Health checks

    ↓
PostgreSQL Database
├─ Managed service (AWS RDS, Azure Database, etc.)
├─ Automated backups
├─ Read replicas for scaling
└─ Connection pooling

    ↓
File Object Storage
├─ S3 or equivalent
├─ Signed URLs for downloads
└─ Lifecycle policies for cleanup
```

---

## Testing Strategy

**Unit Tests** – Test individual functions
- Scoring engine logic
- Schema validation
- Service methods
- Utility functions

**Integration Tests** – Test API workflows
- User registration → login → application submission
- Admin review workflow
- Database transactions
- Error scenarios

**Test Database** – Isolated SQLite in-memory per test
```python
@pytest.fixture
def db():
    # Fresh database per test
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)
```

---

## Performance Considerations

### Database Optimization
- Indexed columns: `user_id`, `application_id`, `course_id`
- Connection pooling (SQLAlchemy pool_size)
- Eager loading relationships where needed

### API Optimization
- Response pagination for list endpoints (future)
- Caching for course/subject lookups
- Gzip compression on responses

### Frontend Optimization
- Code-split routes
- Lazy load admin components
- Cache API responses client-side

---

## Security Architecture

### Application Level
- **JWT tokens** for stateless auth
- **Role-based access control** (RBAC)
- **Input validation** via Pydantic
- **SQL injection prevention** via ORM parameterization
- **CORS** configured to specific origins
- **HTTPS** enforced in production

### Infrastructure Level
- **Environment variables** for secrets (no hardcoding)
- **Database credentials** in secure storage
- **API rate limiting** (implement if needed)
- **WAF rules** for attack prevention
- **Audit logging** for sensitive operations

### Data Protection
- **Passwords** hashed with bcrypt (salt + iterations)
- **Application data** accessible only to owners/admins
- **File uploads** validated and scanned
- **Backup encryption** at rest

---

## Future Enhancements

- [ ] Email notifications for decisions
- [ ] Pagination for list endpoints
- [ ] Advanced filtering & search
- [ ] Export applications to CSV/PDF
- [ ] Bulk upload via spreadsheet
- [ ] Custom report builder
- [ ] API rate limiting
- [ ] Server-side caching (Redis)
- [ ] Application analytics
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] GraphQL API option

---

**Last updated:** February 2026
