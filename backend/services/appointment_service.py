from datetime import datetime
from extensions import db
from models import Appointment, Doctor, Department, Patient
from utils.validators import validate_email_address, validate_phone_number


def create_appointment_service(data):
    """
    Validates appointment request parameters, checks doctor availability and booking conflicts,
    links or creates a patient record, and creates the appointment in 'pending' status.
    """
    # 1. Parse & Extract Payload
    department_identifier = data.get('department')
    doctor_identifier = data.get('selected_doctor') or data.get('doctor')
    appointment_date_str = data.get('appointment_date') or data.get('date')
    appointment_time = data.get('appointment_time') or data.get('time')
    patient_data = data.get('patientDetails') or data.get('patient', {})

    reason = data.get('reason') or patient_data.get('reason', 'General Consultation')
    appointment_type = data.get('appointment_type', 'General Checkup')

    # Extract Patient Details
    first_name = patient_data.get('firstName') or patient_data.get('first_name', '')
    last_name = patient_data.get('lastName') or patient_data.get('last_name', '')
    email = patient_data.get('email', '')
    phone = patient_data.get('phone', '')
    dob_str = patient_data.get('dob')
    gender = patient_data.get('gender')
    address = patient_data.get('address')

    # 2. Field Presence Validation
    if not department_identifier:
        return {"success": False, "message": "Department selection is required."}, 422
    if not doctor_identifier:
        return {"success": False, "message": "Doctor selection is required."}, 422
    if not appointment_date_str or not appointment_time:
        return {"success": False, "message": "Appointment date and time are required."}, 422
    if not first_name.strip() or not last_name.strip():
        return {"success": False, "message": "Patient first name and last name are required."}, 422
    if not email.strip() or not validate_email_address(email):
        return {"success": False, "message": "A valid patient email address is required."}, 422
    if not phone.strip() or not validate_phone_number(phone):
        return {"success": False, "message": "A valid patient phone number is required."}, 422

    # 3. Validate Date
    try:
        if isinstance(appointment_date_str, str):
            # Try common date string formats
            try:
                parsed_date = datetime.strptime(appointment_date_str, '%Y-%m-%d').date()
            except ValueError:
                parsed_date = datetime.strptime(appointment_date_str, '%a, %b %d, %Y').date()
        else:
            parsed_date = appointment_date_str

        if parsed_date < datetime.utcnow().date():
            return {"success": False, "message": "Appointment date cannot be in the past."}, 422
    except (ValueError, TypeError):
        return {"success": False, "message": "Invalid date format provided."}, 422

    # Parse Optional Date of Birth
    parsed_dob = None
    if dob_str:
        try:
            parsed_dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            pass

    # 4. Department Verification
    department = None
    if str(department_identifier).isdigit():
        department = Department.query.filter_by(id=int(department_identifier), is_active=True).first()
    else:
        department = Department.query.filter_by(name=str(department_identifier), is_active=True).first()

    if not department:
        return {"success": False, "message": "Selected medical department was not found or is inactive."}, 404

    # 5. Doctor Verification
    doctor = None
    if str(doctor_identifier).isdigit():
        doctor = Doctor.query.filter_by(id=int(doctor_identifier), is_active=True).first()
    else:
        doctor = Doctor.query.filter_by(name=str(doctor_identifier), is_active=True).first()

    if not doctor:
        return {"success": False, "message": "Selected doctor was not found or is inactive."}, 404

    # 6. Verify Doctor Belongs to Selected Department
    if doctor.department_id != department.id:
        return {
            "success": False,
            "message": f"Dr. {doctor.name} does not belong to the {department.name} department."
        }, 400

    # 7. Check for Double-Booking Conflicts
    existing_conflict = Appointment.query.filter_by(
        doctor_id=doctor.id,
        appointment_date=parsed_date,
        appointment_time=appointment_time
    ).filter(
        Appointment.status.in_(['pending', 'confirmed'])
    ).first()

    if existing_conflict:
        return {
            "success": False,
            "message": f"Dr. {doctor.name} is not available at {appointment_time} on {parsed_date.isoformat()}. Please select another time slot."
        }, 409

    try:
        # 8. Resolve or Create Patient Record
        patient = Patient.query.filter_by(email=email.strip().lower()).first()
        if not patient:
            patient = Patient(
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                email=email.strip().lower(),
                phone=phone.strip(),
                dob=parsed_dob,
                gender=gender,
                address=address
            )
            db.session.add(patient)
            db.session.flush()  # Flush to obtain patient.id
        else:
            # Update patient profile info if changed
            patient.first_name = first_name.strip()
            patient.last_name = last_name.strip()
            patient.phone = phone.strip()

        # 9. Create Appointment
        new_appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor.id,
            department_id=department.id,
            appointment_date=parsed_date,
            appointment_time=appointment_time,
            reason=reason,
            appointment_type=appointment_type,
            status='pending'
        )

        db.session.add(new_appointment)
        db.session.commit()

        return {
            "success": True,
            "message": "Appointment request created successfully.",
            "appointment": {
                "id": new_appointment.id,
                "status": new_appointment.status,
                "date": new_appointment.appointment_date.isoformat(),
                "time": new_appointment.appointment_time,
                "doctor_name": doctor.name,
                "department_name": department.name
            }
        }, 201

    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "message": "A database error occurred while creating your appointment."
        }, 500


def get_appointment_by_id_service(appointment_id):
    """Retrieves appointment information by primary key."""
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return {"success": False, "message": "Appointment not found."}, 404

    return {
        "success": True,
        "message": "Appointment retrieved successfully.",
        "data": appointment.to_dict()
    }, 200