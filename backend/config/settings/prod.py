from .base import *
import os
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY environment variable is missing in production.")

# JWT Secret MUST be set in production, otherwise it crashes
if not os.getenv('JWT_SECRET'):
    raise ImproperlyConfigured("JWT_SECRET environment variable is missing in production.")

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    raise ImproperlyConfigured("ALLOWED_HOSTS environment variable must be set in production.")

DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}
if not os.getenv('DATABASE_URL'):
    raise ImproperlyConfigured("DATABASE_URL environment variable is missing in production.")

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', '').split(',')

# Strict Security Cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Optionally configure a more robust storage system for production if needed
# DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
