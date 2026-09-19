# AutoML Studio Production Deployment Guide

This guide covers deploying AutoML Studio to a standard Linux server using Docker or bare-metal setup.

## Prerequisites
- PostgreSQL 13+ Server
- Redis (Optional, if Celery is later added)
- Nginx or Load Balancer
- Node.js 18+
- Python 3.12+

---

## 1. Environment Configuration

### Backend
1. Copy `backend/.env.example` to `backend/.env`.
2. Generate secure strings for `SECRET_KEY` and `JWT_SECRET` using:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```
3. Set `DJANGO_SETTINGS_MODULE=config.settings.prod`.
4. Define your `DATABASE_URL` (e.g., `postgres://user:pass@localhost:5432/automl`).
5. Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to point to your frontend domain.

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env.production`.
2. Set `NEXT_PUBLIC_API_URL` to point to the backend domain.

---

## 2. PostgreSQL Configuration
AutoML Studio requires PostgreSQL for proper transaction locking and data consistency (SQLite will face `ObjectInUse` errors during ML multiprocessing).

Ensure your DB has `conn_health_checks=True` applied in Django and that connection pool limits allow for ML workers.

---

## 3. Deployment Steps

### Backend (Gunicorn + Django)
1. Install requirements:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Run Database Migrations:
   ```bash
   python manage.py migrate
   ```
3. Collect Static Files (Whitenoise will serve them):
   ```bash
   python manage.py collectstatic --noinput
   ```
4. Start Gunicorn:
   ```bash
   gunicorn config.wsgi --config gunicorn.conf.py
   ```

*(Note: Run Gunicorn using systemd or supervisord in production)*

### Frontend (Next.js Node Server)
1. Install dependencies:
   ```bash
   npm ci
   ```
2. Build the standalone app:
   ```bash
   npm run build
   ```
3. Run the standalone server:
   ```bash
   NODE_ENV=production node .next/standalone/server.js
   ```
*(Note: Serve using pm2 or systemd)*

---

## 4. File and Model Artifact Storage
By default, models (`.pkl`) and uploaded datasets are stored in `backend/media/`. 
If you scale horizontally (multiple backend servers), you **must** configure S3 or a shared volume. 
Uncomment `DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'` in `prod.py` and provide AWS credentials to use S3.

---

## 5. Background Training Workers
Currently, background training uses Python `threading`. 
**Important considerations:**
- Do not set `max_requests` in Gunicorn, as restarting a worker will abruptly kill training jobs.
- If the server restarts, 'RUNNING' jobs will be orphaned and must be manually restarted or handled by a recovery script.
- For a highly available setup, we recommend swapping `threading.Thread.start()` in `jobs/services.py` with a Celery task.

---

## 6. Logging and Error Monitoring
- Logs are output to `backend/automl_studio.log` and standard out. They include 5MB rotation buffers.
- Unhandled exceptions trigger a root logger `sys.excepthook` which can easily be bridged to Sentry by adding `sentry_sdk.init()` to `prod.py`.
