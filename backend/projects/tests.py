from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()

class ProjectAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', password='password123')
        self.other_user = User.objects.create_user(email='other@test.com', password='password123')
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.project = Project.objects.create(user=self.user, title="My Project", description="Test Description")
        self.other_project = Project.objects.create(user=self.other_user, title="Other Project")

    def test_list_projects_isolation(self):
        """Ensure users can only see their own projects."""
        response = self.client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return self.project
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], "My Project")

    def test_create_project(self):
        data = {'title': 'New Project', 'description': 'New Description'}
        response = self.client.post('/api/v1/projects/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.filter(user=self.user).count(), 2)

    def test_unauthorized_access(self):
        """Ensure unauthenticated users cannot access projects."""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/projects/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
