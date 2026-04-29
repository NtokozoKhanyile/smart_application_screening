from app.db.models import Course, Application, User
from app.db.models.application import ApplicationStatus

def test_application_full_name_hybrid_property(db):
    app = Application(
        first_name="John",
        middle_name="Quincy",
        surname="Adams",
        email="john@example.com",
        phone_number="123",
        id_number="123",
        address="123",
        guardian_name="Jane",
        guardian_phone_number="123",
        user_id=1,
        course_id=1
    )
    assert app.full_name == "John Quincy Adams"
    
    app2 = Application(
        first_name="Jane",
        middle_name=None,
        surname="Doe",
        email="jane@example.com",
        phone_number="123",
        id_number="123",
        address="123",
        guardian_name="Bob",
        guardian_phone_number="123",
        user_id=1,
        course_id=1
    )
    assert app2.full_name == "Jane Doe"

def test_get_my_application_stats(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()

    # Create a test course
    course = Course(name="Test Course", approval_threshold=60)
    db.add(course)
    db.commit()

    # Create applications with different statuses
    app1 = Application(
        user_id=user.id, course_id=course.id, first_name="A", surname="B", 
        email="a@b.com", phone_number="1", id_number="1", address="1",
        guardian_name="G", guardian_phone_number="1", status=ApplicationStatus.draft
    )
    app2 = Application(
        user_id=user.id, course_id=course.id, first_name="C", surname="D", 
        email="c@d.com", phone_number="2", id_number="2", address="2",
        guardian_name="G2", guardian_phone_number="2", status=ApplicationStatus.recommended
    )
    db.add_all([app1, app2])
    db.commit()

    response = client.get("/applications/stats/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["total"] == 2
    assert data["draft"] == 1
    assert data["recommended"] == 1
    assert data["under_review"] == 0

def test_application_response_includes_full_name(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()
    course = Course(name="Test Course", approval_threshold=60)
    db.add(course)
    db.commit()

    app = Application(
        user_id=user.id, course_id=course.id, first_name="John", middle_name="M", surname="Doe", 
        email="john@doe.com", phone_number="1", id_number="1", address="1",
        guardian_name="G", guardian_phone_number="1", status=ApplicationStatus.draft
    )
    db.add(app)
    db.commit()

    response = client.get(f"/applications/{app.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "John M Doe"
