from flask import Blueprint, request, jsonify
from services.appointment_service import create_appointment_service, get_appointment_by_id_service

appointments_bp = Blueprint('appointments', __name__)


@appointments_bp.route('', methods=['POST'])
def create_appointment():
    """
    Handle appointment booking requests from the frontend form.
    Validates patient information, doctor/department selection, date/time,
    and checks for booking conflicts.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON payload."
            }), 400

        result, status_code = create_appointment_service(data)
        return jsonify(result), status_code

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An unexpected error occurred while processing your appointment request."
        }), 500


@appointments_bp.route('/<int:appointment_id>', methods=['GET'])
def get_appointment(appointment_id):
    """Retrieve appointment summary by appointment ID."""
    try:
        result, status_code = get_appointment_by_id_service(appointment_id)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching appointment details."
        }), 500