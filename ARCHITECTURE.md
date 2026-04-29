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
│  │ Business Logic / Services Layer (SaaS Pattern)             │   │
│  │ ┌──────────────────────┐  ┌────────────────────────────┐  │   │
│  │ │Scoring Engine        │  │Application, Auth,          │  │   │
│  │ │• Rule evaluation     │  │Prediction, Storage         │  │   │
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

---

### 2. Backend (FastAPI)

#### API Layer (`app/api/routes/`)

Handles HTTP requests and responses. Routes are **thin** and delegate logic to services.

#### Services Layer (`app/services/`)

Contains all business logic and database orchestration. This ensures a clean separation of concerns.

**Key services:**

| Service | Responsibility |
|---------|---|
| `scoring_engine.py` | AI evaluation logic, threshold checking, decision routing |
| `application_service.py` | CRUD orchestration, status management, statistics calculation |
| `auth.py` | User registration, authentication, JWT creation |
| `prediction_service.py` | Screening result management, admin dashboard stats |
| `storage_service.py` | File upload and retrieval |

**Scoring Engine Logic:**
Standardized decisions:
- `recommended`: Passes approval threshold.
- `review`: Borderline case (threshold - 10%).
- `rejected`: Fails threshold or minimum requirements.

#### Data Access Layer (`app/db/`)

**Key Improvements:**
- **Hybrid Properties:** `Application.full_name` provides consistent formatting server-side.
- **Unique Constraints:** `ApplicationSubject` enforces one mark per subject per application.

---

## Data Flow: Application Submission

1. **Create Draft:** `POST /applications/` calls `application_service.create_application()`.
2. **Upload Documents:** `POST /documents/upload` manages binary storage.
3. **Submit:** `POST /applications/{id}/submit` triggers `scoring_engine.evaluate_application()`.
4. **Decision:** 
   - Status updated to `recommended`, `review`, or `rejected`.
   - `ScreeningResult` created with score and explanation.

---

## Database Schema Highlights

### Applications Table
```sql
applications (
    id, ...,
    status ENUM(draft, submitted, under_review, recommended, accepted, rejected),
    ...
)
```

### ScreeningResults Table
```sql
screening_results (
    ...,
    decision ENUM(recommended, review, rejected),
    ...
)
```

---

**Last updated:** April 2026
