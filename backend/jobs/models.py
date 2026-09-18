from django.db import models
import uuid

class JobStatus(models.TextChoices):
    QUEUED = 'QUEUED', 'Queued'
    PROFILING = 'PROFILING', 'Profiling'
    AI_ANALYSIS = 'AI_ANALYSIS', 'AI Analysis'
    PREPROCESSING = 'PREPROCESSING', 'Preprocessing'
    TRAINING = 'TRAINING', 'Training'
    OPTIMIZATION = 'OPTIMIZATION', 'Optimization'
    EVALUATION = 'EVALUATION', 'Evaluation'
    PIPELINE_GENERATION = 'PIPELINE_GENERATION', 'Pipeline Generation'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'

class JobType(models.TextChoices):
    PROFILE_DATASET = 'PROFILE_DATASET', 'Profile Dataset'
    TRAIN_MODEL = 'TRAIN_MODEL', 'Train Model'
    GENERATE_PIPELINE = 'GENERATE_PIPELINE', 'Generate Pipeline'

class MLJob(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dataset = models.ForeignKey('datasets.Dataset', on_delete=models.CASCADE, related_name='jobs')
    job_type = models.CharField(max_length=50, choices=JobType.choices)
    status = models.CharField(max_length=50, choices=JobStatus.choices, default=JobStatus.QUEUED)
    
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
