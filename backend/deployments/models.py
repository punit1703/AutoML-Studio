from django.db import models
from core.models import BaseModel
from projects.models import Project
from datasets.models import Dataset

class Deployment(BaseModel):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('failed', 'Failed'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='deployments')
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='deployments')
    model_name = models.CharField(max_length=255)
    model_path = models.CharField(max_length=1024)
    target_column = models.CharField(max_length=255)
    schema = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    def __str__(self):
        return f"{self.project.title} - {self.model_name}"
