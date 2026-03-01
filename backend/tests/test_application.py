from app.db.models import Course, Application, User, ApplicationSubject, Subject
from app.db.models.course import CourseSubjectRequirement
from passlib.context import CryptContext
from app.services.scoring_engine import evaluate_application


def test_create_application(client, auth_headers, db):

    # Create a test course
    course = Course(
        name="BSc Computer Science",
        approval_threshold=60
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    payload = {
        "first_name": "John", 
        "middle_name": "A", 
        "surname": "Doe", 
        "email": "john@example.com", 
        "phone_number": "+27123456789", 
        "id_number": "0000000000000", 
        "address": "Somewhere", 
        "course_id": course.id, 
        "guardian_name": "Jane Doe", 
        "guardian_phone_number": "+27111111111", 
        "guardian_email": "guardian@example.com", 
        "subjects": []
    }

    response = client.post("/applications/", json=payload, headers=auth_headers)
    assert response.status_code in [200, 201]

def test_get_my_applications(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()

    # Create a test course
    course = Course(
        name="BSc Information Technology", approval_threshold=60
        )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Create two test application for the user
    app1 = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="John",
        middle_name="A",
        surname="Doe",
        email="john.doe@example.com",
        phone_number="1234567890",
        id_number="0000000000001",
        address="123 Main St",
        guardian_name="Jane Doe",
        guardian_phone_number="0987654321",
        guardian_email="jane.doe@example.com",
        status="draft",
    )

    app2 = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="John",
        middle_name="A",
        surname="Doe",
        email="john.doe2@example.com",
        phone_number="1234567890",
        id_number="0000000000002",
        address="123 Main St",
        guardian_name="Jane Doe",
        guardian_phone_number="0987654321",
        guardian_email="jane.doe@example.com",
        status="draft",
    )

    db.add_all([app1, app2])
    db.commit()

    # Make the API call to get applications
    response = client.get("/applications/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 2
    
    for app in data:
        assert app["user_id"] == user.id
        assert app["course_id"] == course.id

def test_submit_application_without_subjects(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()

    # Create a test course and an application
    course = Course(
        name="BSc Information Technology", approval_threshold=60
        )
    db.add(course)
    db.commit()
    db.refresh(course)

    application = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="Alice",
        middle_name="B",
        surname="Smith",
        email="alice.smith@example.com",
        phone_number="1234567890",
        id_number="0000000000003",
        address="456 Oak St",
        guardian_name="Bob Smith",
        guardian_phone_number="9876543210",
        guardian_email="bob.smith@example.com",
        status="draft",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Make the API call to submit the application
    response = client.post(f"/applications/{application.id}/submit", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == application.id
    assert data["status"] == "rejected"

def test_submit_application_with_subjects(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()

    # Create test subjects
    math_subject = Subject(name="Mathematics")
    physics_subject = Subject(name="Physics")
    chemistry_subject = Subject(name="Chemistry")
    db.add_all([math_subject, physics_subject, chemistry_subject])
    db.commit()
    db.refresh(math_subject)
    db.refresh(physics_subject)
    db.refresh(chemistry_subject)

    # Create a test course with approval threshold
    course = Course(
        name="BSc Information Technology", approval_threshold=60
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Add subject requirements to the course
    # Minimum marks: 50 for each subject, weights: equal distribution
    math_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=math_subject.id,
        minimum_mark=50,
        weight=1
    )
    physics_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=physics_subject.id,
        minimum_mark=50,
        weight=1
    )
    chemistry_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=chemistry_subject.id,
        minimum_mark=50,
        weight=1
    )
    db.add_all([math_req, physics_req, chemistry_req])
    db.commit()

    # Create a test application with subjects
    application = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="Alice",
        middle_name="B",
        surname="Smith",
        email="alice.smith@example.com",
        phone_number="1234567890",
        id_number="0000000000003",
        address="456 Oak St",
        guardian_name="Bob Smith",
        guardian_phone_number="9876543210",
        guardian_email="bob.smith@example.com",
        status="draft",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Add subjects to the application with marks that meet requirements
    subject_marks = [
        (math_subject.id, 75),
        (physics_subject.id, 80),
        (chemistry_subject.id, 70)
    ]

    for subject_id, mark in subject_marks:
        app_subject = ApplicationSubject(
            application_id=application.id,
            subject_id=subject_id,
            mark=mark
        )
        db.add(app_subject)
    db.commit()

    # Make the API call to submit the application
    response = client.post(f"/applications/{application.id}/submit", headers=auth_headers)
    assert response.status_code == 200
    data = response.json() 
    assert data["id"] == application.id
    assert data["status"] == "screened"

def test_submit_application_with_subjects_below_threshold(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()
    # Create test subjects
    math_subject = Subject(name="Mathematics")
    physics_subject = Subject(name="Physics")
    chemistry_subject = Subject(name="Chemistry")
    db.add_all([math_subject, physics_subject, chemistry_subject])
    db.commit()
    db.refresh(math_subject)
    db.refresh(physics_subject)
    db.refresh(chemistry_subject)

    # Create a test course with approval threshold
    course = Course(
        name="BSc Information Technology", approval_threshold=60
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Add subject requirements to the course
    # Minimum marks: 50 for each subject, weights: equal distribution
    math_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=math_subject.id,
        minimum_mark=50,
        weight=1
    )
    physics_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=physics_subject.id,
        minimum_mark=50,
        weight=1
    )
    chemistry_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=chemistry_subject.id,
        minimum_mark=50,
        weight=1
    )
    db.add_all([math_req, physics_req, chemistry_req])
    db.commit()

    # Create a test application with subjects
    application = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="Alice",
        middle_name="B",
        surname="Smith",
        email="alice.smith@example.com",
        phone_number="1234567890",
        id_number="0000000000003",
        address="456 Oak St",
        guardian_name="Bob Smith",
        guardian_phone_number="9876543210",
        guardian_email="bob.smith@example.com",
        status="draft",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Add subjects to the application with marks that meet requirements
    subject_marks = [
        (math_subject.id, 25),
        (physics_subject.id, 40),
        (chemistry_subject.id, 20)
    ]

    for subject_id, mark in subject_marks:
        app_subject = ApplicationSubject(
            application_id=application.id,
            subject_id=subject_id,
            mark=mark
        )
        db.add(app_subject)
    db.commit()

    # Make the API call to submit the application
    response = client.post(f"/applications/{application.id}/submit", headers=auth_headers)
    assert response.status_code == 200
    data = response.json() 
    assert data["id"] == application.id
    assert data["status"] == "rejected"
    
def test_submit_application_with_subjects_near_threshold(client, auth_headers, db):
    # Get the logged-in User
    user = db.query(User).filter(User.email == "test@example.com").first()
    # Create test subjects
    math_subject = Subject(name="Mathematics")
    physics_subject = Subject(name="Physics")
    chemistry_subject = Subject(name="Chemistry")
    db.add_all([math_subject, physics_subject, chemistry_subject])
    db.commit()
    db.refresh(math_subject)
    db.refresh(physics_subject)
    db.refresh(chemistry_subject)

    # Create a test course with approval threshold
    course = Course(
        name="BSc Information Technology", approval_threshold=60
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Add subject requirements to the course
    # Minimum marks: 50 for each subject, weights: equal distribution
    math_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=math_subject.id,
        minimum_mark=50,
        weight=1
    )
    physics_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=physics_subject.id,
        minimum_mark=50,
        weight=1
    )
    chemistry_req = CourseSubjectRequirement(
        course_id=course.id,
        subject_id=chemistry_subject.id,
        minimum_mark=50,
        weight=1
    )

    db.add_all([math_req, physics_req, chemistry_req])
    db.commit()
    db.refresh(math_req)
    db.refresh(physics_req)
    db.refresh(chemistry_req)

    # Create a test application with subjects
    application = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="Alice",
        middle_name="B",
        surname="Smith",
        email="alice.smith@example.com",
        phone_number="1234567890",
        id_number="0000000000003",
        address="456 Oak St",
        guardian_name="Bob Smith",
        guardian_phone_number="9876543210",
        guardian_email="bob.smith@example.com",
        status="draft",
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    # Add subjects to the application with marks that are near the threshold
    subject_marks = [
        (math_subject.id, 55),
        (physics_subject.id, 60),
        (chemistry_subject.id, 58)
    ]
    
    for subject_id, mark in subject_marks:
        app_subject = ApplicationSubject(
            application_id=application.id,
            subject_id=subject_id,
            mark=mark
        )
        db.add(app_subject)
    db.commit()

    # Make the API call to submit the application
    response = client.post(f"/applications/{application.id}/submit", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == application.id
    assert data["status"] == "screened"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test_admin_can_view_all_applications(client, admin_headers, db):
    # Get the admin user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    # Create a test course
    course = Course(
        name="BSc Computer Science",
        approval_threshold=60
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Create multiple applications for different users
    for i in range(3):
        user = User(
            email=f"user{i}@example.com",
            hashed_password=pwd_context.hash("Password123"),
            role="applicant"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        application = Application(
            user_id=user.id,
            course_id=course.id,
            first_name=f"User{i}",
            middle_name="",
            surname=f"Smith{i}",
            email=user.email,
            phone_number="1234567890",
            id_number=f"000000000000{i+1}",
            address=f"Address {i} St",
            guardian_name=f"Guardian {i}",
            guardian_phone_number="9876543210",
            guardian_email=f"guardian{i}@example.com",
            status="accepted"
        )
        db.add(application)
        db.commit()
        db.refresh(application)

    # Make the API call to view all applications (router prefix applies)
    response = client.get("/applications/all", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

def test_admin_can_override_application_status(client, admin_headers, db):
    # Get the admin user
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    # Create a test course
    course = Course(
        name="BSc Computer Science",
        approval_threshold=60
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Create a test application
    user = User(
        email="test@example.com",
        hashed_password=pwd_context.hash("Password123"),
        role="applicant"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    application = Application(
        user_id=user.id,
        course_id=course.id,
        first_name="Test",
        middle_name="",
        surname="User",
        email=user.email,
        phone_number="1234567890",
        id_number="0000000000001",
        address="123 Test St",
        guardian_name="Guardian User",
        guardian_phone_number="9876543210",
        guardian_email="guardian@example.com",
        status="draft"
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Make the API call to override the application status
    response = client.patch(f"/applications/{application.id}/status", json={"status": "accepted"}, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == application.id
    assert data["status"] == "accepted"
