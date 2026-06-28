from .models import Project
from django.core.exceptions import ValidationError

class ProjectService:
    @staticmethod
    def create_project(user, title, description=""):
        if not title:
            raise ValidationError("Title is required.")
        
        project = Project.objects.create(
            user=user,
            title=title,
            description=description
        )
        return project

    @staticmethod
    def update_project(project, **kwargs):
        allowed_fields = ['title', 'description']
        
        for field, value in kwargs.items():
            if field in allowed_fields:
                setattr(project, field, value)
                
        # Validate before saving if necessary
        project.save()
        return project

    @staticmethod
    def delete_project(project):
        project.delete()
