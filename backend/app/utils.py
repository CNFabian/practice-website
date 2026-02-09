import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models import (
    User, UserCoinBalance, UserCoinTransaction, Notification, 
    UserBadge, Badge, UserLessonProgress, UserModuleProgress,
    Module, Lesson, UserQuizAttempt, LessonBadgeReward,
    UserOnboarding, UserCouponRedemption
)

# Import will be used after class definitions to avoid circular imports
_EventTracker = None

def _get_event_tracker():
    """Lazy import to avoid circular dependency"""
    global _EventTracker
    if _EventTracker is None:
        from analytics.event_tracker import EventTracker
        _EventTracker = EventTracker
    return _EventTracker


class NotificationManager:
    """Manages user notifications"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "normal"
    ) -> Notification:
        """Create a new notification for a user"""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
        unread_only: bool = False
    ) -> List[Notification]:
        """Get user notifications"""
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        return query.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    
    @staticmethod
    def mark_notification_read(db: Session, notification_id: UUID, user_id: UUID) -> bool:
        """Mark a notification as read"""
        notification = db.query(Notification).filter(
            and_(Notification.id == notification_id, Notification.user_id == user_id)
        ).first()
        
        if notification:
            notification.is_read = True
            db.commit()
            return True
        return False
    
    @staticmethod
    def mark_all_notifications_read(db: Session, user_id: UUID) -> int:
        """Mark all user notifications as read"""
        count = db.query(Notification).filter(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        ).update({"is_read": True})
        db.commit()
        return count


class CoinManager:
    """Manages user coin transactions and balance"""
    
    @staticmethod
    def get_or_create_coin_balance(db: Session, user_id: UUID) -> UserCoinBalance:
        """Get or create user coin balance"""
        balance = db.query(UserCoinBalance).filter(UserCoinBalance.user_id == user_id).first()
        if not balance:
            balance = UserCoinBalance(user_id=user_id)
            db.add(balance)
            db.commit()
            db.refresh(balance)
        return balance
    
    @staticmethod
    def award_coins(
        db: Session,
        user_id: UUID,
        amount: int,
        source_type: str,
        source_id: Optional[UUID] = None,
        description: Optional[str] = None
    ) -> UserCoinTransaction:
        """Award coins to a user"""
        # Create transaction
        transaction = UserCoinTransaction(
            user_id=user_id,
            transaction_type="earned",
            amount=amount,
            source_type=source_type,
            source_id=source_id,
            description=description
        )
        db.add(transaction)
        
        # Update balance
        balance = CoinManager.get_or_create_coin_balance(db, user_id)
        balance.current_balance += amount
        balance.lifetime_earned += amount
        balance.updated_at = datetime.now()
        
        db.commit()
        db.refresh(transaction)
        
        # Track coins earned event
        EventTracker = _get_event_tracker()
        EventTracker.track_coins_earned(db, user_id, amount, source_type)
        
        # Send notification
        NotificationManager.create_notification(
            db,
            user_id,
            "coins_earned",
            "Coins Earned!",
            f"You earned {amount} coins! {description or ''}",
            "high"
        )
        
        return transaction
    
    @staticmethod
    def spend_coins(
        db: Session,
        user_id: UUID,
        amount: int,
        source_type: str,
        source_id: Optional[UUID] = None,
        description: Optional[str] = None
    ) -> UserCoinTransaction:
        """Spend user coins"""
        balance = CoinManager.get_or_create_coin_balance(db, user_id)
        
        if balance.current_balance < amount:
            raise ValueError("Insufficient coins")
        
        # Create transaction
        transaction = UserCoinTransaction(
            user_id=user_id,
            transaction_type="spent",
            amount=-amount,
            source_type=source_type,
            source_id=source_id,
            description=description
        )
        db.add(transaction)
        
        # Update balance
        balance.current_balance -= amount
        balance.lifetime_spent += amount
        balance.updated_at = datetime.now()
        
        db.commit()
        db.refresh(transaction)
        
        # Track coins spent event
        EventTracker = _get_event_tracker()
        EventTracker.track_coins_spent(db, user_id, amount, source_type)
        
        # Send notification
        NotificationManager.create_notification(
            db,
            user_id,
            "coins_spent",
            "Coins Spent",
            f"You spent {amount} coins on {description or 'a reward'}",
            "normal"
        )
        
        return transaction


class BadgeManager:
    """Manages user badges and achievements"""
    
    @staticmethod
    def award_badge(
        db: Session,
        user_id: UUID,
        badge_id: UUID,
        source_lesson_id: Optional[UUID] = None
    ) -> Optional[UserBadge]:
        """Award a badge to a user if they don't already have it"""
        # Check if user already has this badge
        existing = db.query(UserBadge).filter(
            and_(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id)
        ).first()
        
        if existing:
            return None  # User already has this badge
        
        # Award the badge
        user_badge = UserBadge(
            user_id=user_id,
            badge_id=badge_id,
            source_lesson_id=source_lesson_id
        )
        db.add(user_badge)
        db.commit()
        db.refresh(user_badge)
        
        # Get badge details for notification
        badge = db.query(Badge).filter(Badge.id == badge_id).first()
        if badge:
            # Track badge earned event
            EventTracker = _get_event_tracker()
            EventTracker.track_badge_earned(db, user_id, badge_id, badge.name, badge.rarity)
            
            NotificationManager.create_notification(
                db,
                user_id,
                "badge_earned",
                "Badge Earned!",
                f"Congratulations! You earned the '{badge.name}' badge!",
                "high"
            )
        
        return user_badge
    
    @staticmethod
    def check_and_award_lesson_badges(
        db: Session,
        user_id: UUID,
        lesson_id: UUID
    ) -> List[UserBadge]:
        """Check and award badges for completing a lesson"""
        # Get badges associated with this lesson
        lesson_badge_rewards = db.query(LessonBadgeReward).filter(
            LessonBadgeReward.lesson_id == lesson_id
        ).all()
        
        awarded_badges = []
        for reward in lesson_badge_rewards:
            badge = BadgeManager.award_badge(db, user_id, reward.badge_id, lesson_id)
            if badge:
                awarded_badges.append(badge)
        
        return awarded_badges


