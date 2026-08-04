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
