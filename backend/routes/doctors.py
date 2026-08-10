from flask import Blueprint, jsonify, request
from models import Doctor

doctors_bp = Blueprint('doctors', __name__)


@doctors_bp.route('', methods=['GET'])
def get_doctors():
    """Retrieve all active doctors with optional department filtering."""
    try:
        department_id = request.args.get('department_id', type=int)

        query = Doctor.query.filter_by(is_active=True)
        if department_id:
            query = query.filter_by(department_id=department_id)

        doctors = query.all()
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


@doctors_bp.route('/<int:doctor_id>', methods=['GET'])
def get_doctor(doctor_id):
    """Retrieve details for a single doctor by ID."""
    try:
        doctor = Doctor.query.get(doctor_id)

        if not doctor or not doctor.is_active:
            return jsonify({
                "success": False,
                "message": "Doctor not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Doctor details retrieved successfully.",
            "data": doctor.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching doctor details."
        }), 500


@doctors_bp.route('/<int:doctor_id>/availability', methods=['GET'])
def get_doctor_availability(doctor_id):
    """Retrieve availability schedule for a specific doctor."""
    try:
        doctor = Doctor.query.get(doctor_id)

        if not doctor or not doctor.is_active:
            return jsonify({
                "success": False,
                "message": "Doctor not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Doctor availability retrieved successfully.",
            "data": {
                "doctor_id": doctor.id,
                "doctor_name": doctor.name,
                "availability": doctor.availability
            }
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching doctor availability."
        }), 500