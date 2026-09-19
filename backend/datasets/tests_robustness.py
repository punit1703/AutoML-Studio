import pytest
import tempfile
import os
import csv
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.exceptions import ValidationError
from datasets.services import DatasetService

@pytest.fixture
def create_temp_csv():
    def _create(rows, header=True):
        fd, path = tempfile.mkstemp(suffix='.csv')
        with os.fdopen(fd, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if header:
                writer.writerow([f"col_{i}" for i in range(len(rows[0]) if rows else 0)])
            for row in rows:
                writer.writerow(row)
        return path
    return _create

@pytest.mark.django_db
class TestDatasetRobustness:
    
    def test_empty_csv(self):
        fd, path = tempfile.mkstemp(suffix='.csv')
        with open(path, 'w') as f:
            pass # Completely empty
            
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("empty.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="The uploaded file is empty."):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
            
    def test_one_column_csv(self, create_temp_csv):
        path = create_temp_csv([["val1"], ["val2"], ["val3"]])
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("one_col.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="Dataset must contain at least two columns"):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
        
    def test_one_row_csv(self, create_temp_csv):
        path = create_temp_csv([["val1", "val2"]])
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("one_row.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="Dataset must contain at least two rows"):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
        
    def test_duplicate_columns(self, create_temp_csv):
        fd, path = tempfile.mkstemp(suffix='.csv')
        with os.fdopen(fd, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["id", "name", "id"])
            writer.writerow([1, "A", 2])
            writer.writerow([2, "B", 3])
            
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("dups.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="Duplicate column names detected"):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
        
    def test_all_null_dataset(self, create_temp_csv):
        path = create_temp_csv([["", ""], ["", ""]])
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("all_null.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="The dataset contains completely empty rows"):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
        
    def test_all_constant_dataset(self, create_temp_csv):
        path = create_temp_csv([[1, "A"], [1, "A"], [1, "A"]])
        with open(path, 'rb') as f:
            file_obj = SimpleUploadedFile("constant.csv", f.read(), content_type="text/csv")
            
        with pytest.raises(ValidationError, match="All columns in the dataset have only one unique value"):
            DatasetService.validate_and_parse_csv(file_obj)
            
        os.remove(path)
