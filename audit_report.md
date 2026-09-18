# AutoML Studio - System Audit Report

## 1. Current Architecture

The project is structured as a decoupled full-stack monorepo:

### **Frontend**
*   **Framework**: Next.js 16 (App Router), React 19, TypeScript
*   **Styling & UI**: Tailwind CSS v4, `shadcn/ui` style components, Framer Motion for animations
*   **Data Fetching**: Axios paired with TanStack React Query. API endpoints are configured in `lib/api.ts`.
*   **State**: React Context API (`AppContext`) for managing active `projectId` and `datasetId`. `localStorage` is used for auth tokens and temporary target column selections.

### **Backend**
*   **Framework**: Django 6 with Django REST Framework (DRF)
*   **Authentication**: JWT Authentication (`rest_framework_simplejwt`)
*   **Core Logic (`ml_engine`)**: A fully implemented set of Python classes handling data profiling, preprocessing, model training (Scikit-Learn, LightGBM, XGBoost), evaluation, and explainability (SHAP).
*   **Background Jobs**: Handled via standard Python `threading.Thread` (in `datasets/services.py`).
*   **Database**: SQLite (`db.sqlite3`) for local development, with dependencies installed for PostgreSQL (`psycopg2-binary`).

---

## 2. Existing Functionality Mapping (Goal Workflow)

*   **CSV Upload**: **Working**. Handled by `upload_multiple` API and `DatasetUploadPage`. Includes intelligent schema matching for multipart/class-separated files.
*   **Dataset Profiling**: **Working**. Implemented via `ml_engine.profiler.DatasetProfiler`.
*   **Target Column Detection**: **Working**. Implemented via `ml_engine.ai_recommender.AIDecisionEngine`.
*   **Problem Type Detection**: **Working**. Implemented inside `ml_engine.training.ModelTrainingEngine` (`_detect_problem_type`).
*   **Intelligent Preprocessing**: **Working**. Implemented via `ml_engine.preprocessing.DataPreprocessingEngine`.
*   **Smart Model Selection**: **Working**. Trains XGBoost, LightGBM, and Random Forest based on problem type.
*   **Resource-Aware Training**: **Partially Implemented**. Jobs execute asynchronously, but use standard Python threading instead of a robust worker queue (like Celery), which is prone to memory leaks and dropped jobs.
*   **Model Evaluation**: **Working**. Implemented via `ml_engine.evaluation.ModelEvaluationEngine`.
*   **Explainability**: **Working**. Implemented via `ml_engine.explainability`.
*   **Export complete pipeline (.pkl)**: **Working**. Available for download via the `/api/v1/datasets/{id}/download_model/` endpoint. Also supports Notebook (`.ipynb`) and Report (`.pdf`) generation.

---

## 3. Detailed Component Status

### **Working Functionality**
*   **Authentication**: Complete JWT flow (Register, Login, Token Refresh, Profile).
*   **Dataset Management**: File uploading, basic parsing, schema validation, and multi-file intelligent merging.
*   **Pipeline Execution**: The entire end-to-end ML pipeline runs asynchronously and tracks progress via `MLJob` models.
*   **Artifact Generation**: Successfully generates pickled scikit-learn pipelines, Jupyter notebooks, and PDF evaluation reports.
*   **Model Registry (Deployments)**: Tracks generated pipelines accurately without over-extending into unnecessary web-app generation.

### **Partially Implemented Functionality**
*   **Target Column Selection**: The UI logic relies heavily on `localStorage.getItem('target_column_${datasetId}')` before running the pipeline. While functional, it is fragile.
*   **Dashboard Analytics**: The `/api/v1/projects/dashboard_stats/` uses some hardcoded approximations for "compute time" rather than actual tracked job durations.

### **Broken Functionality**
*   *No strictly broken functionality found that prevents the platform from running.*

### **Missing Functionality**
*   **Task Queue**: No robust task queue (e.g., Celery, Redis).

### **Unused / Dead Functionality & Mockups**
*   Some frontend routes like `/studio/apps`, `/studio/dashboard`, `/studio/deployments`, and `/studio/experiments` act mostly as visual shells or simple registries that aren't deeply integrated with the core "Upload -> Train -> Download" flow.

---

## 4. Technical Debt & Issues Identified

1.  **Threading for Background Jobs**: Using `threading.Thread` in Django views/services is highly discouraged for long-running ML tasks. If the Django server restarts, all running training threads are killed instantly. 
2.  **State Management**: Passing critical workflow state (like `target_column`) via `localStorage` between Next.js pages can lead to race conditions or stale data if the user opens multiple tabs.
3.  **Database Scalability**: Currently using SQLite. Large ML pipelines generating heavy metadata might lock the database during concurrent operations.
4.  **Error Handling in Pipeline**: If an ML job fails inside the thread, the UI just receives an error string. There is no automated retry mechanism.

---

## 5. Recommended Implementation Order (Next Steps)

1.  **Refactor Background Tasks**: Replace `threading.Thread` with a proper task queue system (like Celery + Redis or Django-Q) to make training jobs crash-resilient and resource-aware.
2.  **Consolidate Workflow State**: Move the target column selection out of `localStorage` and either store it in the database `Dataset` model or manage it via robust React Context / Zustand.
3.  **Clean up UI Mockups**: Hide or remove unnecessary frontend routes (`/studio/apps`, etc.) to strictly focus the user experience on generating the downloadable `.pkl` artifact.
4.  **Database Migration**: Transition from SQLite to PostgreSQL for better concurrency handling during long ML jobs.
