from datetime import datetime
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    """User Model for authentication and authorization."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='patient')  # patient, doctor, admin, staff
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient_profile = db.relationship('Patient', backref='user', uselist=False, cascade='all, delete-orphan')
    doctor_profile = db.relationship('Doctor', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and store password safely."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verify hashed password."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Serialize User object."""
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }


class Department(db.Model):
    """Hospital Department Model."""
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    doctors = db.relationship('Doctor', backref='department', lazy='dynamic')
    appointments = db.relationship('Appointment', backref='department', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "image": self.image,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }


class Doctor(db.Model):
    """Doctor Profile Model."""
    __tablename__ = 'doctors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    
    name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    biography = db.Column(db.Text, nullable=True)
    experience = db.Column(db.String(50), nullable=True)  # e.g., "10+ Years"
    qualifications = db.Column(db.String(255), nullable=True)  # e.g., "MBBS, FWACS"
    profile_image = db.Column(db.String(255), nullable=True)
    availability = db.Column(db.Text, nullable=True)  # e.g., "Mon-Fri: 9am-4pm"
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='doctor', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "name": self.name,
            "specialty": self.specialty,
            "biography": self.biography,
            "experience": self.experience,
            "qualifications": self.qualifications,
            "profile_image": self.profile_image,
            "availability": self.availability,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }


class Patient(db.Model):
    """Patient Profile Model."""
    __tablename__ = 'patients'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    dob = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='patient', lazy='dynamic')

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "dob": self.dob.isoformat() if self.dob else None,
            "gender": self.gender,
            "address": self.address,
            "created_at": self.created_at.isoformat()
        }


class Appointment(db.Model):
    """Appointment Booking Model."""
    __tablename__ = 'appointments'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)

    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.String(20), nullable=False)
    reason = db.Column(db.Text, nullable=True)
    appointment_type = db.Column(db.String(50), default='General Checkup')
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, completed, cancelled, rejected
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": f"{self.patient.first_name} {self.patient.last_name}" if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.name if self.doctor else None,
            "department_id": self.department_id,
            "department_name": self.department.name if self.department else None,
            "appointment_date": self.appointment_date.isoformat(),
            "appointment_time": self.appointment_time,
            "reason": self.reason,
            "appointment_type": self.appointment_type,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


class ContactMessage(db.Model):
    """Contact Form Submissions Model."""
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    subject = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='unread')  # unread, read, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "subject": self.subject,
            "message": self.message,
            "status": self.status,
            "created_at": self.created_at.isoformat()
        }