# AI Application Screening Platform

A modern, full-stack university application screening system that leverages AI to automate initial screening decisions while empowering administrators with transparent review tools.

**Stack:** FastAPI, JavaScript, PostgreSQL, JWT Authentication

---

## 📋 Features

### For Students (Applicants)
- ✅ User registration and authentication  
- ✅ Create draft applications with personal and guardian information
- ✅ Submit applications with subject grades for AI screening  
- ✅ Upload supporting documents (academic results, ID copies, etc.)
- ✅ Track application status through screening pipeline
- ✅ View screening decisions and feedback

### For Admins
- ✅ AI-powered automated screening based on configurable rules
- ✅ Manual review and override capability for edge cases
- ✅ Dashboard with application statistics and metrics
- ✅ Approval/rejection tracking and audit trail
- ✅ Subject requirement configuration per course
- ✅ Bulk application management

### Technical
- ✅ JWT-based authentication with role-based access control
- ✅ RESTful API with comprehensive error handling
- ✅ Automated database migrations (Alembic)
- ✅ Unit and integration tests for critical paths
- ✅ CORS support for frontend integration
- ✅ File upload handling with validation
- ✅ Scoring engine with configurable thresholds

---

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Configure your database
alembic upgrade head
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`  
Interactive API docs: `http://localhost:8000/docs`

→ **[Full backend documentation →](backend/README.md)**

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

→ **[Frontend documentation →](frontend/README.md)** (coming soon)

---

## 📁 Project Structure

```
ai-application-screening/
├── backend/                    # FastAPI REST API
│   ├── app/
│   │   ├── api/               # Route handlers
│   │   ├── db/                # Database models & session
│   │   ├── schemas/           # Pydantic validation
│   │   ├── services/          # Business logic & AI
│   │   └── core/              # Config, auth, security
│   ├── tests/                 # Unit & integration tests
│   ├── alembic/               # Database migrations
│   └── requirements.txt
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page-level components
│   │   └── services/          # API client
│   └── package.json
├── docs/                      # Additional documentation
└── docker-compose.yml         # Multi-container setup
```

---

## 🔐 Authentication & Authorization

The system uses **JWT tokens** for stateless authentication.

| Role | Permissions |
|------|-------------|
| **applicant** | Create/submit applications, upload documents, view own data |
| **admin** | All applicant permissions + review screenings, override decisions, view dashboard |

Example login flow:
```bash
curl -X POST http://localhost:8000/auth/login \
  -d "username=user@example.com&password=password"
```

Response:
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

Then use in all subsequent requests:
```
Authorization: Bearer {access_token}
```

---

## 🎯 Application Workflow

```
1. Student registers & logs in
2. Student creates application (draft)
3. Student adds personal info + subject grades
4. Student uploads supporting documents
5. Student submits application → AI screening triggered
6. System evaluates grades against course requirements
7. Decision issued: APPROVED → NEEDS_REVIEW → REJECTED
8. Admin receives notifications for manual cases
9. Admin reviews, approves, or rejects
10. Student notified of final decision
```

---

## 🧠 Scoring Logic

The AI screening engine evaluates applications by:

1. **Checking minimum requirements** – Ensures all required subjects meet minimum marks
2. **Calculating weighted score** – Subject grades weighted according to course configuration
3. **Decision routing**:
   - ✅ **APPROVED** if score ≥ approval threshold
   - ⚠️ **REVIEW** if score is within 10 points of threshold (marginal cases)
   - ❌ **REJECTED** if score is below threshold or fails minimums

Admins can override any automated decision with notes for audit trail.

---

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest                          # Run all tests
pytest tests/test_application.py -v  # Run specific file
pytest --cov=app               # With coverage report
```

Tests cover:
- Authentication & authorization
- Application CRUD operations
- Scoring logic & edge cases
- Admin workflows
- Error handling

---

## 🛠 Development

### Adding a new feature:
1. Create database model in `backend/app/db/models/`
2. Create Pydantic schema in `backend/app/schemas/`
3. Create API route handler in `backend/app/api/routes/`
4. Generate and run database migration
5. Write tests in `backend/tests/`
6. Document in README

### Database changes:
```bash
cd backend
alembic revision --autogenerate -m "description of changes"
alembic upgrade head
```

---

## 📦 Deployment

### Docker Compose (Development)
```bash
docker-compose up
```

### Production Deployment
- Backend: Deploy FastAPI on Gunicorn/Nginx
- Database: PostgreSQL (managed service recommended)
- Frontend: Static hosting (Vercel, Netlify, etc.)
- Environment variables configured per environment

See [backend/README.md](backend/README.md#deployment) for detailed deployment instructions.

---

## 📚 API Documentation

The backend includes auto-generated interactive API documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

For detailed endpoint documentation, see [backend/README.md#api-endpoints](backend/README.md#api-endpoints).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and write tests
4. Run `pytest` to ensure tests pass
5. Commit and push to your fork
6. Submit a pull request

---

## 📝 License

[Add your license here]

---

**Built with ❤️ for university admissions teams**  
*Last updated: February 2026*
