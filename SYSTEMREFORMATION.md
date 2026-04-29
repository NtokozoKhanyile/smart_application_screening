This document serves as the Strategic Backend Reformation Plan for the Lumina AI Application Screening system. As a senior engineering
  lead, I have identified critical architectural flaws, security vulnerabilities, and logic leaks that must be remediated to meet SaaS
  industry standards (Meta/Google/Microsoft level).

  🏗️ Backend Reformation & Industry Standards Plan

  Status: 🔴 Critical Reforms Required
  Date: April 29, 2026

  ---

  1. Core Industry Standards (Mandatory)
  All agents must adhere to these coding standards during implementation:
   - Type Safety: Use Python Type Hints (PEP 484) everywhere. No Any.
   - Formatting & Linting: Strictly follow Ruff or Black + isort.
   - Documentation: Every service method must have a Google-style docstring explaining parameters, return types, and exceptions.
   - RESTful Idempotency: Ensure POST creates, PUT replaces, PATCH modifies, and DELETE is idempotent.
   - Service Pattern: Routers must only handle HTTP concerns (parsing, status codes). All business logic and DB operations must reside in
     the services/ layer.

  ---

  2. Priority Architectural Fixes

  🛑 A. Logic Decoupling (The "Fat Router" Problem)
  Issue: routes/applications.py contains direct SQLAlchemy logic for creating applications and subjects.
  Fix: 
   - [ ] Move application creation/update logic to services/application_service.py.
   - [ ] Encapsulate the subject mark insertion into a single transaction within the service.

  🛑 B. Enum & Decision Inconsistency
  Issue: scoring_engine.py returns recommended, but admin.py searches for screened.
  Fix:
   - [ ] Standardize ApplicationStatus and ScreeningDecision Enums.
   - [ ] Update admin.py to use the same constants as scoring_engine.py.

  🛑 C. Security Hardening
  Issue: CORS is set to *. Secret keys are managed via a simple .env without validation.
  Fix:
   - [ ] Restrict allow_origins to specific domains (frontend URL).
   - [ ] Implement proper error handling for JWT expiration (return 401 with specific sub-codes).
   - [ ] Implement RBAC (Role-Based Access Control) more granularly than simple string checks.

  ---

  3. Frontend-to-Backend Logic Migration
  The following logic is currently leaking into the React frontend and must be moved to the API:

   - [ ] Application Stats: Create GET /applications/stats/me for applicants. The frontend is currently fetching all applications and
     filtering by status in JS—this is a performance bottleneck.
   - [ ] Name Formatting: Implement a full_name property/hybrid_property in the Application model to ensure consistency.
   - [ ] Mark Thresholds: The frontend uses hardcoded 70/50% for color coding. These thresholds should be provided by the Course or
     ScreeningResult API.

  ---

  4. Master Implementation Checklist

  Phase 1: Foundation & Data Integrity
   - [ ] Sync Model/Schema/Service: Fix the candidate_name vs first_name/surname mismatch in application_service.py.
   - [ ] Empty Service Cleanup: Populate auth.py and prediction_service.py with logic currently sitting in routers.
   - [ ] Database Constraints: Add UniqueConstraint on ApplicationSubject (one mark per subject per application).

  Phase 2: API Enhancements
   - [ ] Pagination: Add limit and offset to GET /applications/all and GET /applications/me.
   - [ ] Advanced Filtering: Add query params to filter applications by status or course on the backend.
   - [ ] Standardized Responses: Implement a global exception handler to return consistent JSON error shapes: { "error": "TYPE", "message":
     "...", "details": {} }.

  Phase 3: Scoring & Admin Logic
   - [ ] Evaluation Versioning: Move EVALUATION_VERSION to a config file or database-backed versioning system.
   - [ ] Admin Dashboard Fix: Update admin/dashboard to correctly count recommended and review statuses.
   - [ ] Audit Trail: Ensure updated_at timestamps are automatically handled by SQLAlchemy for all models.

  ---

  5. Reference for Future Turns
  When an agent starts a task, they must:
   1. Reference the specific checkbox in Section 4.
   2. Verify the app/services/ layer implementation before touching app/api/.
   3. Update the ApplicationResponse schema if new data (like stats) is added.

  ---
  Signed,
  Senior Engineering Staff @ Lumina (via Gemini CLI)