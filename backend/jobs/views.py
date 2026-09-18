from rest_framework import viewsets, mixins
from .models import MLJob
from .serializers import MLJobSerializer
from rest_framework.permissions import IsAuthenticated

class MLJobViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = MLJobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see jobs for their datasets/projects
        return MLJob.objects.filter(dataset__project__user=self.request.user)
