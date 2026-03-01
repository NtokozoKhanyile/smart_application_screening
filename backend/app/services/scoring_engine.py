from sqlalchemy.orm import Session
from datetime import datetime
from app.db.models.course import Course
from app.db.models.application import Application

EVALUATION_VERSION = "rules_v1.0.1"


def evaluate_application(db: Session, application: Application):
    """Evaluate an application and return a consistent result payload.

    The caller provides the full SQLAlchemy ``application`` object so the
    engine can look up the course and associated requirements.  The output
    is a dict containing a numeric ``score`` as well as a ``decision`` and
    ``explanation`` string.  ``evaluation_version`` is included so the
    frontend or downstream analytics can track which ruleset produced the
    result.
    """

    course = db.query(Course).filter(Course.id == application.course_id).first()

    if not course:
        return {
            "decision": "review",
            "score": 0,
            "explanation": "Course not configured for scoring",
            "evaluation_version": EVALUATION_VERSION,
        }

    # Build subject dict from db
    subjects = {
        app_subject.subject.name: app_subject.mark
        for app_subject in application.subjects
    }

    # Check for min requirements
    for requirement in course.subject_requirements:
        subject_mark = subjects.get(requirement.subject.name, 0)

        if subject_mark < requirement.minimum_mark:
            return {
                "decision": "rejected",
                "score": 0,
                "explanation": (
                    f"Auto-rejected: Minimum requirement not met for {requirement.subject.name}"
                ),
                "evaluation_version": EVALUATION_VERSION,
            }

    # Weighted scoring
    total_score = 0
    total_weight = 0

    for requirement in course.subject_requirements:
        mark = subjects.get(requirement.subject.name, 0)
        total_score += mark * requirement.weight
        total_weight += requirement.weight

    final_score = total_score / total_weight if total_weight else 0

    if final_score >= course.approval_threshold:
        return {
            "decision": "screened",
            "score": final_score,
            "explanation": (
                f"suggested-approve: Meets approval threshold. Final Score: {final_score}"
            ),
            "evaluation_version": EVALUATION_VERSION,
        }
    elif final_score >= course.approval_threshold - 10:
        return {
            "decision": "screened",
            "score": final_score,
            "explanation": (
                f"Needs review: Score close to threshold. Final Score: {final_score}"
            ),
            "evaluation_version": EVALUATION_VERSION,
        }
    else:
        return {
            "decision": "rejected",
            "score": final_score,
            "explanation": (
                f"Auto-rejected: Score below threshold. Final Score: {final_score}"
            ),
            "evaluation_version": EVALUATION_VERSION,
        }
