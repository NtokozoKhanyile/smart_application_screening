from app.services.scoring_engine import evaluate_application
from app.db.models import Course, Application, Subject, ApplicationSubject
from app.db.models.course import CourseSubjectRequirement


def make_application(db, user_id, course_id, subject_marks):
    # helper: create ApplicationSubject entries
    app = Application(
        user_id=user_id,
        course_id=course_id,
        first_name="Test",
        surname="User",
        email="test@x.com",
        phone_number="123",
        id_number="1",
        address="addr",
        guardian_name="G",
        guardian_phone_number="321",
        guardian_email="g@x.com",
        status="draft",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    for name, mark in subject_marks.items():
        subj = db.query(Subject).filter(Subject.name == name).first()
        if not subj:
            subj = Subject(name=name)
            db.add(subj)
            db.commit()
            db.refresh(subj)

        app_sub = ApplicationSubject(
            application_id=app.id,
            subject_id=subj.id,
            mark=mark,
        )
        db.add(app_sub)
    db.commit()
    db.refresh(app)
    return app


def test_evaluation_passes_threshold(db):
    # create course with requirements
    course = Course(name="C1", approval_threshold=60)
    db.add(course)
    db.commit()
    db.refresh(course)

    # create two subjects with equal weight
    s1 = Subject(name="Math")
    s2 = Subject(name="Eng")
    db.add_all([s1, s2])
    db.commit()
    db.refresh(s1)
    db.refresh(s2)

    req1 = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=s1.id,
        minimum_mark=0,
        weight=1,
    )
    req2 = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=s2.id,
        minimum_mark=0,
        weight=1,
    )
    db.add_all([req1, req2])
    db.commit()

    application = make_application(db, user_id=1, course_id=course.id, subject_marks={"Math": 70, "Eng": 70})

    result = evaluate_application(db, application)
    assert result["decision"] == "screened"
    assert result["score"] >= 60


def test_evaluation_fails_minimum(db):
    course = Course(name="C2", approval_threshold=50)
    db.add(course)
    db.commit()
    db.refresh(course)

    s = Subject(name="Bio")
    db.add(s)
    db.commit()
    db.refresh(s)

    req = CourseSubjectRequirement(course_id=course.id, subject_id=s.id, minimum_mark=50, weight=1)
    db.add(req)
    db.commit()

    application = make_application(db, user_id=1, course_id=course.id, subject_marks={"Bio": 40})
    result = evaluate_application(db, application)
    assert result["decision"] == "rejected"
    assert "Minimum requirement" in result["explanation"]
