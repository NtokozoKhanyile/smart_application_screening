"""
Lumina Data Seeder
==================
Run from the backend directory:
    python seed.py

This script creates:
- 2 admin users
- 20 applicant users
- 4 courses with subject requirements
- SA matric subjects (if not already seeded)
- 60 applications with realistic screening outcomes
- Admin overrides on a subset of applications

WARNING: This script is for development/testing only.
It will skip creating records that already exist.
"""

import sys
import os
import random
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.subject import Subject
from app.db.models.course import Course, CourseSubjectRequirement
from app.db.models.application import Application, ApplicationStatus
from app.db.models.application_subject import ApplicationSubject
from app.db.models.prediction import ScreeningResult
from app.services.scoring_engine import evaluate_application

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Seed Data Definitions ─────────────────────────────────────────

ADMIN_USERS = [
    {"email": "admin@lumina.ac.za", "password": "Admin123!"},
    {"email": "reviewer@lumina.ac.za", "password": "Admin123!"},
]

APPLICANT_USERS = [
    {"email": f"student{i:02d}@example.com", "password": "Password123"}
    for i in range(1, 21)
]

SA_SUBJECTS = [
    "Mathematics", "Mathematical Literacy", "Physical Sciences",
    "Life Sciences", "Accounting", "Business Studies", "Economics",
    "History", "Geography", "English Home Language",
    "English First Additional Language", "Afrikaans Home Language",
    "Afrikaans First Additional Language", "Zulu Home Language",
    "Xhosa Home Language", "Life Orientation", "Computer Applications Technology",
    "Information Technology", "Engineering Graphics and Design",
    "Agricultural Sciences", "Tourism", "Consumer Studies",
    "Hospitality Studies", "Dramatic Arts", "Music", "Visual Arts",
    "Design", "Religion Studies", "Sociology", "Psychology",
]

COURSES = [
    {
        "name": "BSc Computer Science",
        "approval_threshold": 70.0,
        "requirements": [
            {"subject": "Mathematics", "minimum_mark": 60, "weight": 2.0},
            {"subject": "Physical Sciences", "minimum_mark": 50, "weight": 1.5},
            {"subject": "English Home Language", "minimum_mark": 40, "weight": 1.0},
        ]
    },
    {
        "name": "BCom Accounting",
        "approval_threshold": 65.0,
        "requirements": [
            {"subject": "Mathematics", "minimum_mark": 50, "weight": 1.5},
            {"subject": "Accounting", "minimum_mark": 60, "weight": 2.0},
            {"subject": "English Home Language", "minimum_mark": 40, "weight": 1.0},
        ]
    },
    {
        "name": "BA Social Sciences",
        "approval_threshold": 60.0,
        "requirements": [
            {"subject": "English Home Language", "minimum_mark": 50, "weight": 2.0},
            {"subject": "History", "minimum_mark": 40, "weight": 1.5},
            {"subject": "Life Orientation", "minimum_mark": 40, "weight": 0.5},
        ]
    },
    {
        "name": "BEng Civil Engineering",
        "approval_threshold": 75.0,
        "requirements": [
            {"subject": "Mathematics", "minimum_mark": 70, "weight": 2.5},
            {"subject": "Physical Sciences", "minimum_mark": 65, "weight": 2.0},
            {"subject": "English Home Language", "minimum_mark": 40, "weight": 1.0},
        ]
    },
]

# Realistic South African names for seeding
FIRST_NAMES = [
    "Sipho", "Thabo", "Nomsa", "Lerato", "Kagiso", "Zanele", "Mpho",
    "Thandeka", "Bongani", "Naledi", "Siyanda", "Ayanda", "Lungelo",
    "Precious", "Tshepo", "Nandi", "Luthando", "Keitumetse", "Dineo", "Andile"
]

SURNAMES = [
    "Dlamini", "Nkosi", "Mokoena", "Sithole", "Ndlovu", "Khumalo",
    "Mahlangu", "Molefe", "Nzama", "Shabalala", "Mthembu", "Cele",
    "Nxumalo", "Buthelezi", "Zwane", "Vilakazi", "Mhlongo", "Zulu",
    "Ngcobo", "Mkhize"
]

ADDRESSES = [
    "12 Main Road, Soweto, Johannesburg",
    "45 Church Street, Cape Town",
    "78 Smith Street, Durban",
    "23 Voortrekker Road, Pretoria",
    "56 Commissioner Street, Johannesburg",
    "91 Long Street, Cape Town",
    "34 West Street, Durban",
    "67 Paul Kruger Street, Pretoria",
    "15 Victoria Road, East London",
    "88 Grey Street, Port Elizabeth",
]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed_users(db: Session):
    print("\n── Seeding users ─────────────────────────────────")
    created = 0

    for admin in ADMIN_USERS:
        if not db.query(User).filter(User.email == admin["email"]).first():
            db.add(User(
                email=admin["email"],
                hashed_password=hash_password(admin["password"]),
                role="admin"
            ))
            created += 1
            print(f"  ✓ Admin: {admin['email']}")

    for applicant in APPLICANT_USERS:
        if not db.query(User).filter(User.email == applicant["email"]).first():
            db.add(User(
                email=applicant["email"],
                hashed_password=hash_password(applicant["password"]),
                role="applicant"
            ))
            created += 1

    db.commit()
    print(f"  Created {created} users ({len(ADMIN_USERS)} admins, {created - len(ADMIN_USERS)} applicants)")


