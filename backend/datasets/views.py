from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.http import FileResponse
import os
from .models import Dataset
from .serializers import DatasetSerializer, DatasetUploadSerializer
from .services import DatasetService
from projects.models import Project

class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetSerializer
    
    def get_queryset(self):
        qs = Dataset.objects.filter(project__user=self.request.user).select_related('project')
        project_id = self.request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs
        
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

    @action(detail=False, methods=['post'])
    def upload_multiple(self, request):
        project_id = request.data.get('project_id')
        files = request.FILES.getlist('files')
        
        if not project_id or not files:
            return Response({"error": "project_id and files are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        project = get_object_or_404(Project, id=project_id)
        
        result = DatasetService.process_multiple_uploads(project, files)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def merge_class_separated(self, request):
        project_id = request.data.get('project_id')
        dataset_ids = request.data.get('dataset_ids', [])
        classes = request.data.get('classes', [])
        target_column_name = request.data.get('target_column_name', 'Class')
        
        if not project_id or not dataset_ids or not classes:
            return Response({"error": "project_id, dataset_ids, and classes are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        project = get_object_or_404(Project, id=project_id)
        
        try:
            result = DatasetService.merge_class_separated(project, dataset_ids, classes, target_column_name)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        dataset = self.get_object()
        
        # Optionally allow specifying row count
        rows = int(request.query_params.get('rows', 10))
        preview_data = DatasetService.get_preview(dataset, rows=rows)
        return Response({"preview": preview_data}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'])
    def analyze(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.query_params.get('target_column')
        analysis_data = DatasetService.analyze_dataset(dataset, target_column=target_column)
        return Response(analysis_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def suggest_targets(self, request, pk=None):
        dataset = self.get_object()
        suggestions = DatasetService.suggest_targets(dataset)
        return Response(suggestions, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def set_target(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        problem_type = request.data.get('problem_type')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not dataset.metadata:
            dataset.metadata = {}
            
        dataset.metadata['target_column'] = target_column
        
        if problem_type and problem_type != 'auto':
            dataset.metadata['problem_type'] = problem_type
        else:
            # Auto-determine if requested
            from ml_engine.target_detector import TargetDetectionEngine
            detector = TargetDetectionEngine(dataset.metadata)
            dataset.metadata['problem_type'] = detector.determine_problem_type(target_column)
            
        dataset.save(update_fields=['metadata'])
        
        return Response({
            "status": "success", 
            "target_column": dataset.metadata['target_column'],
            "problem_type": dataset.metadata['problem_type']
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def preprocessing_plan(self, request, pk=None):
        dataset = self.get_object()
        
        if not dataset.metadata or 'columns' not in dataset.metadata:
            return Response({"error": "Dataset profile not generated"}, status=status.HTTP_400_BAD_REQUEST)
            
        target_column = dataset.metadata.get('target_column')
        if not target_column:
            return Response({"error": "Target column not set"}, status=status.HTTP_400_BAD_REQUEST)
            
        from ml_engine.preprocessing_recommendation import PreprocessingRecommendationEngine
        engine = PreprocessingRecommendationEngine(dataset.metadata, target_column)
        plan = engine.generate_plan()
        
        return Response({"plan": plan}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def model_recommendation(self, request, pk=None):
        dataset = self.get_object()
        
        if not dataset.metadata or 'problem_type' not in dataset.metadata:
            return Response({"error": "Dataset profile or problem type not generated"}, status=status.HTTP_400_BAD_REQUEST)
            
        problem_type = dataset.metadata.get('problem_type')
        
        try:
            from ml_engine.model_recommendation import ModelRecommendationEngine
            engine = ModelRecommendationEngine(dataset.metadata, problem_type)
            recommendation = engine.recommend()
            return Response(recommendation, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            return Response({"error": f"Failed to generate model recommendations: {str(e)}\n{traceback.format_exc()}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def run_pipeline(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        budget = request.data.get('budget', 'standard')
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.run_pipeline(dataset, target_column, budget)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def preprocess(self, request, pk=None):
        dataset = self.get_object()
        config = request.data.get('config', {})
        result = DatasetService.preprocess_dataset(dataset, config)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def visualize(self, request, pk=None):
        dataset = self.get_object()
        chart_type = request.data.get('chart_type')
        params = request.data.get('params', {})
        
        if not chart_type:
            return Response({"error": "chart_type is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.generate_visualization(dataset, chart_type, params)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def train(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        budget = request.data.get('budget', 'standard')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.train_models(dataset, target_column, budget)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.evaluate_models(dataset, target_column)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def generate_notebook(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.generate_notebook(dataset, target_column)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        dataset = self.get_object()
        target_column = request.data.get('target_column')
        
        if not target_column:
            return Response({"error": "target_column is required"}, status=status.HTTP_400_BAD_REQUEST)
        result = DatasetService.generate_report(dataset, target_column)
        return Response(result, status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'])
    def download_model(self, request, pk=None):
        dataset = self.get_object()
        model_name = request.query_params.get('model_name')
        file_path = DatasetService.get_model_path(dataset, model_name)
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))


    @action(detail=True, methods=['get'])
    def download_notebook(self, request, pk=None):
        dataset = self.get_object()
        file_path = DatasetService.get_notebook_path(dataset)
        return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))


    @action(detail=True, methods=['get'])
    def download_report(self, request, pk=None):
        dataset = self.get_object()
        try:
            file_path = DatasetService.get_report_path(dataset)
            response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename='automl_evaluation_report.pdf')
            return response
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download_metadata(self, request, pk=None):
        dataset = self.get_object()
        try:
            file_path = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id), 'pipeline_metadata.json')
            if not os.path.exists(file_path):
                return Response({"error": "Metadata not found."}, status=status.HTTP_404_NOT_FOUND)
            response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename='pipeline_metadata.json')
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
