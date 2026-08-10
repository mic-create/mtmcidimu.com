import jwt
from functools import wraps
from flask import request, jsonify, current_app
from models import User


def token_required(f):
    """
    Decorator to protect routes requiring JWT authentication.
    Extracts Bearer token from the Authorization header and attaches the User object.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Check for Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({
                "success": False,
                "message": "Authorization token is missing."
            }), 401

        try:
            # Decode JWT
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )

            # Retrieve user
            user_id = payload.get('sub')
            current_user = User.query.get(user_id)

            if not current_user or not current_user.is_active:
                return jsonify({
                    "success": False,
                    "message": "User account is invalid or inactive."
                }), 401

        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Token has expired. Please log in again."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid authentication token."
            }), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """
    Decorator to restrict route access strictly to users with the 'admin' role.
    Must be used in combination with @token_required.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({
                "success": False,
                "message": "Access denied. Administrator privileges required."
            }), 403

        return f(current_user, *args, **kwargs)

    return decorated