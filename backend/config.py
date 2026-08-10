import os
from datetime import timedelta


class Config:
    """Base configuration."""

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "dev-secret-key-change-in-production"
    )

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "dev-jwt-secret-key-change-in-production"
    )

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    FRONTEND_ORIGIN = os.getenv(
        "FRONTEND_ORIGIN",
        "http://127.0.0.1:5500"
    )

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/mother_teresa_mc"
    )


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing configuration."""

    DEBUG = False
    TESTING = True

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "sqlite:///:memory:"
    )


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False


config_by_name = {
    "dev": DevelopmentConfig,
    "development": DevelopmentConfig,
    "test": TestingConfig,
    "testing": TestingConfig,
    "prod": ProductionConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}