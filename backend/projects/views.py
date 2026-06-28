from rest_framework import viewsets, permissions, filters
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
        return Project.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        ProjectService.create_project(
            user=self.request.user,
            title=serializer.validated_data.get('title'),
            description=serializer.validated_data.get('description', '')
        )

    def perform_update(self, serializer):
        ProjectService.update_project(
            project=self.get_object(),
            **serializer.validated_data
        )

    def perform_destroy(self, instance):
        ProjectService.delete_project(instance)
