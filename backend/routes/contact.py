from flask import Blueprint, request, jsonify
from extensions import db
from models import ContactMessage
from utils.validators import validate_email_address

contact_bp = Blueprint('contact', __name__)


@contact_bp.route('', methods=['POST'])
def submit_contact_message():
    """Handle public contact form submission."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON payload."
            }), 400

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip() if data.get('phone') else None
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()

        # Input Validation
        if not name or not email or not subject or not message:
            return jsonify({
                "success": False,
                "message": "Name, email, subject, and message are required fields."
            }), 422

        if not validate_email_address(email):
            return jsonify({
                "success": False,
                "message": "Please provide a valid email address."
            }), 422

        # Create contact entry
        contact_entry = ContactMessage(
            name=name,
            email=email,
            phone=phone,
            subject=subject,
            message=message,
            status='unread'
        )

        db.session.add(contact_entry)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Your message has been received. We will get back to you shortly."
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": "An error occurred while sending your message. Please try again."
        }), 500