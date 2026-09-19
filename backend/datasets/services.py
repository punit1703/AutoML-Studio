import pandas as pd
import os
from rest_framework.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from .models import Dataset
from jobs.models import MLJob, JobType, JobStatus
import threading
import json
import math
import os
from django.conf import settings
from ml_engine.analysis import DatasetAnalysisEngine
from ml_engine.preprocessing import DataPreprocessingEngine
from ml_engine.visualization import VisualizationEngine
from ml_engine.training import ModelTrainingEngine
from ml_engine.evaluation import ModelEvaluator
from ml_engine.notebook_generation import NotebookGenerator
from ml_engine.report_generation import ReportGenerator
from ml_engine.utils import read_dataframe
import joblib
import glob

class DatasetService:
    ALLOWED_EXTENSIONS = {
        '.csv': 'CSV'
    }
    
    @staticmethod
    def validate_file(file: UploadedFile):
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in DatasetService.ALLOWED_EXTENSIONS:
            raise ValidationError(f"Unsupported file extension. Allowed extensions are: {', '.join(DatasetService.ALLOWED_EXTENSIONS.keys())}")
        
        # Enforce max file size (e.g., 50MB)
        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 50 * 1024 * 1024)
        if file.size > max_size:
            raise ValidationError(f"File is too large. Maximum allowed size is {max_size / (1024 * 1024):.1f}MB.")
            
        return DatasetService.ALLOWED_EXTENSIONS[ext]

    @staticmethod
    def validate_and_parse_csv(file: UploadedFile):
        import charset_normalizer
        import pandas as pd
        import io
        import csv
        
        if file.size == 0:
            raise ValidationError("The uploaded file is empty.")
            
        # Detect encoding
        file.seek(0)
        raw_data = file.read()
        detected = charset_normalizer.detect(raw_data[:100000])
        encoding = detected.get('encoding', 'utf-8') or 'utf-8'
        
        try:
            text_data = raw_data.decode(encoding)
        except UnicodeDecodeError:
            raise ValidationError(f"Unable to read this CSV with detected encoding ({encoding}). The file might be corrupted.")
            
        # Strict Header and Row Validation using standard CSV module
        try:
            reader = csv.reader(io.StringIO(text_data))
            header = next(reader)
            num_cols = len(header)
            
            if num_cols != len(set(header)):
                dups = set([x for x in header if header.count(x) > 1])
                raise ValidationError(f"Duplicate column names detected: {', '.join(str(d) for d in dups)}")
                
            for col in header:
                if not col or col.strip() == '':
                    raise ValidationError("Missing or empty column headers detected. All columns must have a valid name.")
                    
            # Check for inconsistent column counts across rows
            for i, row in enumerate(reader, start=2):
                if len(row) != num_cols and len(row) > 0: # Ignore empty trailing lines
                    raise ValidationError(f"Inconsistent column count at row {i}. Expected {num_cols}, got {len(row)}.")
                    
        except StopIteration:
            raise ValidationError("The uploaded CSV file contains no data.")
        except ValidationError:
            raise
        except Exception:
            pass # Fallback to pandas
            
        try:
            # Parse CSV
            # Using python engine for better delimiter sniffing
            df = pd.read_csv(io.StringIO(text_data), sep=None, engine='python', on_bad_lines='error')
        except pd.errors.EmptyDataError:
            raise ValidationError("The uploaded CSV file contains no data.")
        except pd.errors.ParserError:
            raise ValidationError("Unable to read this CSV. The file appears to be malformed or contain inconsistent column counts.")
        except Exception as e:
            raise ValidationError(f"Error parsing CSV file: {str(e)}")
            
        if df.empty or len(df.columns) == 0:
            raise ValidationError("The uploaded CSV file contains no valid data rows or columns.")
            
        # Validate schema
        # 1. Duplicate columns
        if len(df.columns) != len(set(df.columns)):
            # Find the duplicates for a better error message
            cols = list(df.columns)
            dups = set([x for x in cols if cols.count(x) > 1])
            raise ValidationError(f"Duplicate column names detected: {', '.join(str(d) for d in dups)}")
            
        # 2. Missing/Empty headers
        for col in df.columns:
            if 'Unnamed:' in str(col) or pd.isna(col) or str(col).strip() == '':
                raise ValidationError("Missing or empty column headers detected. All columns must have a valid name.")
                
        # 3. Completely empty columns
        empty_cols = df.columns[df.isna().all()].tolist()
        if empty_cols:
            raise ValidationError(f"The following columns are completely empty: {', '.join(str(c) for c in empty_cols)}")
            
        # 4. Completely empty rows
        if df.isna().all(axis=1).any():
            raise ValidationError("The dataset contains completely empty rows.")
            
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        file.seek(0)
        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "encoding": encoding,
            "columns": list(df.columns)
        }


            
    @staticmethod
    def _sync_extract_metadata(dataset: Dataset):
        from ml_engine.profiler import DatasetProfiler
        profiler = DatasetProfiler(dataset.file.path)
        metadata = profiler.profile()

        
        dataset.row_count = metadata.get("row_count")
        dataset.column_count = metadata.get("column_count")
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
        
        # Phase 1: Robust CSV Ingestion and Validation
        validation_result = DatasetService.validate_and_parse_csv(file)
        
        import uuid
        # Generate safe filename
        safe_ext = os.path.splitext(file.name)[1].lower()
        file.name = f"{uuid.uuid4()}{safe_ext}"
        
        dataset = Dataset.objects.create(
            project=project,
            file=file,
            file_name=file.name,
            file_type=file_type,
            file_size=file.size,
            row_count=validation_result['row_count'],
            column_count=validation_result['column_count'],
            validation_status='SUCCESS',
            detected_encoding=validation_result['encoding'],
            metadata={'columns': validation_result['columns']}
        )
        
        job = MLJob.objects.create(
            dataset=dataset,
            job_type=JobType.PROFILE_DATASET,
            status=JobStatus.VALIDATING,
            current_stage="Validating dataset"
        )
        
        from jobs.tasks import run_profile_dataset_task
        thread = threading.Thread(target=run_profile_dataset_task, args=(job.id, dataset.id))
        thread.start()
        
        return dataset

    @staticmethod
    def process_multiple_uploads(project, files):
        if not files:
            raise ValidationError("No files provided")
            
        import uuid
        datasets = []
        for file in files:
            file_type = DatasetService.validate_file(file)
            validation_result = DatasetService.validate_and_parse_csv(file)
            
            # Generate safe filename
            safe_ext = os.path.splitext(file.name)[1].lower()
            original_name = file.name
            file.name = f"{uuid.uuid4()}{safe_ext}"
            
            dataset = Dataset.objects.create(
                project=project,
                file=file,
                file_name=file.name,
                file_type=file_type,
                file_size=file.size,
                row_count=validation_result['row_count'],
                column_count=validation_result['column_count'],
                validation_status='SUCCESS',
                detected_encoding=validation_result['encoding'],
                metadata={'columns': validation_result['columns'], 'original_name': original_name}
            )
            job = MLJob.objects.create(
                dataset=dataset,
                job_type=JobType.PROFILE_DATASET,
                status=JobStatus.UPLOADED,
                current_stage="Queued for profiling"
            )
            from jobs.tasks import run_profile_dataset_task
            thread = threading.Thread(target=run_profile_dataset_task, args=(job.id, dataset.id))
            thread.start()
            
            datasets.append(dataset)
            
        if len(datasets) == 1:
            return {"status": "success", "dataset_id": str(datasets[0].id)}
            
        # Analyze relations
        dfs = []
        for ds in datasets:
            dfs.append(read_dataframe(ds.file.path, ds.file_name))
            
        # Check if schemas exactly match
        schemas_match = True
        columns = set(dfs[0].columns)
        for df in dfs[1:]:
            if set(df.columns) != columns:
                schemas_match = False
                break
                
        dataset_info = [{"id": str(ds.id), "name": ds.metadata.get('original_name', ds.file_name), "class_name": os.path.splitext(ds.metadata.get('original_name', ds.file_name))[0].capitalize()} for ds in datasets]
        
        if schemas_match:
            # Check if filenames suggest multi-part
            multipart_keywords = ["part", "split", "fold", "01", "02"]
            is_multipart = False
            for ds in datasets:
                name_lower = ds.metadata.get('original_name', ds.file_name).lower()
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
        
        import uuid
        file_name = f"{uuid.uuid4()}.csv"
        
        merged_dataset = Dataset.objects.create(
            project=project,
            file_name=file_name,
            file_type="CSV",
            file_size=len(csv_buffer.getvalue().encode('utf-8')),
            row_count=len(combined_df),
            column_count=len(combined_df.columns),
            validation_status='SUCCESS',
            detected_encoding='utf-8',
            metadata={'columns': list(combined_df.columns), 'original_name': 'Merged_Dataset.csv'}
        )
        merged_dataset.file.save(file_name, ContentFile(csv_buffer.getvalue().encode('utf-8')))
        
        job = MLJob.objects.create(
            dataset=merged_dataset,
            job_type=JobType.PROFILE_DATASET,
            status=JobStatus.UPLOADED,
            current_stage="Queued for profiling"
        )
        from jobs.tasks import run_profile_dataset_task
        thread = threading.Thread(target=run_profile_dataset_task, args=(job.id, merged_dataset.id))
        thread.start()
        
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
        if not dataset.metadata:
            return {"status": "processing"}
            
        if target_column:
            from ml_engine.ai_recommender import AIDecisionEngine
            ai_engine = AIDecisionEngine()
            
            # Create a localized metadata snapshot with the user's chosen target
            analysis_meta = dict(dataset.metadata)
            analysis_meta['target_column'] = target_column
            
            ai_recommendation = ai_engine.recommend(analysis_meta)
            dataset.metadata['ai_recommendation'] = ai_recommendation
            dataset.save(update_fields=['metadata'])
            
        return dataset.metadata

    @staticmethod
    def suggest_targets(dataset: Dataset):
        if not dataset.metadata:
            return {"suggestions": []}
            
        from ml_engine.target_detector import TargetDetectionEngine
        detector = TargetDetectionEngine(dataset.metadata)
        candidates = detector.detect_targets()
        
        # If AI found a target (from old logic), we could still inject it or boost it,
        # but for now, let's just return the intelligent candidates.
        return {"suggestions": candidates}

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
    def train_models(dataset: Dataset, target_column: str, budget: str = 'standard'):
        try:
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            
            problem_type = dataset.metadata.get('problem_type')
            
            # Generate preprocessing plan
            from ml_engine.preprocessing_recommendation import PreprocessingRecommendationEngine
            plan_engine = PreprocessingRecommendationEngine(dataset.metadata, target_column)
            preprocessing_plan = plan_engine.generate_plan()
            
            engine = ModelTrainingEngine(df, target_column, output_dir, problem_type=problem_type, preprocessing_plan=preprocessing_plan, dataset_profile=dataset.metadata, budget=budget)
            results = engine.train_and_evaluate()
            
            return results
        except Exception as e:
            raise ValidationError(f"Error training models: {str(e)}")

    @staticmethod
    def run_pipeline(dataset: Dataset, target_column: str, budget: str = 'standard'):
        job = MLJob.objects.filter(dataset=dataset).first()
        if not job:
            job = MLJob.objects.create(
                dataset=dataset,
                job_type=JobType.GENERATE_PIPELINE,
                status=JobStatus.TRAINING,
                current_stage="Preparing to train models"
            )
        else:
            job.status = JobStatus.TRAINING
            job.current_stage = "Preparing to train models"
            job.save()
        from jobs.tasks import run_train_models_task
        thread = threading.Thread(target=run_train_models_task, args=(job.id, dataset.id, target_column, budget))
        thread.start()
        
        return {"job_id": str(job.id), "status": "Training started"}

    @staticmethod
    def _sync_run_pipeline(dataset: Dataset, target_column: str, progress_callback=None, budget: str = 'standard'):
        try:
            from deployments.models import Deployment
            df = read_dataframe(dataset.file.path, dataset.file_name)
            
            output_dir = os.path.join(settings.MEDIA_ROOT, 'models', str(dataset.id))
            
            problem_type = dataset.metadata.get('problem_type')
            
            # Generate preprocessing plan
            from ml_engine.preprocessing_recommendation import PreprocessingRecommendationEngine
            plan_engine = PreprocessingRecommendationEngine(dataset.metadata, target_column)
            preprocessing_plan = plan_engine.generate_plan()
            
            engine = ModelTrainingEngine(df, target_column, output_dir, problem_type=problem_type, preprocessing_plan=preprocessing_plan, dataset_profile=dataset.metadata, budget=budget)
            results = engine.train_and_evaluate(progress_callback=progress_callback)
            
            best = results['best_model']
            
            # Create deployment (keep for metadata tracking)
            deployment = Deployment.objects.create(
                project=dataset.project,
                dataset=dataset,
                model_name=best['name'],
                model_path=best['absolute_path'],
                target_column=target_column,
                schema={**best['schema'], 'label_classes': best.get('label_classes'), 'metrics': best['metrics']}
            )
            
            # Generate Notebook and Report
            if progress_callback: progress_callback("Generating Notebook and Report", 95)
            try:
                DatasetService.generate_notebook(dataset, target_column)
                DatasetService.generate_report(dataset, target_column)
            except Exception as inner_e:
                print(f"Warning: Failed to generate report/notebook: {inner_e}")
            
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
                
            problem_type = dataset.metadata.get('problem_type')
            
            # Generate preprocessing plan
            from ml_engine.preprocessing_recommendation import PreprocessingRecommendationEngine
            plan_engine = PreprocessingRecommendationEngine(dataset.metadata, target_column)
            preprocessing_plan = plan_engine.generate_plan()
                
            training_engine = ModelTrainingEngine(df, target_column, output_dir, problem_type=problem_type, preprocessing_plan=preprocessing_plan, dataset_profile=dataset.metadata)
            _, X_test, _, y_test = training_engine._prepare_data(problem_type)
            
            models_results = {}
            eval_engine = ModelEvaluator(problem_type)
            for model_path in glob.glob(os.path.join(output_dir, "*.pkl")) + glob.glob(os.path.join(output_dir, "*.joblib")):
                model_name = os.path.basename(model_path).replace('.pkl', '').replace('.joblib', '').replace('_', ' ').title()
                if model_name.lower() == 'xgboost':
                    model_name = 'XGBoost'
                elif model_name.lower() == 'svm':
                    model_name = 'SVM'
                elif model_name.lower() == 'knn':
                    model_name = 'KNN'
                
                model = joblib.load(model_path)
                models_results[model_name] = eval_engine.evaluate(model, X_test, y_test)
                
            if not models_results:
                raise ValidationError("No saved models found. Please train models first.")
                
            return models_results
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
