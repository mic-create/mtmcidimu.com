from flask import Blueprint, request, jsonify
from models import Patient, Appointment
from utils.security import token_required

patients_bp = Blueprint('patients', __name__)


@patients_bp.route('/me', methods=['GET'])
@token_required
def get_patient_profile(current_user):
    """Retrieve the profile of the currently logged-in patient."""
    try:
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({
                "success": False,
                "message": "Patient profile not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Profile retrieved successfully.",
            "data": patient.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching patient profile."
        }), 500


@patients_bp.route('/me', methods=['PUT', 'PATCH'])
@token_required
def update_patient_profile(current_user):
    """Update profile details for the currently logged-in patient."""
    try:
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({
                "success": False,
                "message": "Patient profile not found."
            }), 404

        data = request.get_json() or {}

        # Allow update of non-critical profile fields
        if 'first_name' in data:
            patient.first_name = data['first_name'].strip()
        if 'last_name' in data:
            patient.last_name = data['last_name'].strip()
        if 'phone' in data:
            patient.phone = data['phone'].strip()
        if 'gender' in data:
            patient.gender = data['gender']
        if 'address' in data:
            patient.address = data['address'].strip()

        from extensions import db
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Patient profile updated successfully.",
            "data": patient.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while updating profile."
        }), 500


@patients_bp.route('/me/appointments', methods=['GET'])
@token_required
def get_patient_appointments(current_user):
    """
    Retrieve all appointments belonging ONLY to the currently logged-in patient.
    Prevents cross-patient data access.
    """
    try:
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({
                "success": False,
                "message": "Patient profile not found."
            }), 404

        appointments = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.created_at.desc()).all()
        appointments_data = [app.to_dict() for app in appointments]

        return jsonify({
            "success": True,
            "message": "Patient appointments retrieved successfully.",
            "data": appointments_data
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching appointments."
        }), 500