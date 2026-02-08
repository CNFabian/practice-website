"""
Analytics Scheduler

Background tasks for periodic score recalculation and snapshot creation.
Supports both APScheduler (lightweight) and Celery (production).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import SessionLocal
from models import User, UserLeadScore, LeadScoreHistory
from analytics.scoring_engine import BatchScoringEngine

logger = logging.getLogger(__name__)


class AnalyticsScheduler:
    """
    Scheduler for analytics tasks.
    Handles score recalculation and historical snapshots.
    """
    
    @staticmethod
    def recalculate_all_scores(
        max_age_hours: Optional[int] = None,
        force: bool = False
    ) -> dict:
        """
        Recalculate scores for all users (or stale scores only).
        
        Args:
            max_age_hours: Only recalculate if last calculated > X hours ago
            force: Force recalculation regardless of age
        
        Returns:
            Summary of recalculation results
        """
        db = SessionLocal()
        try:
            logger.info("Starting batch score recalculation...")
            
            # Get users to recalculate
            if force or max_age_hours is None:
                # Recalculate all users
                user_ids = [u.id for u in db.query(User.id).all()]
            else:
                # Only recalculate stale scores
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
                
                # Users with no score or old score
                users_no_score = db.query(User.id).outerjoin(
                    UserLeadScore, User.id == UserLeadScore.user_id
                ).filter(UserLeadScore.user_id.is_(None)).all()
                
                users_stale_score = db.query(User.id).join(
                    UserLeadScore, User.id == UserLeadScore.user_id
                ).filter(UserLeadScore.last_calculated_at < cutoff_time).all()
                
                user_ids = list(set([u.id for u in users_no_score] + [u.id for u in users_stale_score]))
            
            if not user_ids:
                logger.info("No users need recalculation")
                return {
                    "status": "success",
                    "message": "No users needed recalculation",
                    "total_users": 0,
                    "successful": 0,
                    "failed": 0
                }
            
            logger.info(f"Recalculating scores for {len(user_ids)} users...")
            
            # Batch calculate
            batch_engine = BatchScoringEngine(db)
            result = batch_engine.calculate_scores_for_users(user_ids, update_database=True)
            
            successful = sum(1 for r in result.values() if "error" not in r)
            failed = len(user_ids) - successful
            
            logger.info(f"Recalculation complete: {successful} successful, {failed} failed")
            
            return {
                "status": "success",
                "message": f"Recalculated {successful} of {len(user_ids)} users",
                "total_users": len(user_ids),
                "successful": successful,
                "failed": failed,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in batch recalculation: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        finally:
            db.close()
    
    @staticmethod
    def create_daily_snapshots() -> dict:
        """
        Create daily snapshots of all lead scores for historical tracking.
        Should run once per day.
        
        Returns:
            Summary of snapshot creation
        """
        db = SessionLocal()
        try:
            logger.info("Creating daily lead score snapshots...")
            
            today = datetime.now(timezone.utc).date()
            
            # Get all current lead scores
            lead_scores = db.query(UserLeadScore).all()
            
            if not lead_scores:
                logger.info("No lead scores to snapshot")
                return {
                    "status": "success",
                    "message": "No lead scores to snapshot",
                    "snapshots_created": 0
                }
            
            snapshots_created = 0
            
            for lead_score in lead_scores:
                # Check if snapshot already exists for today
                existing = db.query(LeadScoreHistory).filter(
                    and_(
                        LeadScoreHistory.user_id == lead_score.user_id,
                        LeadScoreHistory.snapshot_date == today
                    )
                ).first()
                
                if existing:
                    continue  # Skip if already exists
                
                # Create snapshot
                snapshot = LeadScoreHistory(
                    user_id=lead_score.user_id,
                    snapshot_date=today,
                    composite_score=lead_score.composite_score,
                    lead_temperature=lead_score.lead_temperature,
                    intent_band=lead_score.intent_band,
                    metrics_json={
                        "engagement_score": float(lead_score.engagement_score),
                        "timeline_urgency_score": float(lead_score.timeline_urgency_score),
                        "help_seeking_score": float(lead_score.help_seeking_score),
                        "learning_velocity_score": float(lead_score.learning_velocity_score),
                        "rewards_score": float(lead_score.rewards_score),
                        "profile_completion_pct": float(lead_score.profile_completion_pct),
                        "available_signals": lead_score.available_signals_count,
                        "total_signals": lead_score.total_signals_count
                    }
                )
                
                db.add(snapshot)
                snapshots_created += 1
            
            db.commit()
            
            logger.info(f"Created {snapshots_created} snapshots")
            
            return {
                "status": "success",
                "message": f"Created {snapshots_created} snapshots for {today}",
                "snapshots_created": snapshots_created,
                "snapshot_date": today.isoformat(),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating snapshots: {e}", exc_info=True)
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        finally:
            db.close()
    
    @staticmethod
    def cleanup_old_events(days_to_keep: int = 90) -> dict:
        """
        Clean up old behavior events to manage database size.
        
        Args:
            days_to_keep: Number of days of events to keep
        
        Returns:
            Summary of cleanup operation
        """
        db = SessionLocal()
        try:
            logger.info(f"Cleaning up events older than {days_to_keep} days...")
            
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)
            
            from models import UserBehaviorEvent
            
            # Count events to delete
            old_events = db.query(UserBehaviorEvent).filter(
                UserBehaviorEvent.created_at < cutoff_date
            ).count()
            
            if old_events == 0:
                logger.info("No old events to clean up")
                return {
                    "status": "success",
                    "message": "No events to clean up",
                    "deleted_count": 0
                }
            
            # Delete old events
            db.query(UserBehaviorEvent).filter(
                UserBehaviorEvent.created_at < cutoff_date
            ).delete()
            
            db.commit()
            
            logger.info(f"Deleted {old_events} old events")
            
            return {
                "status": "success",
                "message": f"Deleted {old_events} events older than {days_to_keep} days",
                "deleted_count": old_events,
                "cutoff_date": cutoff_date.isoformat(),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up events: {e}", exc_info=True)
            db.rollback()
            return {
                "status": "error",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }
        finally:
            db.close()


# ================================
# CELERY TASKS (Production)
# ================================

try:
    from celery import Celery
    from celery.schedules import crontab
    import os
    
    # Initialize Celery
    celery_app = Celery(
        'analytics_tasks',
        broker=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
        backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    )
    
    # Celery configuration
    celery_app.conf.update(
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        timezone='UTC',
        enable_utc=True,
        beat_schedule={
            'recalculate-scores-hourly': {
                'task': 'analytics.scheduler.celery_recalculate_scores',
                'schedule': crontab(minute=0),  # Every hour
            },
            'create-daily-snapshots': {
                'task': 'analytics.scheduler.celery_create_snapshots',
                'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
            },
            'cleanup-old-events-weekly': {
                'task': 'analytics.scheduler.celery_cleanup_events',
                'schedule': crontab(day_of_week=0, hour=3, minute=0),  # Sunday at 3 AM
            }
        }
    )
    
    @celery_app.task(name='analytics.scheduler.celery_recalculate_scores')
    def celery_recalculate_scores():
        """Celery task: Recalculate all scores"""
        logger.info("Celery task: Starting score recalculation")
        result = AnalyticsScheduler.recalculate_all_scores(max_age_hours=1, force=False)
        logger.info(f"Celery task complete: {result}")
        return result
    
    @celery_app.task(name='analytics.scheduler.celery_create_snapshots')
    def celery_create_snapshots():
        """Celery task: Create daily snapshots"""
        logger.info("Celery task: Creating daily snapshots")
        result = AnalyticsScheduler.create_daily_snapshots()
        logger.info(f"Celery task complete: {result}")
        return result
    
    @celery_app.task(name='analytics.scheduler.celery_cleanup_events')
    def celery_cleanup_events():
        """Celery task: Clean up old events"""
        logger.info("Celery task: Cleaning up old events")
        result = AnalyticsScheduler.cleanup_old_events(days_to_keep=90)
        logger.info(f"Celery task complete: {result}")
        return result
    
    CELERY_AVAILABLE = True
    logger.info("Celery tasks registered successfully")

except ImportError:
    CELERY_AVAILABLE = False
    celery_app = None
    logger.warning("Celery not available, scheduled tasks will not run automatically")


# ================================
# APSCHEDULER ALTERNATIVE (Development/Lightweight)
# ================================

class APSchedulerManager:
    """
    Alternative scheduler using APScheduler for development or lightweight deployments.
    Runs in-process with the FastAPI application.
    """
    
    def __init__(self):
        self.scheduler = None
        self.initialized = False
    
    def initialize(self):
        """Initialize APScheduler"""
        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            from apscheduler.triggers.cron import CronTrigger
            
            self.scheduler = BackgroundScheduler()
            
            # Add jobs
            # Recalculate scores every hour
            self.scheduler.add_job(
                func=AnalyticsScheduler.recalculate_all_scores,
                trigger=CronTrigger(minute=0),  # Every hour at minute 0
                id='recalculate_scores_hourly',
                name='Recalculate Lead Scores',
                replace_existing=True,
                kwargs={'max_age_hours': 1, 'force': False}
            )
            
            # Create daily snapshots at 2 AM
            self.scheduler.add_job(
                func=AnalyticsScheduler.create_daily_snapshots,
                trigger=CronTrigger(hour=2, minute=0),  # Daily at 2 AM
                id='create_daily_snapshots',
                name='Create Daily Snapshots',
                replace_existing=True
            )
            
            # Clean up old events weekly (Sunday at 3 AM)
            self.scheduler.add_job(
                func=AnalyticsScheduler.cleanup_old_events,
                trigger=CronTrigger(day_of_week=0, hour=3, minute=0),  # Sunday 3 AM
                id='cleanup_old_events',
                name='Cleanup Old Events',
                replace_existing=True,
                kwargs={'days_to_keep': 90}
            )
            
            self.initialized = True
            logger.info("APScheduler initialized successfully")
            
        except ImportError:
            logger.warning("APScheduler not available, install with: pip install apscheduler")
            self.initialized = False
    
    def start(self):
        """Start the scheduler"""
        if self.scheduler and not self.scheduler.running:
            self.scheduler.start()
            logger.info("APScheduler started")
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler and self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("APScheduler shutdown")


# Global scheduler instance
apscheduler_manager = APSchedulerManager()


def start_scheduler(use_apscheduler: bool = True):
    """
    Start the appropriate scheduler based on configuration.
    
    Args:
        use_apscheduler: Use APScheduler (True) or rely on Celery Beat (False)
    """
    if use_apscheduler:
        logger.info("Starting APScheduler for analytics tasks...")
        apscheduler_manager.initialize()
        apscheduler_manager.start()
    elif CELERY_AVAILABLE:
        logger.info("Celery available - use 'celery -A analytics.scheduler beat' to start scheduler")
    else:
        logger.warning("No scheduler available - install celery or apscheduler")


def stop_scheduler():
    """Stop the scheduler"""
    if apscheduler_manager.initialized:
        apscheduler_manager.shutdown()
