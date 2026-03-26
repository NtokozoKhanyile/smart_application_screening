from sqlalchemy.orm import Session
from app.db.models.course import Course
from app.db.models.application import Application

EVALUATION_VERSION = "rules_v1.0.2"


def evaluate_application(db: Session, application: Application):
    """Evaluate an application and return a consistent result payload.

    Scoring logic:
    - If any required subject is below its minimum mark → auto-rejected
    - Weighted average score is calculated across all requirements
    - Score >= approval_threshold → screened (suggested approve)
    - Score >= approval_threshold - 10 → review (borderline)
    - Score < approval_threshold - 10 → rejected (below threshold)

    The explanation field is a human-readable string shown to the applicant.
    """

    course = db.query(Course).filter(Course.id == application.course_id).first()

    if not course:
        return {
            "decision": "review",
            "score": 0,
            "explanation": "This course is not fully configured for automated screening. An admin will review your application manually.",
            "evaluation_version": EVALUATION_VERSION,
        }

    # Build subject mark dict keyed by subject name
    subject_marks = {
        app_subject.subject.name: app_subject.mark
        for app_subject in application.subjects
    }

    # ── Step 1: Check minimum requirements ───────────────────────
    failed_requirements = []
    for requirement in course.subject_requirements:
        subject_name = requirement.subject.name
        mark = subject_marks.get(subject_name, None)

        if mark is None:
            failed_requirements.append(
                f"{subject_name} (not submitted, minimum required: {requirement.minimum_mark}%)"
            )
        elif mark < requirement.minimum_mark:
            failed_requirements.append(
                f"{subject_name} ({mark}% submitted, minimum required: {requirement.minimum_mark}%)"
            )

    # ── Step 2: Calculate weighted score regardless of rejection ─
    total_score = 0
    total_weight = 0

    for requirement in course.subject_requirements:
        mark = subject_marks.get(requirement.subject.name, 0)
        total_score += mark * requirement.weight
        total_weight += requirement.weight

    final_score = round(total_score / total_weight, 2) if total_weight else 0

    # ── Step 3: Return result ─────────────────────────────────────
    if failed_requirements:
        reasons = "; ".join(failed_requirements)
        return {
            "decision": "rejected",
            "score": final_score,
            "explanation": (
                f"Your application did not meet the minimum subject requirements for {course.name}. "
                f"The following subject(s) did not meet the minimum mark: {reasons}."
            ),
            "evaluation_version": EVALUATION_VERSION,
        }

    if final_score >= course.approval_threshold:
        return {
            "decision": "recommended",
            "score": final_score,
            "explanation": (
                f"Your application meets the requirements for {course.name}. "
                f"Your weighted score of {final_score}% meets the approval threshold of {course.approval_threshold}%. "
                f"Your application is recommended for approval."
            ),
            "evaluation_version": EVALUATION_VERSION,
        }

    if final_score >= course.approval_threshold - 10:
        return {
            "decision": "review",
            "score": final_score,
            "explanation": (
                f"Your application is borderline for {course.name}. "
                f"Your weighted score of {final_score}% is close to the approval threshold of {course.approval_threshold}%. "
                f"An admin will review your application to make a final decision."
            ),
            "evaluation_version": EVALUATION_VERSION,
        }

    return {
        "decision": "rejected",
        "score": final_score,
        "explanation": (
            f"Your application did not meet the score requirements for {course.name}. "
            f"Your weighted score of {final_score}% is below the required threshold of {course.approval_threshold}%. "
            f"You may reapply with improved subject marks."
        ),
        "evaluation_version": EVALUATION_VERSION,
    }