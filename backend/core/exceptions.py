from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    """
    Custom exception handler to format all API errors consistently.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'error': True,
            'message': response.data.get('detail', 'An error occurred') if isinstance(response.data, dict) else 'An error occurred',
            'details': response.data
        }
        response.data = custom_data

    return response
