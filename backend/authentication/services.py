from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as RestValidationError

User = get_user_model()

def create_user(email: str, password: str, first_name: str = '', last_name: str = '') -> User:
    """
    Creates and returns a new user with the given details.
    """
    if User.objects.filter(email=email).exists():
        raise RestValidationError({'email': 'A user with this email already exists.'})
    
    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    return user

def update_profile(user: User, data: dict) -> User:
    """
    Updates a user's profile information.
    """
    allowed_fields = ['first_name', 'last_name']
    
    for field in allowed_fields:
        if field in data:
            setattr(user, field, data[field])
            
    user.save()
    return user
