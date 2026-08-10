import jwt
from datetime import datetime, timedelta
from flask import current_app
from extensions import db
from models import User, Patient
from utils.validators import validate_email_address, validate_password_strength


def generate_token(user_id, role):
    """Generates a signed JWT access token for an authenticated user."""
    payload = {
        'sub': user_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=24))
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')


def register_user_service(data):
    """Handles patient account registration and creates linked patient profile."""
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = data.get('phone', '').strip()

    # Validations
    if not email or not password or not first_name or not last_name or not phone:
        return {"success": False, "message": "All fields (first_name, last_name, email, phone, password) are required."}, 422

    if not validate_email_address(email):
        return {"success": False, "message": "Please enter a valid email address."}, 422

    is_password_valid, msg = validate_password_strength(password)
    if not is_password_valid:
        return {"success": False, "message": msg}, 422

    # Check for duplicate user
    if User.query.filter_by(email=email).first():
        return {"success": False, "message": "An account with this email address already exists."}, 409

    try:
        # Create User account
        new_user = User(email=email, role='patient')
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.flush()

        # Check if patient record exists by email or create new
        patient = Patient.query.filter_by(email=email).first()
        if patient:
            patient.user_id = new_user.id
            patient.first_name = first_name
            patient.last_name = last_name
            patient.phone = phone
        else:
            patient = Patient(
                user_id=new_user.id,
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone
            )
            db.session.add(patient)

        db.session.commit()

        token = generate_token(new_user.id, new_user.role)

        return {
            "success": True,
            "message": "User registered successfully.",
            "token": token,
            "user": new_user.to_dict()
        }, 201

    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": "An error occurred during registration."}, 500


def login_user_service(data):
    """Authenticates user credentials and returns a JWT access token."""
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return {"success": False, "message": "Email and password are required."}, 422

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return {"success": False, "message": "Invalid email or password."}, 401

    if not user.is_active:
        return {"success": False, "message": "Account is disabled. Please contact administrator."}, 403

    token = generate_token(user.id, user.role)

    return {
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": user.to_dict()
    }, 200


def get_current_user_service(current_user):
    """Fetches details of the authenticated user and associated profile info."""
    user_data = current_user.to_dict()

    if current_user.role == 'patient' and current_user.patient_profile:
        user_data['patient_profile'] = current_user.patient_profile.to_dict()
    elif current_user.role == 'doctor' and current_user.doctor_profile:
        user_data['doctor_profile'] = current_user.doctor_profile.to_dict()

    return {
        "success": True,
        "message": "User profile retrieved successfully.",
        "data": user_data
    }, 200