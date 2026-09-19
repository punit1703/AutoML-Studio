from .base import *
import os

DEBUG = True

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev')

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')

DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CORS_ALLOW_ALL_ORIGINS = True

# Disable secure cookies for local development
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
