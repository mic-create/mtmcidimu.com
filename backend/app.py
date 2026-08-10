import os

from dotenv import load_dotenv

# Load environment variables before importing configuration
load_dotenv()

from flask import Flask, jsonify

from config import config_by_name
from extensions import db, migrate, cors


def create_app(config_name=None):
    """Application factory for Mother Teresa Medical Centre."""

    # Determine configuration
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    # Create Flask application
    app = Flask(__name__)

    # Load configuration
    config_class = config_by_name.get(
        config_name,
        config_by_name["default"]
    )

    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    # Import models so Flask-Migrate can detect all database tables
    import models

    # CORS configuration
    frontend_origin = os.getenv(
        "FRONTEND_ORIGIN",
        "http://127.0.0.1:5500"
    )

    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": frontend_origin
            }
        }
    )

    # Health check
    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({
            "success": True,
            "message": "Mother Teresa Medical Centre API is operational.",
            "status": "healthy"
        }), 200

    # Register blueprints
    from routes.auth import auth_bp
    from routes.appointments import appointments_bp
    from routes.doctors import doctors_bp
    from routes.departments import departments_bp
    from routes.patients import patients_bp
    from routes.contact import contact_bp
    from routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(
        appointments_bp,
        url_prefix="/api/appointments"
    )
    app.register_blueprint(
        doctors_bp,
        url_prefix="/api/doctors"
    )
    app.register_blueprint(
        departments_bp,
        url_prefix="/api/departments"
    )
    app.register_blueprint(
        patients_bp,
        url_prefix="/api/patients"
    )
    app.register_blueprint(
        contact_bp,
        url_prefix="/api/contact"
    )
    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )

    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Resource not found."
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "message": "Method not allowed."
        }), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "success": False,
            "message": "An internal server error occurred."
        }), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )