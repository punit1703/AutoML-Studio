from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    primary_dataset_id = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['id', 'title', 'description', 'created_at', 'updated_at', 'user', 'is_saved', 'primary_dataset_id']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def get_primary_dataset_id(self, obj):
        dataset = obj.datasets.first()
        if dataset:
            return str(dataset.id)
        return None