class ProgressManager:
    """Manages user learning progress"""
    
    @staticmethod
    def update_lesson_progress(
        db: Session,
        user_id: UUID,
        lesson_id: UUID,
        video_progress_seconds: Optional[int] = None,
        status: Optional[str] = None
    ) -> UserLessonProgress:
        """Update user lesson progress"""
        progress = db.query(UserLessonProgress).filter(
            and_(UserLessonProgress.user_id == user_id, UserLessonProgress.lesson_id == lesson_id)
        ).first()
        
        if not progress:
            progress = UserLessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                first_started_at=datetime.now()
            )
            db.add(progress)
        
        if video_progress_seconds is not None:
            progress.video_progress_seconds = video_progress_seconds
        
        if status:
            progress.status = status
            if status == "completed" and not progress.completed_at:
                progress.completed_at = datetime.now()
        
        progress.last_accessed_at = datetime.now()
        db.commit()
        db.refresh(progress)
        
        # Update module progress
        ProgressManager.update_module_progress(db, user_id, lesson_id)
        
        return progress
    
    @staticmethod
    def update_module_progress(db: Session, user_id: UUID, lesson_id: UUID):
        """Update module progress based on lesson completion"""
        # Get the lesson and its module
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            return
        
        module_id = lesson.module_id
        
        # Get or create module progress
        module_progress = db.query(UserModuleProgress).filter(
            and_(UserModuleProgress.user_id == user_id, UserModuleProgress.module_id == module_id)
        ).first()
        
        is_new_module = False
        if not module_progress:
            # Count total lessons in module
            total_lessons = db.query(Lesson).filter(
                and_(Lesson.module_id == module_id, Lesson.is_active == True)
            ).count()
            
            module_progress = UserModuleProgress(
                user_id=user_id,
                module_id=module_id,
                total_lessons=total_lessons,
                first_started_at=datetime.now()
            )
            db.add(module_progress)
            is_new_module = True
        
        # Count completed lessons
        completed_lessons = db.query(UserLessonProgress).join(Lesson).filter(
            and_(
                UserLessonProgress.user_id == user_id,
                Lesson.module_id == module_id,
                UserLessonProgress.status == "completed",
                Lesson.is_active == True
            )
        ).count()
        
        module_progress.lessons_completed = completed_lessons
        module_progress.completion_percentage = Decimal(
            (completed_lessons / module_progress.total_lessons * 100) if module_progress.total_lessons > 0 else 0
        )
        
        # Track previous status
        previous_status = module_progress.status if not is_new_module else "not_started"
        
        # Update status (FIXED: Don't mark as "completed" until mini-game is passed)
        if completed_lessons == 0:
            module_progress.status = "not_started"
        elif completed_lessons == module_progress.total_lessons:
            # All lessons done, but module only "completed" if mini-game passed
            if module_progress.minigame_completed:
                module_progress.status = "completed"
                if not module_progress.completed_at:
                    module_progress.completed_at = datetime.now()
            else:
                # New status: lessons done but mini-game not passed yet
                module_progress.status = "lessons_complete"
        else:
            module_progress.status = "in_progress"
        
        module_progress.last_accessed_at = datetime.now()
        module_progress.updated_at = datetime.now()
        
        db.commit()
        
        # Track module events
        EventTracker = _get_event_tracker()
        module = db.query(Module).filter(Module.id == module_id).first()
        if module:
            # Track module started (when first transitioning to in_progress)
            if is_new_module and module_progress.status == "in_progress":
                EventTracker.track_module_started(db, user_id, module_id, module.title)
            # NOTE: Module completion event is tracked in grow_your_nest router
            # when user passes the module quiz, preventing duplicate events

