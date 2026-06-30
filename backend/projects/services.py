from .models import Project
from django.core.exceptions import ValidationError
import os
import zipfile
import tempfile
from django.conf import settings

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

    @staticmethod
    def export_project(project):
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, f"project_{project.id}_export.zip")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for dataset in project.datasets.all():
                if dataset.file and os.path.exists(dataset.file.path):
                    zipf.write(dataset.file.path, arcname=f"datasets/{dataset.file_name}")
                
                models_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
                if os.path.exists(models_dir):
                    for root, _, files in os.walk(models_dir):
                        for file in files:
                            if file.endswith('.joblib'):
                                file_path = os.path.join(root, file)
                                zipf.write(file_path, arcname=f"models/dataset_{dataset.id}/{file}")
                                
                exports_dir = os.path.join(settings.MEDIA_ROOT, 'exports', str(dataset.id))
                if os.path.exists(exports_dir):
                    for root, _, files in os.walk(exports_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            zipf.write(file_path, arcname=f"exports/dataset_{dataset.id}/{file}")
                            
        return zip_path
