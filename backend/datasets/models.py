from django.db import models
from core.models import BaseModel
from projects.models import Project

class Dataset(BaseModel):
    FILE_TYPES = (
        ('CSV', 'CSV'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='datasets')
    file = models.FileField(upload_to='datasets/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='CSV')
    file_size = models.BigIntegerField()
    row_count = models.IntegerField(null=True, blank=True)
    column_count = models.IntegerField(null=True, blank=True)
    validation_status = models.CharField(max_length=50, default='PENDING')
    detected_encoding = models.CharField(max_length=50, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.file_name} ({self.project.title})"