class QuizManager:
    """Manages quiz scoring and results"""
    
    @staticmethod
    def calculate_quiz_score(correct_answers: int, total_questions: int) -> Decimal:
        """Calculate quiz score as percentage"""
        if total_questions == 0:
            return Decimal('0.00')
        return Decimal(correct_answers / total_questions * 100).quantize(Decimal('0.01'))
    
    @staticmethod
    def determine_quiz_pass(score: Decimal, passing_score: Decimal = Decimal('70.00')) -> bool:
        """Determine if quiz score is passing"""
        return score >= passing_score
    
    @staticmethod
    def calculate_coin_reward(
        base_reward: int,
        score: Decimal,
        perfect_bonus: int = 50
    ) -> int:
        """Calculate coin reward based on quiz performance"""
        if score == Decimal('100.00'):
            return base_reward + perfect_bonus
        elif score >= Decimal('90.00'):
            return base_reward + (perfect_bonus // 2)
        elif score >= Decimal('70.00'):
            return base_reward
        else:
            return 0


class DashboardManager:
    """Manages dashboard data and statistics"""
    
    @staticmethod
    def get_user_stats(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Get comprehensive user statistics for dashboard"""
        # Coin balance
        balance = CoinManager.get_or_create_coin_balance(db, user_id)
        
        # Badge count
        badge_count = db.query(UserBadge).filter(UserBadge.user_id == user_id).count()
        
        # Module progress
        total_modules = db.query(Module).filter(Module.is_active == True).count()
        completed_modules = db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == user_id,
                UserModuleProgress.status == "completed"
            )
        ).count()
        
        # Recent achievements (last 5 badges)
        recent_badges = db.query(UserBadge).filter(UserBadge.user_id == user_id)\
            .order_by(UserBadge.earned_at.desc()).limit(5).all()
        
        # Calculate learning streak (consecutive days with activity)
        streak = DashboardManager._calculate_learning_streak(db, user_id)
        
        # Next lesson recommendation
        next_lesson = DashboardManager._get_next_lesson(db, user_id)
        
        return {
            "total_coins": balance.current_balance,
            "total_badges": badge_count,
            "modules_completed": completed_modules,
            "total_modules": total_modules,
            "current_streak": streak,
            "recent_achievements": [badge.badge.name for badge in recent_badges],
            "next_lesson": next_lesson
        }
    
    @staticmethod
    def _calculate_learning_streak(db: Session, user_id: UUID) -> int:
        """Calculate user's learning streak in days"""
        # This is a simplified version - you might want to implement more sophisticated logic
        # based on your specific streak requirements
        return 0  # Placeholder
    
    @staticmethod
    def _get_next_lesson(db: Session, user_id: UUID) -> Optional[Dict[str, Any]]:
        """Get the next recommended lesson for the user"""
        # Find the first incomplete lesson in the first incomplete module
        incomplete_module = db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == user_id,
                UserModuleProgress.status.in_(["not_started", "in_progress"])
            )
        ).order_by(UserModuleProgress.module_id).first()
        
        if not incomplete_module:
            return None
        
        # Find first incomplete lesson in this module
        incomplete_lesson = db.query(Lesson).outerjoin(
            UserLessonProgress,
            and_(
                UserLessonProgress.lesson_id == Lesson.id,
                UserLessonProgress.user_id == user_id
            )
        ).filter(
            and_(
                Lesson.module_id == incomplete_module.module_id,
                Lesson.is_active == True,
                func.coalesce(UserLessonProgress.status, "not_started") != "completed"
            )
        ).order_by(Lesson.order_index).first()
        
        if incomplete_lesson:
            return {
                "id": incomplete_lesson.id,
                "module_id": incomplete_lesson.module_id,
                "title": incomplete_lesson.title,
                "description": incomplete_lesson.description,
                "image_url": incomplete_lesson.image_url,
                "video_url": incomplete_lesson.video_url,
                "video_transcription": incomplete_lesson.video_transcription,
                "order_index": incomplete_lesson.order_index,
                "is_active": incomplete_lesson.is_active,
                "estimated_duration_minutes": incomplete_lesson.estimated_duration_minutes,
                "nest_coins_reward": incomplete_lesson.nest_coins_reward,
                "created_at": incomplete_lesson.created_at,
                # Optional fields on LessonResponse:
                "is_completed": None,
                "progress_seconds": None,
            }
        
        return None


