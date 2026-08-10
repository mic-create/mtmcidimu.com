from flask import Blueprint, request, jsonify
from services.auth_service import (
    register_user_service,
    login_user_service,
    get_current_user_service
)
from utils.security import token_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new patient account."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON payload."
            }), 400

        result, status_code = register_user_service(data)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred during registration."
        }), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user credentials and issue JWT access token."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON payload."
            }), 400

        result, status_code = login_user_service(data)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred during login."
        }), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Retrieve currently authenticated user profile."""
    try:
        result, status_code = get_current_user_service(current_user)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "An error occurred while fetching user profile."
        }), 500


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """
    Client-side logout acknowledgement endpoint.
    Stateless JWT tokens are invalidated client-side by dropping the token.
    """
    return jsonify({
        "success": True,
        "message": "Successfully logged out."
    }), 200