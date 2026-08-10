from app import app
from extensions import db
from models import Department, Doctor


def seed_database():
    with app.app_context():

        # -----------------------------
        # Departments
        # -----------------------------
        departments = [
            {
                "name": "General Medicine",
                "description": "Comprehensive diagnosis and treatment for common medical conditions."
            },
            {
                "name": "Cardiology",
                "description": "Diagnosis and treatment of heart and cardiovascular conditions."
            },
            {
                "name": "Pediatrics",
                "description": "Medical care for infants, children and adolescents."
            },
            {
                "name": "Obstetrics & Gynaecology",
                "description": "Women's reproductive health, pregnancy and maternity care."
            },
            {
                "name": "Surgery",
                "description": "Surgical consultation and treatment."
            }
        ]

        department_objects = {}

        for data in departments:
            department = Department.query.filter_by(
                name=data["name"]
            ).first()

            if not department:
                department = Department(
                    name=data["name"],
                    description=data["description"],
                    is_active=True
                )

                db.session.add(department)
                db.session.flush()

            department_objects[data["name"]] = department

        # -----------------------------
        # Doctors
        # -----------------------------
        doctors = [
            {
                "name": "Dr. Michael Adeyemi",
                "specialty": "General Physician",
                "department": "General Medicine"
            },
            {
                "name": "Dr. Sarah Okafor",
                "specialty": "Cardiologist",
                "department": "Cardiology"
            },
            {
                "name": "Dr. David Williams",
                "specialty": "Pediatrician",
                "department": "Pediatrics"
            },
            {
                "name": "Dr. Grace Eze",
                "specialty": "Obstetrician & Gynaecologist",
                "department": "Obstetrics & Gynaecology"
            },
            {
                "name": "Dr. Daniel Ibrahim",
                "specialty": "General Surgeon",
                "department": "Surgery"
            }
        ]

        for data in doctors:
            existing_doctor = Doctor.query.filter_by(
                name=data["name"]
            ).first()

            if not existing_doctor:
                doctor = Doctor(
                    name=data["name"],
                    specialty=data["specialty"],
                    department_id=department_objects[
                        data["department"]
                    ].id,
                    is_active=True
                )

                db.session.add(doctor)

        db.session.commit()

        print("DATABASE SEEDING SUCCESSFUL")
        print()
        print("Departments:")
        for department in Department.query.all():
            print(
                f"  {department.id}: "
                f"{department.name}"
            )

        print()
        print("Doctors:")
        for doctor in Doctor.query.all():
            print(
                f"  {doctor.id}: "
                f"{doctor.name} "
                f"({doctor.specialty}) "
                f"Department ID: {doctor.department_id}"
            )


if __name__ == "__main__":
    seed_database()