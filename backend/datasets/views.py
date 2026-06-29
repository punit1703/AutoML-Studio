from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Dataset
from .serializers import DatasetSerializer, DatasetUploadSerializer
from .services import DatasetService

class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetSerializer
    
    def get_queryset(self):
        # Only return datasets belonging to projects owned by the current user
        return Dataset.objects.filter(project__user=self.request.user)
        
    def get_serializer_class(self):
        if self.action == 'create':
            return DatasetUploadSerializer
        return DatasetSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        project = serializer.validated_data['project_id']
        file = serializer.validated_data['file']
        
        dataset = DatasetService.process_upload(project, file)
        
        # Return serialized dataset object
        response_serializer = DatasetSerializer(dataset)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        dataset = self.get_object()
        
        # Optionally allow specifying row count
        rows = int(request.query_params.get('rows', 10))
        
        try:
            preview_data = DatasetService.get_preview(dataset, rows=rows)
            return Response({"preview": preview_data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

