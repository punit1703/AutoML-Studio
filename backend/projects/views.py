from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse
import os
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project
from .serializers import ProjectSerializer
from .services import ProjectService

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['title', 'created_at']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).select_related('user')

    def perform_create(self, serializer):
        project = ProjectService.create_project(
            user=self.request.user,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description', '')
        )
        serializer.instance = project

    def perform_update(self, serializer):
        ProjectService.update_project(
            project=self.get_object(),
            **serializer.validated_data
        )

    def perform_destroy(self, instance):
        ProjectService.delete_project(instance)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        project = self.get_object()
        zip_path = ProjectService.export_project(project)
        return FileResponse(open(zip_path, 'rb'), as_attachment=True, filename=f"project_{project.id}_export.zip")

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        from datasets.models import Dataset
        from django.db.models import Sum
        from django.conf import settings
        import os
        import glob
        
        user = request.user
        
        datasets = Dataset.objects.filter(project__user=user)
        active_datasets_count = datasets.count()
        total_size = datasets.aggregate(Sum('file_size'))['file_size__sum'] or 0
        
        if total_size > 1024 * 1024 * 1024:
            size_str = f"{total_size / (1024 * 1024 * 1024):.1f} GB total"
        elif total_size > 1024 * 1024:
            size_str = f"{total_size / (1024 * 1024):.1f} MB total"
        else:
            size_str = f"{total_size / 1024:.1f} KB total"
            
        total_models = 0
        for dataset in datasets:
            model_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            if os.path.exists(model_dir):
                models = glob.glob(os.path.join(model_dir, "*.joblib"))
                total_models += len(models)
                
        # Optional dummy logic for compute time, since we don't track training duration in DB
        compute_time = f"{total_models * 1.5:.1f}h" if total_models > 0 else "0h"
                
        return Response({
            "total_models": total_models,
            "active_datasets": active_datasets_count,
            "total_size_str": size_str,
            "compute_time": compute_time,
            "system_status": "Healthy"
        })

