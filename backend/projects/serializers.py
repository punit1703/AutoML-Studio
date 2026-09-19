from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    primary_dataset_id = serializers.SerializerMethodField()
    has_deployments = serializers.SerializerMethodField()
    latest_deployment_id = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'user', 'is_saved', 'primary_dataset_id', 'has_deployments', 'latest_deployment_id']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
        
    def validate_title(self, value):
        import re
        if len(value) > 255:
            raise serializers.ValidationError("Title cannot exceed 255 characters.")
        if not re.match(r'^[\w\s\-\.,\(\)]+$', value):
            raise serializers.ValidationError("Title contains invalid characters. Only alphanumeric, spaces, and basic punctuation are allowed.")
        return value
        
    def validate_description(self, value):
        if value and len(value) > 2000:
            raise serializers.ValidationError("Description cannot exceed 2000 characters.")
        return value

    def get_primary_dataset_id(self, obj):
        dataset = obj.datasets.first()
        if dataset:
            return str(dataset.id)
        return None

    def get_has_deployments(self, obj):
        return obj.deployments.exists() if hasattr(obj, 'deployments') else False
        
    def get_latest_deployment_id(self, obj):
        if hasattr(obj, 'deployments'):
            latest = obj.deployments.order_by('-created_at').first()
            if latest:
                return str(latest.id)
        return None
