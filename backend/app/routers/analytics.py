"""
Analytics Router

API endpoints for lead analytics and scoring.
Admin-only access for lead data, optional user-facing progress endpoint.
"""
from datetime import datetime, timedelta
import time
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from database import get_db
from auth import get_current_user, get_current_admin_user
from models import (
    User, UserLeadScore, LeadScoreHistory, UserOnboarding,
    UserLessonProgress, UserModuleProgress, UserBadge, UserCoinBalance,
    LeadTemperature, IntentBand
)
from schemas import (
    LeadScoreResponse, LeadSummary, LeadDetailResponse,
    LeadScoreHistoryResponse, AnalyticsInsightsResponse,
    UserProgressResponse, RecalculationRequest, RecalculationResponse,
    SuccessResponse
)
from analytics.scoring_engine import ScoringEngine, BatchScoringEngine
from analytics.classifier import LeadClassifier, BulkClassifier
from analytics.admin_dashboard import AnalyticsDashboard

router = APIRouter()


# ================================
# USER-FACING ENDPOINTS (Optional)
# ================================

@router.get("/my-progress", response_model=UserProgressResponse)
def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's own progress metrics (non-sensitive).
    Does not expose lead scores, only engagement metrics.
    """
    # Get lesson and module progress
    lessons_completed = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.status == 'completed'
        )
    ).count()
    
    modules_completed = db.query(UserModuleProgress).filter(
        and_(
            UserModuleProgress.user_id == current_user.id,
            UserModuleProgress.status == 'completed'
        )
    ).count()
    
    # Get badges
    badges_count = db.query(UserBadge).filter(
        UserBadge.user_id == current_user.id
    ).count()
    
    # Get coin balance
    coin_balance = db.query(UserCoinBalance).filter(
        UserCoinBalance.user_id == current_user.id
    ).first()
    
    coins = coin_balance.current_balance if coin_balance else 0
    
    # Calculate engagement level (simplified)
    engagement_score = 0
    if lessons_completed > 0:
        engagement_score += 30
    if modules_completed > 0:
        engagement_score += 30
    if badges_count > 0:
        engagement_score += 20
    if coins > 100:
        engagement_score += 20
    
    engagement_level = "Low"
    if engagement_score >= 70:
        engagement_level = "High"
    elif engagement_score >= 40:
        engagement_level = "Medium"
    
    # Calculate progress percentage (simplified)
    total_modules = db.query(func.count(UserModuleProgress.id)).filter(
        UserModuleProgress.user_id == current_user.id
    ).scalar() or 1
    
    progress_pct = (modules_completed / total_modules * 100) if total_modules > 0 else 0
    
    return UserProgressResponse(
        user_id=current_user.id,
        engagement_level=engagement_level,
        progress_percentage=round(progress_pct, 2),
        lessons_completed=lessons_completed,
        modules_completed=modules_completed,
        badges_earned=badges_count,
        coins_balance=coins,
        recent_achievements=[]  # TODO: Implement recent achievements
    )


# ================================
# ADMIN-ONLY ENDPOINTS
# ================================

@router.get("/leads", response_model=List[LeadSummary])
def get_all_leads(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    temperature: Optional[str] = Query(None, description="Filter by temperature (hot_lead, warm_lead, cold_lead, dormant)"),
    intent: Optional[str] = Query(None, description="Filter by intent (very_high_intent, high_intent, medium_intent, low_intent)"),
    min_score: Optional[float] = Query(None, ge=0, le=1000, description="Minimum composite score"),
    max_score: Optional[float] = Query(None, ge=0, le=1000, description="Maximum composite score"),
    min_completion: Optional[float] = Query(None, ge=0, le=100, description="Minimum profile completion %"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """
    Get all leads with filtering options.
    Admin only.
    """
    # Build query
    query = db.query(User, UserLeadScore).outerjoin(
        UserLeadScore, User.id == UserLeadScore.user_id
    )
    
    # Apply filters
    if temperature:
        query = query.filter(UserLeadScore.lead_temperature == temperature)
    
    if intent:
        query = query.filter(UserLeadScore.intent_band == intent)
    
    if min_score is not None:
        query = query.filter(UserLeadScore.composite_score >= min_score)
    
    if max_score is not None:
        query = query.filter(UserLeadScore.composite_score <= max_score)
    
    if min_completion is not None:
        query = query.filter(UserLeadScore.profile_completion_pct >= min_completion)
    
    # Order by composite score descending
    query = query.order_by(desc(UserLeadScore.composite_score))
    
    # Paginate
    results = query.offset(offset).limit(limit).all()
    
    # Format response
    leads = []
    for user, lead_score in results:
        if lead_score:
            # Get temperature and intent labels
            classification = {
                "temperature": lead_score.lead_temperature,
                "intent_band": lead_score.intent_band
            }
            temp_label = LeadClassifier._get_temperature_label(
                LeadTemperature(lead_score.lead_temperature)
            ) if lead_score.lead_temperature else None
            intent_label = LeadClassifier._get_intent_label(
                IntentBand(lead_score.intent_band)
            ) if lead_score.intent_band else None
            
            leads.append(LeadSummary(
                user_id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                composite_score=float(lead_score.composite_score),
                lead_temperature=lead_score.lead_temperature,
                temperature_label=temp_label,
                intent_band=lead_score.intent_band,
                intent_label=intent_label,
                profile_completion_pct=float(lead_score.profile_completion_pct),
                last_activity_at=lead_score.last_activity_at,
                created_at=user.created_at
            ))
        else:
            # User with no score yet
            leads.append(LeadSummary(
                user_id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                composite_score=0.0,
                lead_temperature=None,
                temperature_label=None,
                intent_band=None,
                intent_label=None,
                profile_completion_pct=0.0,
                last_activity_at=None,
                created_at=user.created_at
            ))
    
    return leads


@router.get("/leads/hot", response_model=List[LeadSummary])
def get_hot_leads(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Quick access to hot leads (score >= 800).
    Admin only.
    """
    return get_all_leads(
        current_user=current_user,
        db=db,
        temperature="hot_lead",
        intent=None,
        min_score=None,
        max_score=None,
        min_completion=None,
        limit=limit,
        offset=0
    )


