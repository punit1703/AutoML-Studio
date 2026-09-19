import traceback
import logging
import re
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('django')

def sanitize_message(message: str) -> str:
    """Removes absolute paths and stack trace hints from error messages."""
    if not isinstance(message, str):
        return str(message)
    # Remove absolute file paths (Windows and Unix)
    message = re.sub(r'([A-Za-z]:\\[^\s]+)|(\/[^\s]+)', '[REDACTED_PATH]', message)
    # Ensure no generic traceback text is left
    if 'Traceback (most recent call last)' in message:
        return "An internal server error occurred."
    return message

def custom_exception_handler(exc, context):
    """
    Custom exception handler to format all API errors consistently.
    Catches both DRF exceptions and raw Python exceptions.
    """
    response = exception_handler(exc, context)

    # Log the full traceback locally for debugging
    logger.error(f"Exception in {context.get('view')}: {exc}\n{traceback.format_exc()}")

    if response is not None:
        custom_data = {
            'error': True,
            'message': sanitize_message(
                response.data.get('detail', str(exc)) if isinstance(response.data, dict) else str(exc)
            ),
            'details': {}
        }
        response.data = custom_data
    else:
        # It's a non-DRF exception (e.g. ValueError, Django 500)
        custom_data = {
            'error': True,
            'message': 'An unexpected internal error occurred.' if not settings.DEBUG else sanitize_message(str(exc)),
            'details': {}
        }
        response = Response(custom_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
