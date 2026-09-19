from django.db import models
import uuid

class JobStatus(models.TextChoices):
    UPLOADED = 'UPLOADED', 'Uploaded'
    VALIDATING = 'VALIDATING', 'Validating'
    PROFILING = 'PROFILING', 'Profiling'
    WAITING_FOR_TARGET = 'WAITING_FOR_TARGET', 'Waiting for Target'
    TARGET_CONFIRMED = 'TARGET_CONFIRMED', 'Target Confirmed'
    PREPROCESSING_PLAN = 'PREPROCESSING_PLAN', 'Preprocessing Plan'
    WAITING_FOR_REVIEW = 'WAITING_FOR_REVIEW', 'Waiting for Review'
    TRAINING = 'TRAINING', 'Training'
    EVALUATING = 'EVALUATING', 'Evaluating'
    EXPLAINING = 'EXPLAINING', 'Explaining'
    EXPORTING = 'EXPORTING', 'Exporting'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class JobType(models.TextChoices):
    PROFILE_DATASET = 'PROFILE_DATASET', 'Profile Dataset'
    TRAIN_MODEL = 'TRAIN_MODEL', 'Train Model'
    GENERATE_PIPELINE = 'GENERATE_PIPELINE', 'Generate Pipeline'

class MLJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey('datasets.Dataset', on_delete=models.CASCADE, related_name='jobs')
    job_type = models.CharField(max_length=50, choices=JobType.choices)
    status = models.CharField(max_length=50, choices=JobStatus.choices, default=JobStatus.UPLOADED)
    
    progress = models.IntegerField(default=0)
    current_stage = models.CharField(max_length=255, blank=True, null=True)
    
    result = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store the django-q task ID to link them
    task_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_type} - {self.status} ({self.id})"
