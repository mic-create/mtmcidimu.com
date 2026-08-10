from flask import Blueprint, request, jsonify
from extensions import db
from models import Appointment, Doctor, Department
from utils.security import token_required, admin_required

admin_bp = Blueprint('admin', __name__)


# ============================================================================
# APPOINTMENT MANAGEMENT
# ============================================================================

@admin_bp.route('/appointments', methods=['GET'])
@token_required
@admin_required
def get_all_appointments(current_user):
    """Retrieve all appointment bookings across all departments."""
    try:
        status_filter = request.args.get('status')
        query = Appointment.query

        if status_filter:
            query = query.filter_by(status=status_filter)

        appointments = query.order_by(Appointment.created_at.desc()).all()
        appointments_data = [app.to_dict() for app in appointments]

        return jsonify({
            "success": True,
            "message": "Appointments retrieved successfully.",
            "data": appointments_data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching appointments."
        }), 500


@admin_bp.route('/appointments/<int:appointment_id>', methods=['PATCH'])
@token_required
@admin_required
def update_appointment_status(current_user, appointment_id):
    """Update status of a specific appointment (e.g., pending -> confirmed, rejected, completed, cancelled)."""
    try:
        appointment = Appointment.query.get(appointment_id)
        if not appointment:
            return jsonify({
                "success": False,
                "message": "Appointment not found."
            }), 404

        data = request.get_json() or {}
        new_status = data.get('status')

        valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
        if not new_status or new_status not in valid_statuses:
            return jsonify({
                "success": False,
                "message": f"Invalid status. Allowed values: {', '.join(valid_statuses)}"
            }), 422

        appointment.status = new_status
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Appointment status updated to '{new_status}'.",
            "data": appointment.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while updating appointment status."
        }), 500


# ============================================================================
# DOCTOR MANAGEMENT
# ============================================================================

@admin_bp.route('/doctors', methods=['GET'])
@token_required
@admin_required
def get_all_doctors_admin(current_user):
    """Retrieve list of all doctors including inactive profiles."""
    try:
        doctors = Doctor.query.all()
        doctors_data = [doc.to_dict() for doc in doctors]

        return jsonify({
            "success": True,
            "message": "Doctors retrieved successfully.",
            "data": doctors_data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching doctors."
        }), 500


@admin_bp.route('/doctors', methods=['POST'])
@token_required
@admin_required
def add_doctor(current_user):
    """Add a new doctor to the system."""
    try:
        data = request.get_json() or {}

        name = data.get('name', '').strip()
        specialty = data.get('specialty', '').strip()
        department_id = data.get('department_id')

        if not name or not specialty or not department_id:
            return jsonify({
                "success": False,
                "message": "Name, specialty, and department_id are required fields."
            }), 422

        # Verify department exists
        department = Department.query.get(department_id)
        if not department:
            return jsonify({
                "success": False,
                "message": "Specified department does not exist."
            }), 404

        new_doctor = Doctor(
            name=name,
            specialty=specialty,
            department_id=department_id,
            biography=data.get('biography', '').strip(),
            experience=data.get('experience', '').strip(),
            qualifications=data.get('qualifications', '').strip(),
            profile_image=data.get('profile_image', '').strip(),
            availability=data.get('availability', 'Mon-Fri: 9am-4pm').strip(),
            is_active=data.get('is_active', True)
        )

        db.session.add(new_doctor)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Doctor added successfully.",
            "data": new_doctor.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while adding doctor."
        }), 500


@admin_bp.route('/doctors/<int:doctor_id>', methods=['PATCH'])
@token_required
@admin_required
def update_doctor(current_user, doctor_id):
    """Update details or active status of a doctor."""
    try:
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({
                "success": False,
                "message": "Doctor not found."
            }), 404

        data = request.get_json() or {}

        if 'name' in data:
            doctor.name = data['name'].strip()
        if 'specialty' in data:
            doctor.specialty = data['specialty'].strip()
        if 'department_id' in data:
            dept = Department.query.get(data['department_id'])
            if not dept:
                return jsonify({"success": False, "message": "Department not found."}), 404
            doctor.department_id = data['department_id']
        if 'biography' in data:
            doctor.biography = data['biography'].strip()
        if 'experience' in data:
            doctor.experience = data['experience'].strip()
        if 'qualifications' in data:
            doctor.qualifications = data['qualifications'].strip()
        if 'availability' in data:
            doctor.availability = data['availability'].strip()
        if 'is_active' in data:
            doctor.is_active = bool(data['is_active'])

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Doctor updated successfully.",
            "data": doctor.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while updating doctor profile."
        }), 500


# ============================================================================
# DEPARTMENT MANAGEMENT
# ============================================================================

@admin_bp.route('/departments', methods=['GET'])
@token_required
@admin_required
def get_all_departments_admin(current_user):
    """Retrieve all departments including inactive ones."""
    try:
        departments = Department.query.all()
        return jsonify({
            "success": True,
            "message": "Departments retrieved successfully.",
            "data": [dept.to_dict() for dept in departments]
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching departments."
        }), 500


@admin_bp.route('/departments', methods=['POST'])
@token_required
@admin_required
def add_department(current_user):
    """Create a new medical department."""
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()

        if not name:
            return jsonify({
                "success": False,
                "message": "Department name is required."
            }), 422

        existing_dept = Department.query.filter_by(name=name).first()
        if existing_dept:
            return jsonify({
                "success": False,
                "message": "A department with this name already exists."
            }), 409

        new_dept = Department(
            name=name,
            description=data.get('description', '').strip(),
            image=data.get('image', '').strip(),
            is_active=data.get('is_active', True)
        )

        db.session.add(new_dept)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Department created successfully.",
            "data": new_dept.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while creating department."
        }), 500


@admin_bp.route('/departments/<int:department_id>', methods=['PATCH'])
@token_required
@admin_required
def update_department(current_user, department_id):
    """Update details or status of a department."""
    try:
        department = Department.query.get(department_id)
        if not department:
            return jsonify({
                "success": False,
                "message": "Department not found."
            }), 404

        data = request.get_json() or {}

        if 'name' in data:
            department.name = data['name'].strip()
        if 'description' in data:
            department.description = data['description'].strip()
        if 'image' in data:
            department.image = data['image'].strip()
        if 'is_active' in data:
            department.is_active = bool(data['is_active'])

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Department updated successfully.",
            "data": department.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while updating department."
        }), 500