class OnboardingManager:
    """Manages user onboarding process"""
    
    @staticmethod
    def get_or_create_onboarding(db: Session, user_id: UUID) -> UserOnboarding:
        """Get or create user onboarding record"""
        onboarding = db.query(UserOnboarding).filter(UserOnboarding.user_id == user_id).first()
        if not onboarding:
            onboarding = UserOnboarding(user_id=user_id)
            db.add(onboarding)
        return onboarding
    
    @staticmethod
    def is_onboarding_complete(db: Session, user_id: UUID) -> bool:
        """Check if user has completed onboarding"""
        onboarding = db.query(UserOnboarding).filter(UserOnboarding.user_id == user_id).first()
        if not onboarding:
            return False
        
        # Check new 5-step flow completion
        required_fields = [
            onboarding.wants_expert_contact,
            onboarding.homeownership_timeline_months,
            onboarding.target_cities
        ]
        
        # Also check that realtor/loan officer status is set (even if False)
        professional_status_set = (
            onboarding.has_realtor is not None and 
            onboarding.has_loan_officer is not None
        )
        
        return (
            all(field is not None for field in required_fields) and 
            professional_status_set and 
            onboarding.completed_at is not None
        )
    
    @staticmethod
    def complete_onboarding(db: Session, user_id: UUID) -> UserOnboarding:
        """Mark onboarding as complete and award welcome bonus"""
        onboarding = OnboardingManager.get_or_create_onboarding(db, user_id)
        
        if not onboarding.completed_at:
            onboarding.completed_at = datetime.now()
            db.commit()
            
            # Award welcome bonus
            CoinManager.award_coins(
                db,
                user_id,
                100,  # Welcome bonus
                "onboarding_complete",
                description="Welcome bonus for completing onboarding!"
            )
            
            # Send welcome notification
            NotificationManager.create_notification(
                db,
                user_id,
                "onboarding_complete",
                "Welcome to the Learning Platform!",
                "You've successfully completed your onboarding and earned 100 bonus coins!",
                "high"
            )
        
        return onboarding
