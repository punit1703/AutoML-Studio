from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from projects.models import Project
from datasets.models import Dataset
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
import time

User = get_user_model()

class FailureAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='user@test.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.project = Project.objects.create(user=self.user, title="Failure Project", is_saved=True)
        
        csv_content = b"feature1,feature2,target\n1.5,2.5,A\n2.5,3.5,B\n1.0,2.0,A\n3.0,4.0,B\n" * 5
        self.test_file = SimpleUploadedFile("e2e.csv", csv_content, content_type="text/csv")

    @patch('datasets.services.DatasetService._sync_extract_metadata')
    def test_profiling_backend_failure(self, mock_metadata):
        # Simulate a crash during profiling
        mock_metadata.side_effect = Exception("Out of memory error during profiling")
        
        def mock_thread_start(self_thread):
            self_thread._target(*self_thread._args, **self_thread._kwargs)
            
        with patch('threading.Thread.start', new=mock_thread_start):
            data = {'project_id': self.project.id, 'file': self.test_file}
            response = self.client.post('/api/v1/datasets/', data, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            dataset_id = response.data['id']
        
        # Wait a moment for background thread to fail (since threading is not mocked here)
        time.sleep(0.5)
        
        job_resp = self.client.get(f'/api/v1/datasets/{dataset_id}/active_job/')
        self.assertEqual(job_resp.status_code, status.HTTP_200_OK)
        # Should be caught by the general exception handler in the background task
        self.assertEqual(job_resp.data['status'], 'FAILED')
        self.assertIn("Out of memory", job_resp.data['error_message'])

    def test_training_backend_failure(self):
        # Upload successfully first
        def mock_thread_start(self_thread):
            self_thread._target(*self_thread._args, **self_thread._kwargs)
            
        with patch('threading.Thread.start', new=mock_thread_start):
            data = {'project_id': self.project.id, 'file': self.test_file}
            response = self.client.post('/api/v1/datasets/', data, format='multipart')
            dataset_id = response.data['id']
            
            # Set target
            self.client.post(f'/api/v1/datasets/{dataset_id}/set_target/', {'target_column': 'target'}, format='json')
            
            # Now trigger training but mock it to fail
            with patch('ml_engine.training.ModelTrainingEngine.train_and_evaluate') as mock_train:
                mock_train.side_effect = Exception("Model fitting failure: NaN values encountered")
                
                pipeline_data = {'target_column': 'target'}
                self.client.post(f'/api/v1/datasets/{dataset_id}/run_pipeline/', pipeline_data, format='json')
                
                job_resp = self.client.get(f'/api/v1/datasets/{dataset_id}/active_job/')
                self.assertEqual(job_resp.data['status'], 'FAILED')
                self.assertEqual(job_resp.data['error_message'], 'An internal server error occurred.')
