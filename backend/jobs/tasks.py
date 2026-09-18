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

def run_train_models_task(job_id, dataset_id, target_column):
    try:
        job = MLJob.objects.get(id=job_id)
        dataset = Dataset.objects.get(id=dataset_id)
        
        def update_progress(stage_name, progress_val):
            job.current_stage = stage_name
            job.progress = progress_val
            job.save(update_fields=['current_stage', 'progress'])
            
        update_progress("Starting model training", 10)
        
        # Import here to avoid circular imports
        from datasets.services import DatasetService
        
        result = DatasetService._sync_run_pipeline(dataset, target_column, update_progress)
        
        update_progress("Pipeline generated successfully", 100)
        job.result = result
        job.save()
        
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        handle_job_error(job_id, error_msg)

def run_profile_dataset_task(job_id, dataset_id):
    try:
        job = MLJob.objects.get(id=job_id)
        dataset = Dataset.objects.get(id=dataset_id)
        
        job.status = JobStatus.PROFILING
        job.current_stage = "Extracting dataset metadata"
        job.progress = 20
        job.save()
        
        from datasets.services import DatasetService
        DatasetService._sync_extract_metadata(dataset)
        
        job.status = JobStatus.COMPLETED
        job.current_stage = "Profiling completed"
        job.progress = 100
        job.save()
        
    except Exception as e:
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        handle_job_error(job_id, error_msg)
