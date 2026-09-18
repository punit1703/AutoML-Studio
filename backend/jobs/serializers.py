from rest_framework import serializers
from .models import MLJob

class MLJobSerializer(serializers.ModelSerializer):
    dataset_name = serializers.CharField(source='dataset.file_name', read_only=True)
    project_id = serializers.CharField(source='dataset.project_id', read_only=True)

    class Meta:
        model = MLJob
        fields = [
            'id', 'job_type', 'status', 'progress', 'current_stage',
            'dataset_id', 'dataset_name', 'project_id',
            'result', 'error_message', 'created_at', 'updated_at'
        ]