@router.get("/leads/{user_id}", response_model=LeadDetailResponse)
def get_lead_detail(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed lead information for a specific user.
    Admin only.
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get lead score
    lead_score = db.query(UserLeadScore).filter(
        UserLeadScore.user_id == user_id
    ).first()
    
    if not lead_score:
        # Calculate scores if not available
        engine = ScoringEngine(db, user_id)
        scores = engine.calculate_with_classification()
        
        # Save to database
        batch_engine = BatchScoringEngine(db)
        batch_engine._save_scores_to_db(user_id, scores)
        
        # Refresh
        lead_score = db.query(UserLeadScore).filter(
            UserLeadScore.user_id == user_id
        ).first()
    
    # Get classification with recommendations
    scores_dict = {
        "composite_score": float(lead_score.composite_score),
        "engagement_score": float(lead_score.engagement_score),
        "timeline_urgency_score": float(lead_score.timeline_urgency_score),
        "help_seeking_score": float(lead_score.help_seeking_score),
        "learning_velocity_score": float(lead_score.learning_velocity_score),
        "rewards_score": float(lead_score.rewards_score),
        "profile_completion_pct": float(lead_score.profile_completion_pct)
    }
    
    classification = LeadClassifier.classify_and_recommend(scores_dict)
    
    # Get onboarding data
    onboarding = db.query(UserOnboarding).filter(
        UserOnboarding.user_id == user_id
    ).first()
    
    onboarding_data = None
    if onboarding:
        onboarding_data = {
            "selected_avatar": onboarding.selected_avatar,
            "has_realtor": onboarding.has_realtor,
            "has_loan_officer": onboarding.has_loan_officer,
            "wants_expert_contact": onboarding.wants_expert_contact,
            "homeownership_timeline_months": onboarding.homeownership_timeline_months,
            "zipcode": onboarding.zipcode,
            "completed_at": onboarding.completed_at.isoformat() if onboarding.completed_at else None
        }
    
    return LeadDetailResponse(
        user_id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        scores=LeadScoreResponse(
            user_id=lead_score.user_id,
            engagement_score=float(lead_score.engagement_score),
            timeline_urgency_score=float(lead_score.timeline_urgency_score),
            help_seeking_score=float(lead_score.help_seeking_score),
            learning_velocity_score=float(lead_score.learning_velocity_score),
            rewards_score=float(lead_score.rewards_score),
            composite_score=float(lead_score.composite_score),
            lead_temperature=lead_score.lead_temperature,
            intent_band=lead_score.intent_band,
            profile_completion_pct=float(lead_score.profile_completion_pct),
            available_signals_count=lead_score.available_signals_count,
            total_signals_count=lead_score.total_signals_count,
            last_calculated_at=lead_score.last_calculated_at,
            last_activity_at=lead_score.last_activity_at
        ),
        temperature=classification.get("temperature"),
        temperature_label=classification.get("temperature_label"),
        intent_band=classification.get("intent_band"),
        intent_label=classification.get("intent_label"),
        classification_reasoning=classification.get("classification_reasoning"),
        recommended_actions=classification.get("recommended_actions"),
        onboarding_data=onboarding_data
    )


@router.get("/leads/{user_id}/history", response_model=List[LeadScoreHistoryResponse])
def get_lead_history(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    limit: int = Query(30, ge=1, le=365)
):
    """
    Get historical lead score snapshots for a user.
    Admin only.
    """
    history = db.query(LeadScoreHistory).filter(
        LeadScoreHistory.user_id == user_id
    ).order_by(desc(LeadScoreHistory.snapshot_date)).limit(limit).all()
    
    return [
        LeadScoreHistoryResponse(
            snapshot_date=h.snapshot_date.isoformat(),
            composite_score=float(h.composite_score),
            lead_temperature=h.lead_temperature,
            intent_band=h.intent_band,
            metrics=h.metrics_json
        )
        for h in history
    ]


@router.get("/insights", response_model=AnalyticsInsightsResponse)
def get_analytics_insights(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get aggregate analytics insights across all leads.
    Admin only.
    """
    # Get all lead scores
    lead_scores = db.query(UserLeadScore).all()
    
    if not lead_scores:
        return AnalyticsInsightsResponse(
            total_leads=0,
            temperature_distribution={},
            intent_distribution={},
            average_composite_score=0.0,
            average_profile_completion=0.0,
            high_priority_leads=0,
            actionable_leads=0
        )
    
    # Calculate distributions
    temp_counts = {}
    intent_counts = {}
    total_score = 0.0
    total_completion = 0.0
    
    for score in lead_scores:
        # Temperature
        temp = score.lead_temperature or "unknown"
        temp_counts[temp] = temp_counts.get(temp, 0) + 1
        
        # Intent
        intent = score.intent_band or "unknown"
        intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        # Averages
        total_score += float(score.composite_score)
        total_completion += float(score.profile_completion_pct)
    
    total = len(lead_scores)
    
    # Format distributions
    temp_distribution = {
        temp: {
            "count": count,
            "percentage": round((count / total * 100), 2)
        }
        for temp, count in temp_counts.items()
    }
    
    intent_distribution = {
        intent: {
            "count": count,
            "percentage": round((count / total * 100), 2)
        }
        for intent, count in intent_counts.items()
    }
    
    # High priority and actionable leads
    high_priority = temp_counts.get("hot_lead", 0)
    actionable = high_priority + temp_counts.get("warm_lead", 0)
    
    return AnalyticsInsightsResponse(
        total_leads=total,
        temperature_distribution=temp_distribution,
        intent_distribution=intent_distribution,
        average_composite_score=round(total_score / total, 2),
        average_profile_completion=round(total_completion / total, 2),
        high_priority_leads=high_priority,
        actionable_leads=actionable
    )


@router.get("/dashboard")
def get_analytics_dashboard(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics dashboard data.
    Includes distributions, top leads, recent events, and engagement metrics.
    Admin only.
    """
    return AnalyticsDashboard.get_dashboard_data(db)


@router.post("/recalculate", response_model=RecalculationResponse)
def recalculate_scores(
    request: RecalculationRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Trigger manual recalculation of lead scores.
    Admin only.
    
    Can recalculate specific users or all users.
    """
    start_time = time.time()
    
    batch_engine = BatchScoringEngine(db)
    
    if request.user_ids:
        # Recalculate specific users
        results = batch_engine.calculate_scores_for_users(
            request.user_ids,
            update_database=True
        )
        total_users = len(request.user_ids)
    else:
        # Recalculate all users
        result = batch_engine.calculate_all_users(update_database=True)
        results = result["results"]
        total_users = result["total_users"]
    
    # Count successes and failures
    successful = sum(1 for r in results.values() if "error" not in r)
    failed = total_users - successful
    
    execution_time = time.time() - start_time
    
    return RecalculationResponse(
        success=True,
        message=f"Recalculated scores for {successful} of {total_users} users",
        total_users=total_users,
        successful=successful,
        failed=failed,
        execution_time_seconds=round(execution_time, 2)
    )


@router.post("/calculate/{user_id}", response_model=SuccessResponse)
def calculate_user_score(
    user_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Calculate/recalculate score for a specific user.
    Admin only.
    """
    # Check user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Calculate scores
    engine = ScoringEngine(db, user_id)
    scores = engine.calculate_with_classification()
    
    # Save to database
    batch_engine = BatchScoringEngine(db)
    batch_engine._save_scores_to_db(user_id, scores)
    
    return SuccessResponse(
        message=f"Successfully calculated scores for user {user_id}",
        data={
            "composite_score": scores["composite_score"],
            "temperature": scores["classification"]["temperature"],
            "intent": scores["classification"]["intent_band"]
        }
    )


# =======================================
# SCHEDULER MANAGEMENT ENDPOINTS
# =======================================

@router.post("/scheduler/recalculate-all")
def trigger_batch_recalculation(
    max_age_hours: Optional[int] = None,
    force: bool = False,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger batch recalculation of all lead scores.
    Admin only.
    
    Query params:
    - max_age_hours: Only recalculate scores older than X hours (default: all)
    - force: Force recalculation even if recent (default: false)
    """
    from analytics.scheduler import AnalyticsScheduler
    
    result = AnalyticsScheduler.recalculate_all_scores(
        max_age_hours=max_age_hours,
        force=force
    )
    
    return result


@router.post("/scheduler/create-snapshots")
def trigger_snapshot_creation(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger creation of daily lead score snapshots.
    Admin only.
    """
    from analytics.scheduler import AnalyticsScheduler
    
    result = AnalyticsScheduler.create_daily_snapshots()
    
    return result


@router.post("/scheduler/cleanup-events")
def trigger_event_cleanup(
    days_to_keep: int = 90,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger cleanup of old behavior events.
    Admin only.
    
    Query params:
    - days_to_keep: Number of days of events to keep (default: 90)
    """
    from analytics.scheduler import AnalyticsScheduler
    
    result = AnalyticsScheduler.cleanup_old_events(days_to_keep=days_to_keep)
    
    return result


@router.get("/scheduler/status")
def get_scheduler_status(
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get scheduler status and configuration.
    Admin only.
    """
    from analytics.scheduler import CELERY_AVAILABLE, apscheduler_manager
    import os
    
    scheduler_type = "celery" if os.getenv("USE_APSCHEDULER", "true").lower() != "true" else "apscheduler"
    
    status_info = {
        "scheduler_type": scheduler_type,
        "celery_available": CELERY_AVAILABLE,
        "apscheduler_initialized": apscheduler_manager.initialized,
        "apscheduler_running": apscheduler_manager.scheduler.running if apscheduler_manager.scheduler else False,
        "scheduled_jobs": []
    }
    
    # Get scheduled jobs info
    if apscheduler_manager.scheduler and apscheduler_manager.scheduler.running:
        jobs = apscheduler_manager.scheduler.get_jobs()
        status_info["scheduled_jobs"] = [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None
            }
            for job in jobs
        ]
    
    return status_info
