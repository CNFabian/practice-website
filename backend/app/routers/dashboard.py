from datetime import datetime, timedelta
from typing import List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from database import get_db
from auth import get_current_user
from models import (
    User, UserCoinBalance, UserBadge, Badge, UserModuleProgress, 
    Module, UserLessonProgress, Lesson, UserCoinTransaction,
    UserQuizAttempt, Notification
)
from schemas import (
    DashboardOverview, ModuleProgress, ModuleResponse, 
    UserBadgeResponse, BadgeResponse, CoinBalanceResponse,
    CoinTransactionResponse, LessonResponse
)
from utils import DashboardManager, OnboardingManager

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard overview with key metrics"""
    # Check if onboarding is complete
    if not OnboardingManager.is_onboarding_complete(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete onboarding first"
        )
    
    stats = DashboardManager.get_user_stats(db, current_user.id)
    
    return DashboardOverview(
        total_coins=stats["total_coins"],
        total_badges=stats["total_badges"],
        modules_completed=stats["modules_completed"],
        total_modules=stats["total_modules"],
        current_streak=stats["current_streak"],
        recent_achievements=stats["recent_achievements"],
        next_lesson=stats.get("next_lesson")
    )


@router.get("/modules", response_model=List[ModuleProgress])
def get_user_module_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user progress for all modules"""
    # Get all active modules
    modules = db.query(Module).filter(Module.is_active == True).order_by(Module.order_index).all()
    
    module_progress_list = []
    
    for module in modules:
        # Get user progress for this module
        user_progress = db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == current_user.id,
                UserModuleProgress.module_id == module.id
            )
        ).first()
        
        if user_progress:
            progress = ModuleProgress(
                module=ModuleResponse(
                    id=module.id,
                    title=module.title,
                    description=module.description,
                    thumbnail_url=module.thumbnail_url,
                    order_index=module.order_index,
                    is_active=module.is_active,
                    prerequisite_module_id=module.prerequisite_module_id,
                    estimated_duration_minutes=module.estimated_duration_minutes,
                    difficulty_level=module.difficulty_level,
                    created_at=module.created_at,
                    lesson_count=user_progress.total_lessons
                ),
                lessons_completed=user_progress.lessons_completed,
                total_lessons=user_progress.total_lessons,
                completion_percentage=user_progress.completion_percentage,
                status=user_progress.status
            )
        else:
            # Count total lessons for this module
            lesson_count = db.query(Lesson).filter(
                and_(Lesson.module_id == module.id, Lesson.is_active == True)
            ).count()
            
            progress = ModuleProgress(
                module=ModuleResponse(
                    id=module.id,
                    title=module.title,
                    description=module.description,
                    thumbnail_url=module.thumbnail_url,
                    order_index=module.order_index,
                    is_active=module.is_active,
                    prerequisite_module_id=module.prerequisite_module_id,
                    estimated_duration_minutes=module.estimated_duration_minutes,
                    difficulty_level=module.difficulty_level,
                    created_at=module.created_at,
                    lesson_count=lesson_count
                ),
                lessons_completed=0,
                total_lessons=lesson_count,
                completion_percentage=0.0,
                status="not_started"
            )
        
        module_progress_list.append(progress)
    
    return module_progress_list


@router.get("/badges", response_model=List[UserBadgeResponse])
def get_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all badges earned by the user"""
    user_badges = db.query(UserBadge).join(Badge).filter(
        UserBadge.user_id == current_user.id
    ).order_by(desc(UserBadge.earned_at)).all()
    
    return [
        UserBadgeResponse(
            id=ub.id,
            badge=BadgeResponse(
                id=ub.badge.id,
                name=ub.badge.name,
                description=ub.badge.description,
                icon_url=ub.badge.icon_url,
                badge_type=ub.badge.badge_type,
                rarity=ub.badge.rarity,
                created_at=ub.badge.created_at
            ),
            earned_at=ub.earned_at,
            source_lesson_id=ub.source_lesson_id
        )
        for ub in user_badges
    ]


@router.get("/coins", response_model=CoinBalanceResponse)
def get_coin_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's coin balance"""
    balance = db.query(UserCoinBalance).filter(UserCoinBalance.user_id == current_user.id).first()
    
    if not balance:
        # Create initial balance if it doesn't exist
        balance = UserCoinBalance(user_id=current_user.id)
        db.add(balance)
        db.commit()
        db.refresh(balance)
    
    return CoinBalanceResponse(
        current_balance=balance.current_balance,
        lifetime_earned=balance.lifetime_earned,
        lifetime_spent=balance.lifetime_spent,
        updated_at=balance.updated_at
    )


@router.get("/transactions", response_model=List[CoinTransactionResponse])
def get_coin_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    """Get user's coin transaction history"""
    transactions = db.query(UserCoinTransaction).filter(
        UserCoinTransaction.user_id == current_user.id
    ).order_by(desc(UserCoinTransaction.created_at)).offset(offset).limit(limit).all()
    
    return [
        CoinTransactionResponse(
            id=t.id,
            transaction_type=t.transaction_type,
            amount=t.amount,
            source_type=t.source_type,
            description=t.description,
            created_at=t.created_at
        )
        for t in transactions
    ]


