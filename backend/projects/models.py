from django.db import models
from django.conf import settings
from core.models import BaseModel

class Project(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    def __str__(self):
        return self.title
