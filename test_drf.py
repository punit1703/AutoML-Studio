import os
import django
import sys

# Setup django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from authentication.models import User

user, _ = User.objects.get_or_create(email='test@drf.com')
user.set_password('password')
user.save()

client = Client(HTTP_HOST='localhost')
resp = client.post('/api/auth/login/', {'email': 'test@drf.com', 'password': 'password'}, content_type='application/json')
token = resp.json()['access']
headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

resp = client.post('/api/v1/projects/', {'title': 'Test Proj', 'description': 'desc'}, content_type='application/json', **headers)
print("Project status:", resp.status_code)
project_id = resp.json()['id']
print("Project ID:", project_id)

with open('test.csv', 'w') as f:
    f.write('col1,col2\n1,2\n3,4')

with open('test.csv', 'rb') as f:
    resp = client.post('/api/v1/datasets/', {'project_id': project_id, 'file': f}, **headers)
print("Dataset status:", resp.status_code)
try:
    print(resp.json())
except:
    print(resp.content)
