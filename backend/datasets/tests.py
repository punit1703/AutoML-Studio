from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from projects.models import Project
from datasets.models import Dataset
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class DatasetAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.project = Project.objects.create(user=self.user, title="My Project")
        
        self.csv_content = b"id,val\n1,10\n2,20\n"
        self.test_file = SimpleUploadedFile("test.csv", self.csv_content, content_type="text/csv")
        
        self.dataset = Dataset.objects.create(
            project=self.project,
            file=self.test_file,
            file_name="test.csv",
            file_type="CSV",
            file_size=len(self.csv_content),
            row_count=2,
            column_count=2
        )

    def test_list_datasets(self):
        response = self.client.get('/api/v1/datasets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
    def test_preview_endpoint(self):
        response = self.client.get(f'/api/v1/datasets/{self.dataset.id}/preview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('preview', response.data)
        
    def test_invalid_file_upload(self):
        invalid_file = SimpleUploadedFile("test.txt", b"plain text", content_type="text/plain")
        data = {
            'project_id': self.project.id,
            'file': invalid_file
        }
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
