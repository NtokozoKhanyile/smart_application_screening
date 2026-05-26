# GEMINI.md - Project Context & Instructions

## Project Overview
**Lumina** is an AI-powered university application screening platform. It automates initial screening decisions for student applications based on their subject grades and course requirements, while providing administrators with tools for manual review, override, and analytics.

### Architecture
- **Monorepo Structure:** Contains both `backend/` (FastAPI) and `frontend/` (React).
- **Multi-layered Backend:**
    - `app/api/`: RESTful routes (thin layer).
    - `app/services/`: Core business logic (e.g., `scoring_engine.py`).
    - `app/db/`: SQLAlchemy models and session management.
    - `app/schemas/`: Pydantic validation models.
- **Modern Frontend:** React SPA using Vite, TailwindCSS, Zustand (state), and React Hook Form.
- **AI Scoring Engine:** Located in `backend/app/services/scoring_engine.py`, it evaluates applications against weighted course requirements and minimum thresholds.

---

## Core Technologies
- **Backend:** Python 3.10+, FastAPI, SQLAlchemy (PostgreSQL), Alembic (Migrations), Redis, JWT.
- **Frontend:** React 19, Vite, TailwindCSS, Zustand, React Router, React Hook Form, Recharts.
- **Infrastructure:** Docker, Docker Compose, Azure (Bicep/azd).

---

## Getting Started

### Quick Start (Docker)
The easiest way to run the full stack:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- API Docs (Swagger): `http://localhost:8000/docs`

### Manual Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (Windows: `venv\Scripts\activate`)
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

### Manual Frontend Setup
1. `cd frontend/lumina`
2. `npm install`
3. `npm run dev`

---

## Development Workflows

### Database Migrations (Alembic)
Always use Alembic for schema changes:
```bash
# Generate a new migration
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Running Tests
Tests are located in `backend/tests/` and use `pytest`.
```bash
cd backend
pytest
```

### Adding New API Features
1. Define the model in `backend/app/db/models/`.
2. Register the model in `backend/alembic/env.py`.
3. Create Pydantic schemas in `backend/app/schemas/`.
4. Implement business logic in `backend/app/services/`.
5. Add routes in `backend/app/api/routes/` and register them in `router.py`.

---

## Development Conventions
- **Naming:** Follow PEP 8 for Python; camelCase for JS/React.
- **Thin Controllers:** API routes should only handle request/response; all logic goes in `services/`.
- **Validation:** Use Pydantic schemas for all API input/output.
- **Authentication:** Use the `get_current_user` dependency in `backend/app/api/deps.py` for protected routes.
- **UI Styling:** Use TailwindCSS utility classes. Global styles are in `frontend/lumina/src/styles/globals.css`.
- **State Management:** Use Zustand for global frontend state (e.g., auth, notifications).

---

## Important Files
- `backend/app/main.py`: API entry point.
- `backend/app/services/scoring_engine.py`: Core AI logic.
- `frontend/lumina/src/App.jsx`: Frontend routing and entry point.
- `backend/alembic/env.py`: Database migration configuration.
- `ARCHITECTURE.md`: Detailed architectural diagrams.
