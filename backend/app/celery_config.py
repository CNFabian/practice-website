"""
Celery Configuration for Analytics Scheduler

This file configures Celery for production use with the analytics scheduler.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Get broker and backend URLs from environment
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Initialize Celery app
celery_app = Celery(
    'nestnavigate_analytics',
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=['analytics.scheduler']  # Import tasks from scheduler module
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        # Recalculate scores every hour
        'recalculate-scores-hourly': {
            'task': 'analytics.scheduler.celery_recalculate_scores',
            'schedule': crontab(minute=0),  # Every hour on the hour
            'options': {
                'expires': 3300,  # Task expires after 55 minutes
            }
        },
        
        # Create daily snapshots at 2 AM UTC
        'create-daily-snapshots': {
            'task': 'analytics.scheduler.celery_create_snapshots',
            'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM UTC
            'options': {
                'expires': 7200,  # Task expires after 2 hours
            }
        },
        
        # Clean up old events weekly (Sunday at 3 AM UTC)
        'cleanup-old-events-weekly': {
            'task': 'analytics.scheduler.celery_cleanup_events',
            'schedule': crontab(day_of_week=0, hour=3, minute=0),  # Sunday 3 AM UTC
            'options': {
                'expires': 7200,  # Task expires after 2 hours
            }
        }
    }
)

# Set database session configuration
celery_app.conf.task_routes = {
    'analytics.scheduler.*': {'queue': 'analytics'},
}

if __name__ == '__main__':
    celery_app.start()
