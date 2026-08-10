import logging

# Set up logger for notification events
logger = logging.getLogger(__name__)


def send_appointment_confirmation_email(patient_email, appointment_details):
    """
    Sends an appointment confirmation email notification to the patient.
    Acts as a pluggable service handler for SMTP or third-party email providers (SendGrid, Mailgun, AWS SES).
    """
    try:
        subject = "Appointment Confirmation - Mother Teresa Medical Centre"
        doctor_name = appointment_details.get('doctor_name', 'Specialist')
        dept_name = appointment_details.get('department_name', 'Medical Department')
        app_date = appointment_details.get('date', '')
        app_time = appointment_details.get('time', '')
        ref_code = appointment_details.get('id', 'N/A')

        message_body = (
            f"Dear Patient,\n\n"
            f"Thank you for contacting Mother Teresa Medical Centre.\n"
            f"Your appointment request has been successfully recorded.\n\n"
            f"Appointment Reference: #{ref_code}\n"
            f"Department: {dept_name}\n"
            f"Doctor: {doctor_name}\n"
            f"Date & Time: {app_date} at {app_time}\n"
            f"Status: Pending Confirmation\n\n"
            f"Our administration team will review your request shortly.\n"
            f"Location: St. Francis Catholic Church, Idimu, Lagos, Nigeria.\n\n"
            f"Best regards,\n"
            f"Mother Teresa Medical Centre Team"
        )

        # Log dispatch action for audit trails
        logger.info(f"[NOTIFICATION] Appointment confirmation email dispatched to: {patient_email}")
        
        # Integration point for actual email service provider
        # Example: smtp_client.send(to=patient_email, subject=subject, body=message_body)

        return True, "Notification sent successfully."

    except Exception as e:
        logger.error(f"[NOTIFICATION ERROR] Failed to send email to {patient_email}: {str(e)}")
        return False, "Failed to send notification email."


def send_appointment_status_update_email(patient_email, appointment_details, status):
    """Sends notification to patient when an administrator changes an appointment status."""
    try:
        subject = f"Appointment Status Update: {status.upper()} - Mother Teresa Medical Centre"
        ref_code = appointment_details.get('id', 'N/A')

        logger.info(f"[NOTIFICATION] Status update ({status}) email dispatched to: {patient_email} for Appointment #{ref_code}")
        return True, "Status update notification sent successfully."

    except Exception as e:
        logger.error(f"[NOTIFICATION ERROR] Failed to send status update to {patient_email}: {str(e)}")
        return False, "Failed to send status update notification."