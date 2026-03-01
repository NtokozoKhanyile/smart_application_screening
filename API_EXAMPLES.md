# API Examples & Testing Guide

This guide provides practical curl examples for testing the AI Application Screening Platform API.

## Prerequisites

- Backend running: `uvicorn app.main:app --reload`
- API base URL: `http://localhost:8000`
- Authentication: You'll need tokens from login endpoints

---

## 1. Authentication

### Register a new user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=student@example.com&password=StudentPass123"
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

### Login and get token

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student@example.com&password=StudentPass123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Save the token for subsequent requests:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get current user info

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": 1,
  "email": "student@example.com",
  "role": "applicant"
}
```

---

## 2. Courses & Subjects

### List courses

```bash
curl -X GET http://localhost:8000/courses/ \
  -H "Authorization: Bearer $TOKEN"
```

### Get course details

```bash
curl -X GET http://localhost:8000/courses/1 \
  -H "Authorization: Bearer $TOKEN"
```

### List subjects

```bash
curl -X GET http://localhost:8000/subjects/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 3. Applications

### Create an application (draft)

```bash
curl -X POST http://localhost:8000/applications/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 1,
    "first_name": "John",
    "middle_name": "A",
    "surname": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+27512345678",
    "id_number": "9704105001987",
    "address": "123 Main Street, Cape Town",
    "guardian_name": "Jane Doe",
    "guardian_phone_number": "+27512345679",
    "guardian_email": "jane@example.com",
    "subjects": [
      {"subject_id": 1, "mark": 85},
      {"subject_id": 2, "mark": 78},
      {"subject_id": 3, "mark": 92}
    ]
  }'
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "course_id": 1,
  "first_name": "John",
  "status": "draft",
  "created_at": "2026-02-28T10:30:00",
  ...
}
```

### Get my applications

```bash
curl -X GET http://localhost:8000/applications/me \
  -H "Authorization: Bearer $TOKEN"
```

### Get specific application

```bash
curl -X GET http://localhost:8000/applications/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Update application (before submission)

```bash
curl -X PUT http://localhost:8000/applications/1/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "email": "newemail@example.com",
    ...
  }'
```

---

## 4. Submit Application & Screening

### Submit application (triggers AI screening)

```bash
curl -X POST http://localhost:8000/applications/1/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
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

---

## 5. Documents

### Upload document

```bash
curl -X POST http://localhost:8000/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "application_id=1" \
  -F "content_type=latest_academic_results" \
  -F "file=@/path/to/transcript.pdf"
```

Valid `content_type` values:
- `latest_academic_results`
- `id_copy`
- `guardian_id_copy`

**Response:**
```json
{
  "id": 1,
  "application_id": 1,
  "filename": "transcript.pdf",
  "content_type": "latest_academic_results",
  "uploaded_at": "2026-02-28T10:35:00"
}
```

---

## 6. Admin Operations

### Create admin user (manually in database or via admin endpoint)

```sql
-- In database directly:
INSERT INTO users (email, hashed_password, role) 
VALUES ('admin@example.com', 'hashed_password_here', 'admin');
```

### Get screening results (admin)

```bash
curl -X GET http://localhost:8000/predictions/screening-results \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Get screening result for specific application (admin)

```bash
curl -X GET http://localhost:8000/predictions/applications/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Manually screen an application (admin)

```bash
curl -X POST http://localhost:8000/predictions/applications/1/screen \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "application_id": 1,
  "prediction_score": 85.0,
  "decision": "screened",
  "explanation": "suggested-approve: Meets approval threshold. Final Score: 85.0"
}
```

### Review & override screening decision (admin)

```bash
curl -X PATCH http://localhost:8000/predictions/screening-results/1/review \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "final_decision": "accept",
    "admin_notes": "Excellent grades and strong profile. Recommended for acceptance."
  }'
```

**Response:**
```json
{
  "message": "Screening decision reviewed by admin",
  "screening_result": {
    "id": 1,
    "application_id": 1,
    "decision": "screened",
    "final_decision": "accept",
    "admin_notes": "Excellent grades and strong profile...",
    "reviewed_by_admin": true
  }
}
```

### Update application status (admin)

```bash
curl -X PATCH http://localhost:8000/applications/1/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "accepted"}'
```

### Get admin dashboard stats

```bash
curl -X GET http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
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

## Testing with Python

If you prefer Python for more complex testing:

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Register
registration = requests.post(
    f"{BASE_URL}/auth/register",
    data={"email": "test@example.com", "password": "TestPass123"}
)
print(registration.json())

# Login
login = requests.post(
    f"{BASE_URL}/auth/login",
    data={"username": "test@example.com", "password": "TestPass123"}
)
token = login.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create application
app_data = {
    "course_id": 1,
    "first_name": "John",
    "surname": "Doe",
    "email": "john@example.com",
    "phone_number": "+2712345678",
    "id_number": "9704105001987",
    "address": "123 Main St",
    "guardian_name": "Jane Doe",
    "guardian_phone_number": "+27123456789",
    "guardian_email": "jane@example.com",
    "subjects": [
        {"subject_id": 1, "mark": 85},
        {"subject_id": 2, "mark": 78}
    ]
}

application = requests.post(
    f"{BASE_URL}/applications/",
    headers=headers,
    json=app_data
)
print(application.json())

# Submit application
app_id = application.json()["id"]
submission = requests.post(
    f"{BASE_URL}/applications/{app_id}/submit",
    headers=headers
)
print(submission.json())
```

---

## Testing with Postman/Insomnia

1. **Import API**: Use the auto-generated OpenAPI spec from `/docs`
2. **Set up environment variables**:
   - `BASE_URL`: `http://localhost:8000`
   - `TOKEN`: Retrieved from login response
3. **Create requests** using the variables: `{{BASE_URL}}/applications/` and header `Authorization: Bearer {{TOKEN}}`

---

## Common Testing Scenarios

### Scenario 1: Complete workflow
1. Register user
2. Login to get token
3. Create application (draft)
4. Upload documents
5. Submit application (triggers screening)
6. (As admin) Review screening result
7. (As admin) Override decision

### Scenario 2: Test scoring logic
1. Create course with subject requirements
2. Create applications with varying marks
3. Submit and observe different decisions
4. Verify scoring matches configuration

### Scenario 3: Admin operations
1. Login as admin
2. Get dashboard stats
3. Fetch all screening results
4. Override specific decision
5. Update application status

---

## Troubleshooting API Calls

### 401 Unauthorized
- Token expired or invalid
- Solution: Login again and get new token

### 403 Forbidden
- User doesn't have required role
- Solution: Login as admin or ensure user has proper permissions

### 422 Unprocessable Entity
- Request data validation failed
- Check response for specific field errors
- Ensure all required fields are present with correct types

### 404 Not Found
- Resource doesn't exist
- Verify IDs are correct
- Check if you have permission to access the resource

### 400 Bad Request
- Invalid application state
- Application already submitted, can't edit
- Subject ID doesn't exist
- Solution: Check business logic requirements

---

## Interactive API Documentation

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These provide interactive forms to test all endpoints with auto-generated documentation.

---

**Last updated:** February 2026
