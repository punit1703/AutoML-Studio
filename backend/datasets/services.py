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
from ml_engine.utils import read_dataframe
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
    def extract_metadata(dataset: Dataset):
        df = read_dataframe(dataset.file.path, dataset.file_name)
        
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
            df = read_dataframe(dataset.file.path, dataset.file_name, nrows=rows)
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
    def process_multiple_uploads(project, files):
        if not files:
            raise ValidationError("No files provided")
            
        datasets = []
        for file in files:
            file_type = DatasetService.validate_file(file)
            dataset = Dataset.objects.create(
                project=project,
                file=file,
                file_name=file.name,
                file_type=file_type,
                file_size=file.size
            )
            dataset = DatasetService.extract_metadata(dataset)
            datasets.append(dataset)
            
        if len(datasets) == 1:
            return {"status": "success", "dataset_id": str(datasets[0].id)}
            
        # Analyze relations
        dfs = []
        import os
        for ds in datasets:
            dfs.append(read_dataframe(ds.file.path, ds.file_name))
            
        # Check if schemas exactly match
        schemas_match = True
        columns = set(dfs[0].columns)
        for df in dfs[1:]:
            if set(df.columns) != columns:
                schemas_match = False
                break
                
        dataset_info = [{"id": str(ds.id), "name": ds.file_name, "class_name": os.path.splitext(ds.file_name)[0].capitalize()} for ds in datasets]
        
        if schemas_match:
            # Check if filenames suggest multi-part
            multipart_keywords = ["part", "split", "fold", "01", "02"]
            is_multipart = False
            for ds in datasets:
                name_lower = ds.file_name.lower()
                if any(kw in name_lower for kw in multipart_keywords):
                    is_multipart = True
                    break
                    
            if is_multipart:
                return {
                    "status": "requires_action",
                    "pattern": "multi_part",
                    "datasets": dataset_info
                }
            else:
                return {
                    "status": "requires_action",
                    "pattern": "class_separated",
                    "datasets": dataset_info
                }
        else:
            # Schemas differ
            common_cols = set(dfs[0].columns)
            for df in dfs[1:]:
                common_cols.intersection_update(set(df.columns))
                
            if len(common_cols) > 0:
                return {
                    "status": "requires_action",
                    "pattern": "relational",
                    "datasets": dataset_info,
                    "common_columns": list(common_cols)
                }
            else:
                return {
                    "status": "requires_action",
                    "pattern": "independent",
                    "datasets": dataset_info
                }
    @staticmethod
    def merge_class_separated(project, dataset_ids, classes, target_column_name):
        datasets = Dataset.objects.filter(id__in=dataset_ids, project=project).order_by('created_at')
        if len(datasets) != len(classes):
            raise ValidationError("Mismatch between number of datasets and classes provided.")
            
        combined_df = pd.DataFrame()
        for ds, cls_name in zip(datasets, classes):
            df = read_dataframe(ds.file.path, ds.file_name)
            if target_column_name not in df.columns:
                df[target_column_name] = cls_name
            combined_df = pd.concat([combined_df, df], ignore_index=True)
            
        import io
        from django.core.files.base import ContentFile
        
        csv_buffer = io.StringIO()
        combined_df.to_csv(csv_buffer, index=False)
        
        merged_dataset = Dataset.objects.create(
            project=project,
            file_name="Merged_Dataset.csv",
            file_type="CSV",
            file_size=len(csv_buffer.getvalue().encode('utf-8'))
        )
        merged_dataset.file.save('Merged_Dataset.csv', ContentFile(csv_buffer.getvalue().encode('utf-8')))
        merged_dataset = DatasetService.extract_metadata(merged_dataset)
        
        # Cleanup old parts
        for ds in datasets:
            ds.delete()
            
        return {
            "status": "success",
            "message": "Datasets successfully merged with new target column.",
            "dataset_id": str(merged_dataset.id)
        }


    @staticmethod
    def analyze_dataset(dataset: Dataset, target_column: str = None):
        try:
            df = read_dataframe(dataset.file.path, dataset.file_name)
            engine = DatasetAnalysisEngine(df)
            return engine.analyze(target_column=target_column)
        except Exception as e:
            raise ValidationError(f"Error analyzing dataset: {str(e)}")

    @staticmethod
    def suggest_targets(dataset: Dataset):
        try:
            df = read_dataframe(dataset.file.path, dataset.file_name)
            suggestions = []
            
            # Blacklisted terms (case-insensitive)
            id_blacklist = ['id', 'uuid', 'index', 'serial', 'timestamp', 'created', 'updated']
            
            # High-confidence target terms (case-insensitive)
            target_boosts = ['attrition', 'price', 'salary', 'disease', 'fraud', 'churn', 'purchased', 'target', 'label', 'class', 'diagnosis', 'loan_status', 'default', 'fake', 'true']
            
            for col in df.columns:
                score = 1
                name_lower = col.lower()
                
                # 1. Identifier & Constant Column Detection (Blacklist)
                is_id = any(term in name_lower for term in id_blacklist) or name_lower.endswith('id')
                nunique = df[col].nunique()
                
                if nunique < 2:
                    continue  # Constant column, cannot be a target
                
                if is_id or (nunique == len(df) and df[col].dtype == 'object'):
                    continue  # It's an ID column
                    
                # Date columns shouldn't be targets
                if 'datetime' in str(df[col].dtype) or 'date' in name_lower:
                    continue
                
                # 2. Semantic Boosting
                if any(x in name_lower for x in target_boosts):
                    score += 3
                elif any(x in name_lower for x in ['status', 'result', 'is_', 'has_']):
                    score += 1
                
                # 3. Data Distribution (Classification vs Regression viability)
                if nunique <= 10:
                    score += 2  # Good for classification
                elif pd.api.types.is_numeric_dtype(df[col]):
                    score += 1  # Good for regression
                
                # Cap score at 5
                final_score = min(score, 5)
                
                suggestions.append({
                    "column": col, 
                    "score": final_score, 
                    "stars": "★" * final_score
                })
            
            suggestions.sort(key=lambda x: x['score'], reverse=True)
            return {"suggestions": suggestions[:10]}
        except Exception as e:
            raise ValidationError(f"Error suggesting targets: {str(e)}")

    @staticmethod
    def preprocess_dataset(dataset: Dataset, config: dict):
        try:
            df = read_dataframe(dataset.file.path, dataset.file_name)
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
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
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
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            
            engine = ModelTrainingEngine(df, target_column, output_dir)
            results = engine.train_and_evaluate()
            
            return results
        except Exception as e:
            raise ValidationError(f"Error training models: {str(e)}")

    @staticmethod
    def run_pipeline(dataset: Dataset, target_column: str):
        try:
            from deployments.models import Deployment
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            
            engine = ModelTrainingEngine(df, target_column, output_dir)
            results = engine.train_and_evaluate()
            
            best = results['best_model']
            # Create deployment
            deployment = Deployment.objects.create(
                project=dataset.project,
                dataset=dataset,
                model_name=best['name'],
                model_path=best['absolute_path'],
                target_column=target_column,
                schema={**best['schema'], 'label_classes': best.get('label_classes'), 'metrics': best['metrics']}
            )
            
            results['deployment_id'] = deployment.id
            return results
        except Exception as e:
            import traceback
            raise ValidationError(f"Error running pipeline: {str(e)} \n {traceback.format_exc()}")

    @staticmethod
    def evaluate_models(dataset: Dataset, target_column: str):
        try:
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
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