def seed_subjects(db: Session):
    print("\n── Seeding subjects ──────────────────────────────")
    created = 0
    for name in SA_SUBJECTS:
        if not db.query(Subject).filter(Subject.name == name).first():
            db.add(Subject(name=name))
            created += 1
    db.commit()
    print(f"  Created {created} subjects ({db.query(Subject).count()} total)")


def seed_courses(db: Session):
    print("\n── Seeding courses ───────────────────────────────")
    created = 0
    for course_data in COURSES:
        course = db.query(Course).filter(Course.name == course_data["name"]).first()
        if not course:
            course = Course(
                name=course_data["name"],
                approval_threshold=course_data["approval_threshold"]
            )
            db.add(course)
            db.flush()
            created += 1
            print(f"  ✓ Course: {course.name} (threshold: {course.approval_threshold}%)")

        # Add requirements if not already there
        for req_data in course_data["requirements"]:
            subject = db.query(Subject).filter(Subject.name == req_data["subject"]).first()
            if subject:
                existing = db.query(CourseSubjectRequirement).filter(
                    CourseSubjectRequirement.course_id == course.id,
                    CourseSubjectRequirement.subject_id == subject.id,
                ).first()
                if not existing:
                    db.add(CourseSubjectRequirement(
                        course_id=course.id,
                        subject_id=subject.id,
                        minimum_mark=req_data["minimum_mark"],
                        weight=req_data["weight"],
                    ))

    db.commit()
    print(f"  Created {created} courses")


def seed_applications(db: Session):
    print("\n── Seeding applications ──────────────────────────")

    applicants = db.query(User).filter(User.role == "applicant").all()
    admins = db.query(User).filter(User.role == "admin").all()
    courses = db.query(Course).all()

    if not applicants or not courses:
        print("  ✗ No applicants or courses found. Run user/course seed first.")
        return

    existing_count = db.query(Application).count()
    if existing_count >= 50:
        print(f"  Skipping — {existing_count} applications already exist.")
        return

    created = 0
    admin_id = admins[0].id if admins else None

    # Distribute applications across different outcome scenarios
    scenarios = [
        # (course_idx, mark_profile, should_admin_override, override_decision)
        # High scorers — recommended, some accepted by admin
        *[("BSc Computer Science", "high", True, "accepted") for _ in range(5)],
        *[("BCom Accounting", "high", True, "accepted") for _ in range(5)],
        *[("BA Social Sciences", "high", True, "accepted") for _ in range(4)],
        *[("BEng Civil Engineering", "high", True, "accepted") for _ in range(3)],

        # Borderline — under_review, admin decides
        *[("BSc Computer Science", "borderline", True, "accepted") for _ in range(3)],
        *[("BCom Accounting", "borderline", True, "rejected") for _ in range(3)],
        *[("BA Social Sciences", "borderline", False, None) for _ in range(3)],
        *[("BEng Civil Engineering", "borderline", True, "rejected") for _ in range(2)],

        # Low scorers — rejected by AI
        *[("BSc Computer Science", "low", False, None) for _ in range(5)],
        *[("BCom Accounting", "low", False, None) for _ in range(4)],
        *[("BA Social Sciences", "low", False, None) for _ in range(3)],
        *[("BEng Civil Engineering", "low", False, None) for _ in range(4)],

        # Min requirement failures
        *[("BSc Computer Science", "fail_min", False, None) for _ in range(3)],
        *[("BEng Civil Engineering", "fail_min", False, None) for _ in range(3)],

        # AI rejected but admin overrides to accept
        *[("BA Social Sciences", "low", True, "accepted") for _ in range(2)],
        *[("BCom Accounting", "borderline", True, "accepted") for _ in range(2)],

        # Drafts (not submitted)
        *[("BSc Computer Science", "high", False, None) for _ in range(2)],
    ]

    random.shuffle(scenarios)
    applicant_cycle = applicants * 10  # cycle through applicants

    for i, (course_name, mark_profile, do_override, override_decision) in enumerate(scenarios):
        applicant = applicant_cycle[i % len(applicants)]
        course = next((c for c in courses if c.name == course_name), courses[0])
        first_name = FIRST_NAMES[i % len(FIRST_NAMES)]
        surname = SURNAMES[i % len(SURNAMES)]

        # Generate marks based on profile
        marks = generate_marks(db, course, mark_profile)

        # Create application
        days_ago = random.randint(1, 90)
        created_at = datetime.utcnow() - timedelta(days=days_ago)

        app = Application(
            user_id=applicant.id,
            course_id=course.id,
            first_name=first_name,
            middle_name=None,
            surname=surname,
            email=applicant.email,
            phone_number=f"07{random.randint(10000000, 99999999)}",
            id_number=f"{random.randint(900101, 991231)}{random.randint(1000, 9999)}",
            address=random.choice(ADDRESSES),
            guardian_name=f"{random.choice(FIRST_NAMES)} {random.choice(SURNAMES)}",
            guardian_phone_number=f"07{random.randint(10000000, 99999999)}",
            guardian_email=None,
            status=ApplicationStatus.draft,
            created_at=created_at,
        )
        db.add(app)
        db.flush()

        # Add subject marks
        for req in course.subject_requirements:
            mark = marks.get(req.subject.name, random.randint(40, 75))
            db.add(ApplicationSubject(
                application_id=app.id,
                subject_id=req.subject_id,
                mark=mark,
            ))

        db.flush()

        # Submit and screen (unless draft)
        is_draft = (mark_profile == "high" and i >= len(scenarios) - 3)
        if not is_draft:
            app.status = ApplicationStatus.submitted
            db.flush()

            evaluation = evaluate_application(db, app)
            decision = evaluation["decision"]

            if decision == "rejected":
                app.status = ApplicationStatus.rejected
            elif decision == "recommended":
                app.status = ApplicationStatus.recommended
            else:
                app.status = ApplicationStatus.under_review

            screening = ScreeningResult(
                application_id=app.id,
                prediction_score=evaluation["score"],
                decision=decision,
                model_version=evaluation.get("evaluation_version", "rules_v1.0.2"),
                explanation=evaluation.get("explanation"),
            )
            db.add(screening)
            db.flush()

            # Admin override
            if do_override and override_decision and admin_id:
                screening.reviewed_by_admin = True
                screening.final_decision = override_decision
                screening.reviewed_by_admin_id = admin_id
                screening.admin_notes = generate_admin_note(override_decision, evaluation["score"])

                if override_decision == "accepted":
                    app.status = ApplicationStatus.accepted
                elif override_decision == "rejected":
                    app.status = ApplicationStatus.rejected
                else:
                    app.status = ApplicationStatus.under_review

        db.commit()
        created += 1

    print(f"  Created {created} applications")
    print_summary(db)


