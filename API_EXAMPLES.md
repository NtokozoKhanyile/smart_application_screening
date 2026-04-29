# API Examples & Testing Guide

This guide provides practical curl examples for testing the AI Application Screening Platform API.

## 1. Authentication

### Register a new user
```bash
curl -X POST "http://localhost:8000/auth/register?email=student@example.com&password=StudentPass123"
```

### Login and get token
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=student@example.com&password=StudentPass123"
```

---

## 2. Applications

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
    ...
    "subjects": [{"subject_id": 1, "mark": 85}]
  }'
```

### Get my application stats
```bash
curl -X GET http://localhost:8000/applications/stats/me \
  -H "Authorization: Bearer $TOKEN"
```
**Response:**
```json
{
  "total": 5,
  "draft": 2,
  "recommended": 1,
  "under_review": 1,
  "rejected": 1
}
```

### Submit application (triggers AI screening)
```bash
curl -X POST http://localhost:8000/applications/1/submit \
  -H "Authorization: Bearer $TOKEN"
```
**Response Status:** `recommended`, `under_review`, or `rejected`.

---

## 3. Admin Operations

### Get admin dashboard stats
```bash
curl -X GET http://localhost:8000/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
**Response:**
```json
{
  "total_screened": 150,
  "recommended": 95,
  "rejections": 40,
  "under_review": 15,
  "admin_overrides": 12,
  "average_ai_score": 68.4
}
```

**Last updated:** April 2026
