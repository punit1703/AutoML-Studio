from rest_framework import serializers
from .models import Dataset
from projects.models import Project

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'project', 'file_name', 'file_type', 'file_size', 
                  'row_count', 'column_count', 'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'file_name', 'file_type', 'file_size', 
                            'row_count', 'column_count', 'metadata', 'created_at', 'updated_at']

class DatasetUploadSerializer(serializers.Serializer):
    project_id = serializers.UUIDField()
    file = serializers.FileField()

    def validate_project_id(self, value):
        user = self.context['request'].user
        try:
            project = Project.objects.get(id=value, user=user)
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project does not exist or you do not have permission to access it.")
        return project
