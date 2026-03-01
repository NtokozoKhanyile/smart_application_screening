from app.db.models import Course, Application, User, Subject, ApplicationSubject, ScreeningResult
from app.db.models.course import CourseSubjectRequirement

def create_course_with_subjects(db, threshold=60):
    course = Course(name="TestCourse", approval_threshold=threshold)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def seed_subjects(db, names):
    subjects = []
    for name in names:
        subj = db.query(Subject).filter(Subject.name == name).first()
        if not subj:
            subj = Subject(name=name)
            db.add(subj)
            db.commit()
            db.refresh(subj)
        subjects.append(subj)
    return subjects


def make_application(db, user, course, marks):
    app = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="A",
        surname="B",
        email="a@b.com",
        phone_number="1",
        id_number="1",
        address="X",
        guardian_name="G",
        guardian_phone_number="2",
        guardian_email="g@x.com",
        status="pending",
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    for name, mark in marks.items():
        subj = db.query(Subject).filter(Subject.name == name).first()
        app_sub = ApplicationSubject(application_id=app.id, subject_id=subj.id, mark=mark)
        db.add(app_sub)
    db.commit()
    db.refresh(app)
    return app


def test_screen_application_endpoint(client, db, admin_headers, auth_headers):
    # prepare data
    course = create_course_with_subjects(db)
    subs = seed_subjects(db, ["Math", "Eng"])

    # add requirements
    for subj in subs:
        req = CourseSubjectRequirement(course_id=course.id, subject_id=subj.id, minimum_mark=0, weight=1)
        db.add(req)
    db.commit()

    user = db.query(User).filter(User.email == "test@example.com").first()
    app = make_application(db, user, course, {"Math": 80, "Eng": 80})

    # as admin call screening
    res = client.post(f"/predictions/applications/{app.id}/screen", headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["prediction_score"] >= 0
    assert body["decision"] in ["screened", "rejected"]

    # ensure ScreeningResult persisted
    record = db.query(ScreeningResult).filter(ScreeningResult.application_id == app.id).first()
    assert record is not None


def test_admin_review_and_stats(client, db, admin_headers):
    # create a sample screening result
    sr = ScreeningResult(application_id=1, prediction_score=42.0, decision="rejected", model_version="v1")
    db.add(sr)
    db.commit()

    # review it
    review_payload = {"final_decision": "reject", "admin_notes": "ok"}
    response = client.patch(f"/predictions/screening-results/{sr.id}/review", json=review_payload, headers=admin_headers)
    assert response.status_code == 200
    updated = db.query(ScreeningResult).get(sr.id)
    assert updated.reviewed_by_admin is True
    assert updated.final_decision == "reject"

    # stats endpoint
    stats = client.get("/admin/dashboard", headers=admin_headers).json()
    assert stats["total_screened"] >= 1
    assert "average_ai_score" in stats
