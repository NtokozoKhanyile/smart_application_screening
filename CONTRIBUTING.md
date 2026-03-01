# Contributing Guidelines

Thank you for your interest in contributing to the AI Application Screening Platform! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-application-screening.git
   cd ai-application-screening
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/NtokozoKhanyile/ai-application-screening.git
   ```

## Development Workflow

### 1. Create a Feature Branch
Always create a new branch for your work:

```bash
git checkout -b feature/add-email-notifications
# or for bug fixes:
git checkout -b fix/scoring-calculation-bug
```

Branch naming convention: `feature/*`, `fix/*`, `docs/*`, `refactor/*`

### 2. Set Up Development Environment

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env .env.local  # Local overrides (don't commit)
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Make Your Changes

Follow the project structure and coding standards:

- **Backend:** Python with FastAPI/SQLAlchemy
- **Frontend:** React with modern JavaScript
- Write clear, descriptive commit messages

### 4. Write Tests

**Backend:** All significant code changes require tests

```bash
cd backend
pytest tests/  # Run existing tests
# Add new tests for your feature
pytest tests/test_your_feature.py -v
```

**Frontend:** Add tests for new components (when applicable)

```bash
cd frontend
npm test
```

### 5. Run Linting & Formatting

**Backend:**
```bash
cd backend
pip install black flake8
black app/
flake8 app/ --max-line-length=100
```

### 6. Commit Your Changes

Write clear, meaningful commit messages:

```bash
git add .
git commit -m "feat: add email notifications for application decisions

- Send email to applicant when screening completes
- Include decision reason and next steps
- Add admin notification for manual review needed cases"
```

**Commit message format:**
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `test:` for test additions
- `chore:` for maintenance tasks

### 7. Keep Your Branch Up to Date

Before submitting a PR:

```bash
git fetch upstream
git rebase upstream/main
# or merge if you prefer
git merge upstream/main
```

### 8. Push and Create a Pull Request

```bash
git push origin feature/add-email-notifications
```

Then open a PR on GitHub with:
- Clear title and description
- Link to any related issues
- Screenshots for UI changes
- Testing instructions

---

## Code Style Guide

### Python (Backend)

**Imports:**
- Group standard library, third-party, then local imports
- Use absolute imports

```python
# Standard library
import os
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends

# Local
from app.db.session import get_db
from app.schemas.application import ApplicationCreate
```

**Naming:**
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

**Docstrings:**
```python
def evaluate_application(db: Session, application: Application) -> dict:
    """Evaluate an application against course requirements.
    
    Args:
        db: Database session
        application: Application object to evaluate
        
    Returns:
        Dictionary with keys: decision, score, explanation, evaluation_version
    """
    pass
```

**Type hints:**
Always use type hints for function parameters and returns:

```python
def submit_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApplicationOut:
```

### JavaScript/React (Frontend)

- Use **ES6+** syntax
- Functional components with hooks
- Props: clear, documented
- File structure: one component per file when possible

```jsx
/**
 * ApplicationForm - Component for creating/editing applications
 * @param {Object} applicationData - Initial form data
 * @param {Function} onSubmit - Callback when form is submitted
 */
function ApplicationForm({ applicationData, onSubmit }) {
  // Implementation
}
```

---

## Database Changes

When modifying database models:

1. Update the model in `backend/app/db/models/`
2. Generate a migration:
   ```bash
   cd backend
   alembic revision --autogenerate -m "descriptive message"
   ```
3. Review `alembic/versions/xxxx_descriptive_message.py`
4. Test the migration locally:
   ```bash
   alembic upgrade head
   ```
5. Include migration file in your PR

---

## Testing Standards

### Backend (pytest)

**Unit tests** – Test individual functions/methods:
```python
def test_scoring_passes_threshold(db):
    course = Course(name="Test", approval_threshold=60)
    db.add(course)
    db.commit()
    
    application = make_application(db, course, marks={"Math": 80})
    result = evaluate_application(db, application)
    
    assert result["decision"] == "screened"
    assert result["score"] >= 60
```

**Integration tests** – Test full workflows:
```python
def test_application_submission_workflow(client, db, auth_headers):
    # Create resources
    # Make API calls
    # Assert results
    pass
```

**Test coverage goal:** Aim for 80%+ coverage on critical paths

Run tests:
```bash
cd backend
pytest                      # All tests
pytest -v                  # Verbose
pytest --cov=app          # With coverage
pytest tests/test_auth.py # Specific file
```

### Frontend Tests (Optional)

```jsx
import { render, screen } from '@testing-library/react';
import ApplicationForm from './ApplicationForm';

test('renders form with course selector', () => {
  render(<ApplicationForm />);
  expect(screen.getByLabelText(/course/i)).toBeInTheDocument();
});
```

---

## Documentation

### API Documentation

For new endpoints, add docstrings to route handlers:

```python
@router.post("/applications/{id}/submit")
async def submit_application(id: int):
    """Submit application for screening.
    
    **Path Parameters:**
    - id: Application ID
    
    **Response:**
    - 200: Application submitted, screening started
    - 404: Application not found
    - 400: Invalid application status
    """
```

### README Updates

If your changes affect usage, update:
- `README.md` – High-level overview changes
- `backend/README.md` – Backend API/setup changes
- `frontend/README.md` – Frontend setup/usage changes

---

## Common Issues & Solutions

### Issue: Tests fail locally but pass on CI

- Ensure database is clean: `alembic downgrade base && alembic upgrade head`
- Check `.env` configuration
- Verify Python version matches

### Issue: Virtual environment issues

```bash
# Recreate venv
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Database migration conflicts

```bash
# Remove conflicting migrations and recreate
alembic downgrade <relevant_migration>
alembic revision --autogenerate -m "new message"
```

---

## Code Review Process

When your PR is submitted:

1. **Automated checks** run (tests, linting)
2. **Maintainers review** code and tests
3. **Discussion** – We may request changes
4. **Approval & merge** – PR is merged to main

**Review expectations:**
- Clear, logical code
- Tests for new functionality
- No breaking changes without discussion
- Updated documentation

---

## Reporting Issues

Found a bug? Please report it!

1. **Check existing issues** – Search for similar reports
2. **Create new issue** with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Python version, etc.)
   - Screenshots if applicable

Example:
```
Title: Scoring engine incorrectly rejects borderline applications

Description:
Applications with scores within 5-10 points of approval threshold 
are being rejected instead of flagged for review.

Steps to reproduce:
1. Create application with score = 55 (threshold = 60)
2. Submit application
3. Check screening result

Expected: decision = "review"
Actual: decision = "rejected"
```

---

## Questions or Need Help?

- **Join discussions** – Use GitHub Discussions
- **Comment on issues** – Ask clarifying questions
- **DM maintainers** – For sensitive topics

---

## Recognition

Contributors are acknowledged in:
- `CONTRIBUTORS.md` (after first PR)
- GitHub contributor stats

Thank you for contributing! 🙌
