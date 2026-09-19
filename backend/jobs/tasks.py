from jobs.models import MLJob, JobStatus, JobType
from datasets.models import Dataset
import traceback

def handle_job_error(job_id, error_message):
    try:
        job = MLJob.objects.get(id=job_id)
        job.status = JobStatus.FAILED
        job.error_message = error_message
        job.save()
    except Exception:
        pass

def run_train_models_task(job_id, dataset_id, target_column, budget="standard"):
    try:
        import logging
        base_logger = logging.getLogger('django')
        
        job = MLJob.objects.get(id=job_id)
        dataset = Dataset.objects.get(id=dataset_id)
        
        user_id = str(dataset.project.user.id) if dataset.project and dataset.project.user else 'system'
        logger = logging.LoggerAdapter(base_logger, {'job_id': job_id, 'user_id': user_id})
        
        logger.info(f"Starting training pipeline for dataset {dataset_id}")
        
        def update_progress(stage_name, progress_val):
            job.current_stage = stage_name
            job.progress = progress_val
            
            # Map granular states correctly to JobStatus enum
            lower_stage = stage_name.lower()
            if "training" in lower_stage or "model" in lower_stage:
                job.status = JobStatus.TRAINING
            elif "evaluat" in lower_stage:
                job.status = JobStatus.EVALUATING
            elif "explain" in lower_stage or "shap" in lower_stage:
                job.status = JobStatus.EXPLAINING
            elif "saving" in lower_stage or "exporting" in lower_stage:
                job.status = JobStatus.EXPORTING
                
            job.save(update_fields=['current_stage', 'progress', 'status'])
            logger.info(f"Progress update: {stage_name} ({progress_val}%)")
            
        update_progress("Starting model training", 10)
        
        # Import here to avoid circular imports
        from datasets.services import DatasetService
        
        result = DatasetService._sync_run_pipeline(dataset, target_column, update_progress, budget=budget)
        
        job.status = JobStatus.COMPLETED
        job.current_stage = "Pipeline generated successfully"
        job.progress = 100
        
        import uuid
        def _convert_uuids(obj):
            if isinstance(obj, dict):
                return {k: _convert_uuids(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [_convert_uuids(i) for i in obj]
            elif isinstance(obj, uuid.UUID):
                return str(obj)
            return obj
            
        job.result = _convert_uuids(result)
        job.save()
        logger.info(f"Completed training pipeline for dataset {dataset_id}")
        
    except Exception as e:
        import logging
        base_logger = logging.getLogger('django')
        logger = logging.LoggerAdapter(base_logger, {'job_id': job_id, 'user_id': 'system'})
        logger.error(f"Error in run_train_models_task: {e}\n{traceback.format_exc()}")
        # Save a sanitized error message
        from core.exceptions import sanitize_message
        handle_job_error(job_id, sanitize_message(str(e)))

def run_profile_dataset_task(job_id, dataset_id):
    try:
        import logging
        base_logger = logging.getLogger('django')
        
        job = MLJob.objects.get(id=job_id)
        dataset = Dataset.objects.get(id=dataset_id)
        
        user_id = str(dataset.project.user.id) if dataset.project and dataset.project.user else 'system'
        logger = logging.LoggerAdapter(base_logger, {'job_id': job_id, 'user_id': user_id})
        
        logger.info(f"Starting profile task for dataset {dataset_id}")
        
        job.status = JobStatus.PROFILING
        job.current_stage = "Extracting dataset metadata"
        job.progress = 20
        job.save()
        
        from datasets.services import DatasetService
        DatasetService._sync_extract_metadata(dataset)
        
        job.status = JobStatus.WAITING_FOR_TARGET
        job.current_stage = "Waiting for target column selection"
        job.progress = 100
        job.save()
        
        logger.info(f"Finished profile task for dataset {dataset_id}")
        
    except Exception as e:
        import logging
        base_logger = logging.getLogger('django')
        logger = logging.LoggerAdapter(base_logger, {'job_id': job_id, 'user_id': 'system'})
        logger.error(f"Error in run_profile_dataset_task: {e}\n{traceback.format_exc()}")
        from core.exceptions import sanitize_message
        handle_job_error(job_id, sanitize_message(str(e)))
