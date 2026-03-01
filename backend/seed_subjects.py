from app.db.session import SessionLocal
from app.db.models import *

subjects = [
    "Afrikaans HL",
    "Afrikaans FAL",
    "English",
    "English HL",
    "English FAL",
    "isiZulu HL",
    "isiZulu FAL",
    "isiXhosa HL",
    "isiXhosa FAL",
    "Sepedi HL",
    "Sepedi FAL",
    "Sesotho HL",
    "Sesotho FAL",
    "Setswana HL",
    "Setswana FAL",
    "Siswati HL",
    "Siswati FAL",
    "Tshivenda HL",
    "Tshivenda FAL",
    "Xitsonga HL",
    "Xitsonga FAL",
    "isiNdebele HL",
    "isiNdebele FAL",
    "Life Orientation",
    "Mathematics",
    "Technical Mathematics",
    "Mathematics Literacy",
    "Physical Sciences",
    "Life Sciences",
    "Computer Applications Technology",
    "Information Technology",
    "Engineering Graphics & Design",
    "Agricultural Sciences",
    "Agricultural Management Practice",
    "Accounting",
    "Business Studies",
    "Economics",
    "Tourism",
    "Hospitality",
    "Consumer Studies",
    "Geography",
    "History",
    "Religion Studies",
    "Visual Arts",
    "Music",
    "Dramatic Arts",
    "Dance Studies",
    "Design Studies",
]

db = SessionLocal()

for name in subjects:
    existing = db.query(Subject).filter(Subject.name == name).first()
    if not existing:
        db.add(Subject(name=name))

db.commit()
db.close()

print("Subjects seeded successfully.")
