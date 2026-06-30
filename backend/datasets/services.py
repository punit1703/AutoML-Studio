import pandas as pd
import os
from rest_framework.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from .models import Dataset
import json
import math
import os
from django.conf import settings
from ml_engine.analysis import DatasetAnalysisEngine
from ml_engine.preprocessing import DataPreprocessingEngine
from ml_engine.visualization import VisualizationEngine
from ml_engine.training import ModelTrainingEngine
from ml_engine.evaluation import ModelEvaluationEngine
from ml_engine.notebook_generation import NotebookGenerator
from ml_engine.report_generation import ReportGenerator
import joblib
import glob

class DatasetService:
    ALLOWED_EXTENSIONS = {
        '.csv': 'CSV',
        '.xls': 'EXCEL',
        '.xlsx': 'EXCEL',
        '.json': 'JSON'
    }
    
    @staticmethod
    def validate_file(file: UploadedFile):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in DatasetService.ALLOWED_EXTENSIONS:
            raise ValidationError(f"Unsupported file extension. Allowed extensions are: {', '.join(DatasetService.ALLOWED_EXTENSIONS.keys())}")
        return DatasetService.ALLOWED_EXTENSIONS[ext]
        
    @staticmethod
    def _read_dataframe(dataset: Dataset, nrows=None):
        file_path = dataset.file.path
        ext = os.path.splitext(dataset.file_name)[1].lower()
        
        try:
            if ext == '.csv':
                return pd.read_csv(file_path, nrows=nrows)
            elif ext in ['.xls', '.xlsx']:
                return pd.read_excel(file_path, nrows=nrows)
            elif ext == '.json':
                return pd.read_json(file_path, nrows=nrows)
            else:
                raise ValueError("Unsupported format")
        except Exception as e:
            raise ValidationError(f"Error parsing file: {str(e)}")
            
    @staticmethod
    def extract_metadata(dataset: Dataset):
        df = DatasetService._read_dataframe(dataset)
        
        row_count, column_count = df.shape
        
        # Determine data types mapping pandas dtypes to generic types
        data_types = {}
        for col, dtype in df.dtypes.items():
            dtype_str = str(dtype)
            if 'int' in dtype_str:
                generic_type = 'integer'
            elif 'float' in dtype_str:
                generic_type = 'float'
            elif 'bool' in dtype_str:
                generic_type = 'boolean'
            elif 'datetime' in dtype_str:
                generic_type = 'datetime'
            else:
                generic_type = 'string'
            data_types[str(col)] = generic_type
            
        # Count missing values
        missing_values = df.isnull().sum().to_dict()
        missing_values = {str(k): int(v) for k, v in missing_values.items()}
        
        # Count duplicates
        duplicate_count = int(df.duplicated().sum())
        
        metadata = {
            "data_types": data_types,
            "missing_values": missing_values,
            "duplicate_count": duplicate_count
        }
        
        dataset.row_count = row_count
        dataset.column_count = column_count
        dataset.metadata = metadata
        dataset.save(update_fields=['row_count', 'column_count', 'metadata'])
        
        return dataset

    @staticmethod
    def get_preview(dataset: Dataset, rows=10):
        try:
            df = DatasetService._read_dataframe(dataset, nrows=rows)
            # Replace NaN/NaT with None for JSON serialization
            df = df.where(pd.notnull(df), None)
            return df.to_dict(orient='records')
        except Exception as e:
            raise ValidationError(f"Error generating preview: {str(e)}")

    @staticmethod
    def process_upload(project, file: UploadedFile):
        file_type = DatasetService.validate_file(file)
        
        dataset = Dataset.objects.create(
            project=project,
            file=file,
            file_name=file.name,
            file_type=file_type,
            file_size=file.size
        )
        
        # Note: In a production environment, extract_metadata should be done asynchronously 
        # (e.g., using Celery) as parsing large files can block the API response.
        return DatasetService.extract_metadata(dataset)

    @staticmethod
    def analyze_dataset(dataset: Dataset, target_column: str = None):
        try:
            df = DatasetService._read_dataframe(dataset)
            engine = DatasetAnalysisEngine(df)
            return engine.analyze(target_column=target_column)
        except Exception as e:
            raise ValidationError(f"Error analyzing dataset: {str(e)}")

    @staticmethod
    def preprocess_dataset(dataset: Dataset, config: dict):
        try:
            df = DatasetService._read_dataframe(dataset)
            engine = DataPreprocessingEngine(df)
            preprocessed_df = engine.apply_pipeline(config)
            
            # For preview purposes, return first 100 rows
            preview_df = preprocessed_df.head(100)
            # Replace NaN/NaT with None for JSON serialization
            preview_df = preview_df.where(pd.notnull(preview_df), None)
            
            return {
                "shape": list(preprocessed_df.shape),
                "preview": preview_df.to_dict(orient='records')
            }
        except Exception as e:
            raise ValidationError(f"Error preprocessing dataset: {str(e)}")

    @staticmethod
    def generate_visualization(dataset: Dataset, chart_type: str, params: dict):
        try:
            df = DatasetService._read_dataframe(dataset)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'visualizations', str(dataset.id))
            
            engine = VisualizationEngine(df, output_dir)
            filename = engine.generate_chart(chart_type, params)
            
            relative_url = f"/media/visualizations/{dataset.id}/{filename}"
            return {"chart_url": relative_url}
        except Exception as e:
            raise ValidationError(f"Error generating visualization: {str(e)}")

    @staticmethod
    def train_models(dataset: Dataset, target_column: str):
        try:
            df = DatasetService._read_dataframe(dataset)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            
            engine = ModelTrainingEngine(df, target_column, output_dir)
            results = engine.train_and_evaluate()
            
            return results
        except Exception as e:
            raise ValidationError(f"Error training models: {str(e)}")

    @staticmethod
    def evaluate_models(dataset: Dataset, target_column: str):
        try:
            df = DatasetService._read_dataframe(dataset)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            if not os.path.exists(output_dir):
                raise ValidationError("No trained models found for this dataset. Please train models first.")
                
            training_engine = ModelTrainingEngine(df, target_column, output_dir)
            problem_type = training_engine._detect_problem_type()
            _, X_test, _, y_test = training_engine._prepare_data(problem_type)
            
            models = {}
            for model_path in glob.glob(os.path.join(output_dir, "*.joblib")):
                model_name = os.path.basename(model_path).replace('.joblib', '').replace('_', ' ').title()
                if model_name.lower() == 'xgboost':
                    model_name = 'XGBoost'
                elif model_name.lower() == 'svm':
                    model_name = 'SVM'
                elif model_name.lower() == 'knn':
                    model_name = 'KNN'
                models[model_name] = joblib.load(model_path)
                
            if not models:
                raise ValidationError("No saved models found. Please train models first.")
                
            eval_engine = ModelEvaluationEngine(problem_type, models, X_test, y_test)
            return eval_engine.evaluate()
        except Exception as e:
            raise ValidationError(f"Error evaluating models: {str(e)}")

    @staticmethod
    def generate_notebook(dataset: Dataset, target_column: str):
        try:
            output_dir = os.path.join(settings.MEDIA_ROOT, 'exports', str(dataset.id))
            generator = NotebookGenerator(dataset.file.path, target_column, output_dir)
            filename = generator.generate()
            return {"download_url": f"/media/exports/{dataset.id}/{filename}"}
        except Exception as e:
            raise ValidationError(f"Error generating notebook: {str(e)}")
            
    @staticmethod
    def generate_report(dataset: Dataset, target_column: str):
        try:
            eval_results = DatasetService.evaluate_models(dataset, target_column)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'exports', str(dataset.id))
            generator = ReportGenerator(eval_results, output_dir)
            filename = generator.generate()
            return {"download_url": f"/media/exports/{dataset.id}/{filename}"}
        except Exception as e:
            raise ValidationError(f"Error generating report: {str(e)}")

    @staticmethod
    def get_model_path(dataset: Dataset, model_name: str):
        if not model_name:
            raise ValidationError("model_name is required.")
        filename = f"{model_name.replace(' ', '_').lower()}.joblib"
        file_path = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id), filename)
        if not os.path.exists(file_path):
            raise ValidationError(f"Model '{model_name}' not found. Please train models first.")
        return file_path

    @staticmethod
    def get_notebook_path(dataset: Dataset):
        file_path = os.path.join(settings.MEDIA_ROOT, 'exports', str(dataset.id), 'reproducible_pipeline.ipynb')
        if not os.path.exists(file_path):
            raise ValidationError("Notebook not found. Please generate it first.")
        return file_path

    @staticmethod
    def get_report_path(dataset: Dataset):
        file_path = os.path.join(settings.MEDIA_ROOT, 'exports', str(dataset.id), 'automl_evaluation_report.pdf')
        if not os.path.exists(file_path):
            raise ValidationError("Report not found. Please generate it first.")
        return file_path
