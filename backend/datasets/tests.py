from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from projects.models import Project
from datasets.models import Dataset
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class DatasetAPITests(APITestCase):
    def setUp(self):
        from unittest.mock import patch
        
        def mock_thread_start(self_thread):
            self_thread._target(*self_thread._args, **self_thread._kwargs)
            
        self.thread_patcher = patch('threading.Thread.start', new=mock_thread_start)
        self.thread_patcher.start()
        
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

    def tearDown(self):
        self.thread_patcher.stop()

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

    def test_upload_multiple_class_separated(self):
        fake_csv = SimpleUploadedFile("fake.csv", b"id,val\n1,10\n2,20\n", content_type="text/csv")
        true_csv = SimpleUploadedFile("true.csv", b"id,val\n3,30\n4,40\n", content_type="text/csv")
        
        data = {
            'project_id': self.project.id,
            'files': [fake_csv, true_csv]
        }
        response = self.client.post('/api/v1/datasets/upload_multiple/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Schemas match perfectly, but names don't imply "part"
        self.assertEqual(response.data['status'], 'requires_action')
        self.assertEqual(response.data['pattern'], 'class_separated')
        self.assertEqual(len(response.data['datasets']), 2)
        
        dataset_ids = [ds['id'] for ds in response.data['datasets']]
        
        # Now test merge_class_separated
        merge_data = {
            'project_id': self.project.id,
            'dataset_ids': dataset_ids,
            'classes': ['FakeClass', 'TrueClass'],
            'target_column_name': 'MyLabel'
        }
        merge_response = self.client.post('/api/v1/datasets/merge_class_separated/', merge_data, format='json')
        self.assertEqual(merge_response.status_code, status.HTTP_200_OK)
        self.assertEqual(merge_response.data['status'], 'success')
        
        # Verify merged dataset
        merged_ds = Dataset.objects.get(id=merge_response.data['dataset_id'])
        self.assertEqual(merged_ds.row_count, 4)
        self.assertEqual(merged_ds.column_count, 3) # id, val, MyLabel

    def test_empty_csv_upload(self):
        empty_file = SimpleUploadedFile("empty.csv", b"", content_type="text/csv")
        data = {'project_id': self.project.id, 'file': empty_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty", str(response.data).lower())
        
    def test_malformed_csv_upload(self):
        malformed_csv = b"col1,col2\nval1,val2,val3\nval4,val5"
        malformed_file = SimpleUploadedFile("malformed.csv", malformed_csv, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': malformed_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_duplicate_columns_upload(self):
        dup_csv = b"id,val,val\n1,10,20\n2,30,40\n"
        dup_file = SimpleUploadedFile("dup.csv", dup_csv, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': dup_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Duplicate column names detected", str(response.data))

    def test_missing_headers_upload(self):
        missing_headers_csv = b"id,,val\n1,2,3\n"
        missing_file = SimpleUploadedFile("missing.csv", missing_headers_csv, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': missing_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Missing or empty column headers", str(response.data))

    def test_completely_empty_column(self):
        empty_col_csv = b"id,val,empty_col\n1,10,\n2,20,\n"
        empty_col_file = SimpleUploadedFile("empty_col.csv", empty_col_csv, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': empty_col_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("completely empty", str(response.data).lower())

    def test_completely_empty_row(self):
        empty_row_csv = b"id,val\n1,10\n,\n2,20\n"
        empty_row_file = SimpleUploadedFile("empty_row.csv", empty_row_csv, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': empty_row_file}
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("completely empty rows", str(response.data).lower())

    def test_end_to_end_workflow(self):
        # 1. Upload CSV
        csv_content = b"feature1,feature2,target\n1.5,2.5,A\n2.5,3.5,B\n1.0,2.0,A\n3.0,4.0,B\n1.5,2.5,A\n2.5,3.5,B\n"
        test_file = SimpleUploadedFile("e2e.csv", csv_content, content_type="text/csv")
        data = {'project_id': self.project.id, 'file': test_file}
        
        response = self.client.post('/api/v1/datasets/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dataset_id = response.data['id']
        
        # Job should be WAITING_FOR_TARGET because profiling ran synchronously
        job_resp = self.client.get(f'/api/v1/datasets/{dataset_id}/active_job/')
        self.assertEqual(job_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(job_resp.data['status'], 'WAITING_FOR_TARGET')
        
        # 2. Set Target
        set_target_data = {
            'target_column': 'target',
            'problem_type': 'Classification'
        }
        res = self.client.post(f'/api/v1/datasets/{dataset_id}/set_target/', set_target_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Job should now be WAITING_FOR_REVIEW
        job_resp = self.client.get(f'/api/v1/datasets/{dataset_id}/active_job/')
        self.assertEqual(job_resp.data['status'], 'WAITING_FOR_REVIEW')
        
        # 3. Run Pipeline
        pipeline_data = {'target_column': 'target', 'budget': 'fast'}
        res = self.client.post(f'/api/v1/datasets/{dataset_id}/run_pipeline/', pipeline_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Job should now be COMPLETED because training ran synchronously
        job_resp = self.client.get(f'/api/v1/datasets/{dataset_id}/active_job/')
        self.assertEqual(job_resp.data['status'], 'COMPLETED')
        self.assertIsNotNone(job_resp.data.get('progress'))
        self.assertEqual(job_resp.data['progress'], 100)
