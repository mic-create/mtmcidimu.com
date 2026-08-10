import re

# Regular expression for email validation
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

# Regular expression for phone number validation (supports international and local formats)
PHONE_REGEX = re.compile(r'^\+?[0-9]{7,15}$')


def validate_email_address(email: str) -> bool:
    """Validates if the provided string is a properly formatted email address."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))


def validate_phone_number(phone: str) -> bool:
    """Validates phone number format."""
    if not phone or not isinstance(phone, str):
        return False
    clean_phone = phone.strip().replace(" ", "").replace("-", "")
    return bool(PHONE_REGEX.match(clean_phone))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates password strength requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."

    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."

    return True, "Password meets strength requirements."