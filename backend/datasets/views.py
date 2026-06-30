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

    @action(detail=True, methods=['get'])
    def analyze(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.query_params.get('target_column')
        
        try:
            analysis_data = DatasetService.analyze_dataset(dataset, target_column=target_column)
            return Response(analysis_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def preprocess(self, request, pk=None):
        dataset = self.get_object()
        config = request.data.get('config', {})
        
        try:
            result = DatasetService.preprocess_dataset(dataset, config)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def visualize(self, request, pk=None):
        dataset = self.get_object()
        chart_type = request.data.get('chart_type')
        params = request.data.get('params', {})
        
        if not chart_type:
            return Response({"error": "chart_type is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = DatasetService.generate_visualization(dataset, chart_type, params)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = DatasetService.train_models(dataset, target_column)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = DatasetService.evaluate_models(dataset, target_column)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def generate_notebook(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = DatasetService.generate_notebook(dataset, target_column)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            result = DatasetService.generate_report(dataset, target_column)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
