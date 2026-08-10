from flask import Blueprint, jsonify
from models import Department

departments_bp = Blueprint('departments', __name__)


@departments_bp.route('', methods=['GET'])
def get_departments():
    """Retrieve all active medical departments."""
    try:
        departments = Department.query.filter_by(is_active=True).all()
        departments_data = [dept.to_dict() for dept in departments]

        return jsonify({
            "success": True,
            "message": "Departments retrieved successfully.",
            "data": departments_data
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching departments."
        }), 500


@departments_bp.route('/<int:department_id>', methods=['GET'])
def get_department(department_id):
    """Retrieve details for a single department by ID."""
    try:
        department = Department.query.get(department_id)

        if not department or not department.is_active:
            return jsonify({
                "success": False,
                "message": "Department not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Department details retrieved successfully.",
            "data": department.to_dict()
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()

        return {
            "success": False,
            "message": str(e)
        }, 500