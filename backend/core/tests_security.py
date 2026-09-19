from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from projects.models import Project
from datasets.models import Dataset
from deployments.models import Deployment
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class SecurityAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email='user1@test.com', password='password123')
        self.user2 = User.objects.create_user(email='user2@test.com', password='password123')
        
        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)
        
        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)
        
        self.project1 = Project.objects.create(user=self.user1, title="User1 Project")
        
        csv_content = b"feature1,feature2,target\n1.5,2.5,A\n"
        self.test_file = SimpleUploadedFile("e2e.csv", csv_content, content_type="text/csv")
        
        self.dataset1 = Dataset.objects.create(
            project=self.project1,
            file=self.test_file,
            file_name="e2e.csv",
            file_type="CSV",
            file_size=len(csv_content),
            row_count=1,
            column_count=3
        )
        
        self.deployment1 = Deployment.objects.create(
            project=self.project1,
            dataset=self.dataset1,
            model_name="test_model",
            model_path="/fake/path",
            target_column="target",
            schema={}
        )

    def test_unauthorized_access(self):
        # No authentication
        anon_client = APIClient()
        
        # Test endpoints
        resp = anon_client.get('/api/v1/projects/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        
        resp = anon_client.get('/api/v1/datasets/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        
        resp = anon_client.get(f'/api/v1/deployments/{self.deployment1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        
        resp = anon_client.post(f'/api/v1/deployments/{self.deployment1.id}/predict/', {})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_idor_project_access(self):
        # User 2 tries to access User 1's project
        resp = self.client2.get(f'/api/v1/projects/{self.project1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_idor_dataset_access(self):
        # User 2 tries to access User 1's dataset
        resp = self.client2.get(f'/api/v1/datasets/{self.dataset1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        
        # User 2 tries to download User 1's model
        resp = self.client2.get(f'/api/v1/datasets/{self.dataset1.id}/download_model/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_idor_deployment_access(self):
        # User 2 tries to access User 1's deployment
        resp = self.client2.get(f'/api/v1/deployments/{self.deployment1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_idor_upload_to_other_project(self):
        # User 2 tries to upload to User 1's project
        csv_content = b"feature1,feature2,target\n1.5,2.5,A\n"
        test_file = SimpleUploadedFile("hack.csv", csv_content, content_type="text/csv")
        data = {
            'project_id': self.project1.id,
            'file': test_file
        }
        resp = self.client2.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Project does not exist or you do not have permission", str(resp.data))

    def test_path_traversal_prevention(self):
        # User 1 tries to download a model with path traversal
        resp = self.client1.get(f'/api/v1/datasets/{self.dataset1.id}/download_model/?model_name=../../../etc/passwd')
        # It should error out saying the sanitized model wasn't found, 
        # instead of attempting to read the file.
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not found", str(resp.data))
