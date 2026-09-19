# Go-Live Checklist

Before pointing live traffic to AutoML Studio, complete the following checks:

## Environment & Secrets
- [ ] `DJANGO_SETTINGS_MODULE` is explicitly set to `config.settings.prod`.
- [ ] `SECRET_KEY` is securely generated and not tracked in Git.
- [ ] `JWT_SECRET` is securely generated.
- [ ] `.env` files are excluded from source control.

## Database
- [ ] Application connects successfully to a remote PostgreSQL database.
- [ ] `DATABASE_URL` is set.
- [ ] Database migrations (`python manage.py migrate`) run successfully against the production DB.
- [ ] Local SQLite files (`db.sqlite3`) are deleted or not used.

## Backend Validation
- [ ] `/api/health/` returns `200 OK`.
- [ ] Static files are successfully served by Whitenoise (e.g. `/api/schema/swagger-ui/` loads correctly).
- [ ] Media uploads work and persist (Verify `MEDIA_ROOT` permissions).
- [ ] Gunicorn starts successfully with `gunicorn.conf.py` (Worker count > 1).
- [ ] Logging outputs successfully to `automl_studio.log`.

## Security
- [ ] `ALLOWED_HOSTS` only contains the production IP/Domain.
- [ ] `CORS_ALLOWED_ORIGINS` strictly specifies the frontend domain.
- [ ] User datasets (`/media/datasets/`) are properly isolated via the API (Tested via security tests).

## Frontend Validation
- [ ] Next.js standalone server builds successfully.
- [ ] Next.js standalone server runs without errors.
- [ ] Frontend successfully hits Backend API routes (Check CORS config).

## E2E Machine Learning Flow Verification
- [ ] Login/Register.
- [ ] Upload a 10MB+ CSV (Confirm no Nginx/Gunicorn timeout or max body size limits hit).
- [ ] Select Target and observe Profiler results.
- [ ] Run a fast training pipeline.
- [ ] Monitor the progress (Ensure background thread stays alive).
- [ ] View training results.
- [ ] Download the `.pkl` artifact.
- [ ] Verify the `.pkl` artifact can be loaded in an external Python script.