def generate_marks(db: Session, course: Course, profile: str) -> dict:
    """Generate subject marks based on the desired outcome profile."""
    marks = {}
    for req in course.subject_requirements:
        name = req.subject.name
        min_mark = req.minimum_mark

        if profile == "high":
            marks[name] = random.randint(75, 95)
        elif profile == "borderline":
            # Score will be close to threshold
            marks[name] = random.randint(int(min_mark + 5), int(min_mark + 20))
        elif profile == "low":
            # Meets minimum but scores below threshold
            marks[name] = random.randint(int(min_mark), int(min_mark + 10))
        elif profile == "fail_min":
            # Fails the minimum mark requirement
            marks[name] = random.randint(max(0, int(min_mark) - 20), int(min_mark) - 1)

    return marks


def generate_admin_note(decision: str, score: float) -> str:
    accept_notes = [
        "Strong extracurricular record considered.",
        "Portfolio reviewed — exceptional work.",
        "Interview performance was outstanding.",
        "Recommendation letter from teacher taken into account.",
        "Special circumstances considered by committee.",
    ]
    reject_notes = [
        "Score too low even after manual review.",
        "Incomplete supporting documents.",
        "Does not meet the minimum requirements after review.",
        "Committee decision after full review.",
    ]
    if decision == "accepted":
        return random.choice(accept_notes)
    return random.choice(reject_notes)


def print_summary(db: Session):
    print("\n── Seed Summary ──────────────────────────────────")
    total = db.query(Application).count()
    for status in ApplicationStatus:
        count = db.query(Application).filter(Application.status == status).count()
        if count > 0:
            print(f"  {status.value:15} {count:3} applications")
    print(f"  {'TOTAL':15} {total:3} applications")

    overrides = db.query(ScreeningResult).filter(ScreeningResult.reviewed_by_admin == True).count()
    print(f"\n  Admin overrides: {overrides}")
    print("─" * 50)


def main():
    print("=" * 50)
    print("  Lumina Data Seeder")
    print("=" * 50)

    db: Session = SessionLocal()
    try:
        seed_users(db)
        seed_subjects(db)
        seed_courses(db)
        seed_applications(db)
        print("\n✓ Seeding complete!\n")
    except Exception as e:
        db.rollback()
        print(f"\n✗ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()