@router.get("/statistics")
def get_user_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive user statistics"""
    # Basic stats
    coin_balance = db.query(UserCoinBalance).filter(UserCoinBalance.user_id == current_user.id).first()
    badge_count = db.query(UserBadge).filter(UserBadge.user_id == current_user.id).count()
    
    # Learning progress
    total_modules = db.query(Module).filter(Module.is_active == True).count()
    completed_modules = db.query(UserModuleProgress).filter(
        and_(
            UserModuleProgress.user_id == current_user.id,
            UserModuleProgress.status == "completed"
        )
    ).count()
    
    total_lessons = db.query(Lesson).join(Module).filter(
        and_(Lesson.is_active == True, Module.is_active == True)
    ).count()
    completed_lessons = db.query(UserLessonProgress).join(Lesson).join(Module).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.status == "completed",
            Lesson.is_active == True,
            Module.is_active == True
        )
    ).count()
    
    # Quiz statistics
    total_quizzes_taken = db.query(UserQuizAttempt).filter(
        UserQuizAttempt.user_id == current_user.id
    ).count()
    
    quizzes_passed = db.query(UserQuizAttempt).filter(
        and_(
            UserQuizAttempt.user_id == current_user.id,
            UserQuizAttempt.passed == True
        )
    ).count()
    
    avg_quiz_score = db.query(func.avg(UserQuizAttempt.score)).filter(
        UserQuizAttempt.user_id == current_user.id
    ).scalar() or 0
    
    # Time-based statistics
    today = datetime.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    lessons_this_week = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.completed_at >= week_ago,
            UserLessonProgress.status == "completed"
        )
    ).count()
    
    coins_earned_this_month = db.query(func.sum(UserCoinTransaction.amount)).filter(
        and_(
            UserCoinTransaction.user_id == current_user.id,
            UserCoinTransaction.transaction_type == "earned",
            UserCoinTransaction.created_at >= month_ago
        )
    ).scalar() or 0
    
    return {
        "coin_balance": {
            "current": coin_balance.current_balance if coin_balance else 0,
            "lifetime_earned": coin_balance.lifetime_earned if coin_balance else 0,
            "lifetime_spent": coin_balance.lifetime_spent if coin_balance else 0,
            "earned_this_month": coins_earned_this_month
        },
        "badges": {
            "total": badge_count
        },
        "learning": {
            "modules": {
                "completed": completed_modules,
                "total": total_modules,
                "completion_rate": (completed_modules / total_modules * 100) if total_modules > 0 else 0
            },
            "lessons": {
                "completed": completed_lessons,
                "total": total_lessons,
                "completion_rate": (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0,
                "completed_this_week": lessons_this_week
            }
        },
        "quizzes": {
            "total_taken": total_quizzes_taken,
            "passed": quizzes_passed,
            "pass_rate": (quizzes_passed / total_quizzes_taken * 100) if total_quizzes_taken > 0 else 0,
            "average_score": float(avg_quiz_score)
        }
    }


@router.get("/activity")
def get_recent_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent user activity"""
    activities = []
    
    # Recent lesson completions
    recent_lessons = db.query(UserLessonProgress).join(Lesson).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.status == "completed",
            UserLessonProgress.completed_at.isnot(None)
        )
    ).order_by(desc(UserLessonProgress.completed_at)).limit(5).all()
    
    for lesson_progress in recent_lessons:
        activities.append({
            "type": "lesson_completed",
            "title": f"Completed lesson: {lesson_progress.lesson.title}",
            "timestamp": lesson_progress.completed_at,
            "data": {
                "lesson_id": lesson_progress.lesson_id,
                "lesson_title": lesson_progress.lesson.title
            }
        })
    
    # Recent badge achievements
    recent_badges = db.query(UserBadge).join(Badge).filter(
        UserBadge.user_id == current_user.id
    ).order_by(desc(UserBadge.earned_at)).limit(5).all()
    
    for user_badge in recent_badges:
        activities.append({
            "type": "badge_earned",
            "title": f"Earned badge: {user_badge.badge.name}",
            "timestamp": user_badge.earned_at,
            "data": {
                "badge_id": user_badge.badge_id,
                "badge_name": user_badge.badge.name
            }
        })
    
    # Recent coin transactions
    recent_transactions = db.query(UserCoinTransaction).filter(
        UserCoinTransaction.user_id == current_user.id
    ).order_by(desc(UserCoinTransaction.created_at)).limit(5).all()
    
    for transaction in recent_transactions:
        activities.append({
            "type": "coin_transaction",
            "title": f"{'Earned' if transaction.amount > 0 else 'Spent'} {abs(transaction.amount)} coins",
            "timestamp": transaction.created_at,
            "data": {
                "amount": transaction.amount,
                "source_type": transaction.source_type,
                "description": transaction.description
            }
        })
    
    # Sort all activities by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activities[:limit]
