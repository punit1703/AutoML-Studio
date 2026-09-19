import multiprocessing
import os

# Gunicorn configuration for AutoML Studio

# Binding
bind = "0.0.0.0:8000"

# Workers
# For ML workloads, we need longer timeouts and careful memory management.
# 2-4 workers is a good starting point depending on server CPU cores.
workers = multiprocessing.cpu_count() * 2 + 1
threads = 4

# Timeouts
# ML training jobs can take time before they successfully hand off to the background thread.
# File uploads (datasets) might also take time.
timeout = 300  # 5 minutes
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Background tasks warning:
# Since we are using Python `threading` for background jobs currently, 
# restarting Gunicorn workers will kill active training jobs.
# `max_requests` should be disabled or set very high to prevent premature worker recycling.
max_requests = 0

def on_starting(server):
    """
    Log when the server starts.
    """
    server.log.info("AutoML Studio Gunicorn server starting...")
