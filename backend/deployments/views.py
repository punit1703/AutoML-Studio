from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Deployment
from .serializers import DeploymentSerializer
import pandas as pd
import joblib

class DeploymentViewSet(viewsets.ModelViewSet):
    serializer_class = DeploymentSerializer
    permission_classes = [permissions.AllowAny] # Predict endpoint should be public for shareable link, or we can restrict viewset and open only predict.
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Deployment.objects.filter(project__user=self.request.user)
        return Deployment.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def predict(self, request, pk=None):
        try:
            deployment = Deployment.objects.get(pk=pk)
        except Deployment.DoesNotExist:
            return Response({"error": "Deployment not found"}, status=status.HTTP_404_NOT_FOUND)

        if deployment.status != 'active':
            return Response({"error": "Deployment is not active"}, status=status.HTTP_400_BAD_REQUEST)

        # Assuming data comes as JSON in request.data
        input_data = request.data
        if not isinstance(input_data, list):
            input_data = [input_data]
            
        try:
            df = pd.DataFrame(input_data)
            
            # Here we need a full pipeline (preprocessing + model). 
            # In our new training refactor, we will save the entire pipeline as a single joblib file.
            model_pipeline = joblib.load(deployment.model_path)
            
            predictions = model_pipeline.predict(df)
            
            # Map predictions to string labels if this was a classification task
            pred_list = predictions.tolist()
            label_classes = deployment.schema.get('label_classes')
            if label_classes:
                pred_list = [label_classes[int(p)] for p in pred_list]
            
            return Response({"predictions": pred_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Prediction failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
