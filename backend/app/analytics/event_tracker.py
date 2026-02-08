"""
Event Tracker

Captures user behavior events for analytics and lead scoring.
All events are logged to UserBehaviorEvent table.

Supports idempotency and deduplication to prevent duplicate events.
"""
from typing import Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_

from models import UserBehaviorEvent
from analytics.scoring_signals import ScoreDimension


class EventTracker:
    """
    Centralized event tracking for user behaviors.
    Logs events to database for analytics processing.
    """
    
    # Event weights for real-time scoring adjustments
    EVENT_WEIGHTS = {
        # Learning events
        "lesson_started": 0.5,
        "lesson_completed": 2.0,
        "lesson_progress_updated": 0.2,
        "lesson_milestone_25": 0.3,
        "lesson_milestone_50": 0.5,
        "lesson_milestone_75": 0.8,
        "lesson_milestone_90": 1.5,  # Strong signal (auto-completes)
        "module_started": 1.0,
        "module_completed": 5.0,
        
        # Quiz events
        "quiz_attempted": 1.0,
        "quiz_passed": 3.0,
        "quiz_failed": 0.5,
        "quiz_high_score": 2.0,  # 90%+
        "quiz_perfect_score": 5.0,  # 100%
        
        # Mini-game events (Grow Your Nest)
        "minigame_attempted": 3.0,
        "minigame_completed": 6.0,
        "minigame_failed": 1.0,
        "minigame_perfect_score": 8.0,
        
        # Engagement events
        "user_login": 0.5,
        "daily_login": 1.0,
        "streak_maintained": 2.0,
        "badge_earned": 2.0,
        "coins_earned": 0.3,
        "notification_read": 0.1,
        
        # Help-seeking events
        "expert_contact_requested": 10.0,
        "support_ticket_created": 5.0,
        "faq_viewed": 0.5,
        "calculator_used": 2.0,
        "material_downloaded": 1.5,
        
        # Goal indication events
        "onboarding_completed": 5.0,
        "timeline_updated": 3.0,
        "timeline_shortened": 5.0,
        "location_provided": 2.0,
        "professional_status_updated": 2.0,
        
        # Rewards events
        "coins_spent": 1.0,
        "badge_unlocked": 2.0,
        "rare_badge_earned": 4.0,
        "coupon_redeemed": 3.0,
    }
    
    @staticmethod
    def track_event(
        db: Session,
        user_id: UUID,
        event_type: str,
        event_category: str,
        metadata: Optional[Dict[str, Any]] = None,
        custom_weight: Optional[float] = None,
        idempotency_key: Optional[str] = None,
        dedup_window_seconds: int = 60
    ) -> Tuple[UserBehaviorEvent, bool]:
        """
        Track a user behavior event with idempotency and deduplication support.
        
        Args:
            db: Database session
            user_id: User ID
            event_type: Type of event (e.g., 'lesson_completed')
            event_category: Category (learning, engagement, help_seeking, goal_indication, rewards)
            metadata: Additional event data
            custom_weight: Override default event weight
            idempotency_key: Unique key for idempotent event creation (prevents duplicates)
            dedup_window_seconds: Time window for duplicate detection (default 60s)
        
        Returns:
            Tuple of (event_record, was_created) where was_created is True if new event was created
        """
        # Check for duplicate using idempotency key
        if idempotency_key:
            existing = db.query(UserBehaviorEvent).filter(
                and_(
                    UserBehaviorEvent.user_id == user_id,
                    UserBehaviorEvent.event_type == event_type,
                    UserBehaviorEvent.idempotency_key == idempotency_key
                )
            ).first()
            
            if existing:
                return existing, False  # Event already exists
        
        # Time-based deduplication for events without idempotency key
        elif dedup_window_seconds > 0:
            recent_cutoff = datetime.now() - timedelta(seconds=dedup_window_seconds)
            
            # Check for recent duplicate
            recent_event = db.query(UserBehaviorEvent).filter(
                and_(
                    UserBehaviorEvent.user_id == user_id,
                    UserBehaviorEvent.event_type == event_type,
                    UserBehaviorEvent.created_at >= recent_cutoff
                )
            ).first()
            
            if recent_event:
                # For certain event types, also check metadata for exact match
                if event_type in ['lesson_completed', 'module_completed'] and metadata:
                    # Check if it's the same lesson/module
                    lesson_id = metadata.get('lesson_id') or metadata.get('module_id')
                    if lesson_id:
                        recent_lesson_id = recent_event.event_data.get('lesson_id') or recent_event.event_data.get('module_id')
                        if recent_lesson_id == lesson_id:
                            return recent_event, False  # Duplicate detected
                else:
                    return recent_event, False  # Duplicate detected
        
        # Get event weight
        weight = custom_weight if custom_weight is not None else EventTracker.EVENT_WEIGHTS.get(event_type, 1.0)
        
        # Create new event
        event = UserBehaviorEvent(
            user_id=user_id,
            event_type=event_type,
            event_category=event_category,
            event_data=metadata or {},
            event_weight=weight,
            idempotency_key=idempotency_key
        )
        
        try:
            db.add(event)
            db.commit()
            db.refresh(event)
            return event, True  # New event created
        except IntegrityError:
            # Handle race condition where duplicate was inserted between check and insert
            db.rollback()
            
            # Fetch the existing event
            existing = db.query(UserBehaviorEvent).filter(
                and_(
                    UserBehaviorEvent.user_id == user_id,
                    UserBehaviorEvent.event_type == event_type,
                    UserBehaviorEvent.idempotency_key == idempotency_key
                )
            ).first()
            
            return existing, False  # Return existing event
    
    @staticmethod
    def track_event_legacy(
        db: Session,
        user_id: UUID,
        event_type: str,
        event_category: str,
        metadata: Optional[Dict[str, Any]] = None,
        custom_weight: Optional[float] = None
    ) -> UserBehaviorEvent:
        """
        Legacy method that returns only the event (maintains backward compatibility).
        
        Use this if you don't care about whether the event was newly created or already existed.
        """
        event, _ = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category=event_category,
            metadata=metadata,
            custom_weight=custom_weight
        )
        return event
    
    # ================================
    # LEARNING EVENTS
    # ================================
    
    @staticmethod
    def track_lesson_started(db: Session, user_id: UUID, lesson_id: UUID, lesson_title: str):
        """Track when user starts a lesson"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="lesson_started",
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "lesson_title": lesson_title
            }
        )
    
    @staticmethod
    def track_lesson_completed(db: Session, user_id: UUID, lesson_id: UUID, lesson_title: str):
        """
        Track when user completes a lesson.
        
        Uses database constraint to prevent duplicate lesson_completed events
        for the same user+lesson combination.
        """
        event, created = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="lesson_completed",
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "lesson_title": lesson_title
            },
            dedup_window_seconds=0  # Rely on database constraint for deduplication
        )
        return event, created
    
    @staticmethod
    def track_lesson_progress(db: Session, user_id: UUID, lesson_id: UUID, progress_seconds: int):
        """Track lesson video progress update"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="lesson_progress_updated",
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "progress_seconds": progress_seconds
            }
        )
    
    @staticmethod
    def track_lesson_milestone(
        db: Session,
        user_id: UUID,
        lesson_id: UUID,
        lesson_title: str,
        milestone: int,
        content_type: str,
        idempotency_key: Optional[str] = None
    ):
        """
        Track lesson milestone reached (25%, 50%, 75%, 90%).
        
        Uses idempotency key to prevent duplicate milestone events.
        If idempotency_key not provided, generates one automatically.
        """
        event_type = f"lesson_milestone_{milestone}"
        
        # Generate idempotency key if not provided
        if not idempotency_key:
            idempotency_key = f"{user_id}:lesson:{lesson_id}:milestone:{milestone}"
        
        event, created = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "lesson_title": lesson_title,
                "milestone": milestone,
                "content_type": content_type
            },
            idempotency_key=idempotency_key,
            dedup_window_seconds=0  # Rely only on idempotency key for milestones
        )
        return event, created
    
    @staticmethod
    def track_module_started(db: Session, user_id: UUID, module_id: UUID, module_title: str):
        """Track when user starts a module"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="module_started",
            event_category="learning",
            metadata={
                "module_id": str(module_id),
                "module_title": module_title
            }
        )
    
    @staticmethod
    def track_module_completed(db: Session, user_id: UUID, module_id: UUID, module_title: str):
        """
        Track when user completes a module.
        
        Uses database constraint to prevent duplicate module_completed events
        for the same user+module combination.
        """
        event, created = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="module_completed",
            event_category="learning",
            metadata={
                "module_id": str(module_id),
                "module_title": module_title
            },
            dedup_window_seconds=0  # Rely on database constraint for deduplication
        )
        return event, created
    
    # ================================
    # QUIZ EVENTS
    # ================================
    
    @staticmethod
    def track_quiz_attempted(db: Session, user_id: UUID, lesson_id: UUID, attempt_number: int):
        """Track quiz attempt"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="quiz_attempted",
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "attempt_number": attempt_number
            }
        )
    
    @staticmethod
    def track_quiz_result(
        db: Session,
        user_id: UUID,
        lesson_id: UUID,
        score: float,
        passed: bool,
        attempt_number: int
    ):
        """Track quiz result with appropriate event type"""
        # Determine event type based on performance
        if score == 100.0:
            event_type = "quiz_perfect_score"
        elif score >= 90.0 and passed:
            event_type = "quiz_high_score"
        elif passed:
            event_type = "quiz_passed"
        else:
            event_type = "quiz_failed"
        
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="learning",
            metadata={
                "lesson_id": str(lesson_id),
                "score": score,
                "passed": passed,
                "attempt_number": attempt_number
            }
        )
    
    # ================================
    # MINI-GAME EVENTS (GROW YOUR NEST)
    # ================================
    
    @staticmethod
    def track_minigame_attempted(db: Session, user_id: UUID, module_id: UUID, attempt_number: int):
        """Track when user attempts the Grow Your Nest mini-game"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="minigame_attempted",
            event_category="engagement",
            metadata={
                "module_id": str(module_id),
                "attempt_number": attempt_number
            }
        )
    
    @staticmethod
    def track_minigame_result(
        db: Session,
        user_id: UUID,
        module_id: UUID,
        score: float,
        passed: bool
    ):
        """Track mini-game result with appropriate event type"""
        # Determine event type based on performance
        if score == 100.0:
            event_type = "minigame_perfect_score"
        elif passed:
            event_type = "minigame_completed"
        else:
            event_type = "minigame_failed"
        
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="learning",
            metadata={
                "module_id": str(module_id),
                "score": score,
                "passed": passed
            }
        )
    
    # ================================
    # ENGAGEMENT EVENTS
    # ================================
    
    @staticmethod
    def track_login(db: Session, user_id: UUID, is_daily_first: bool = False):
        """Track user login"""
        event_type = "daily_login" if is_daily_first else "user_login"
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="engagement",
            metadata={
                "timestamp": datetime.now().isoformat()
            }
        )
    
    @staticmethod
    def track_badge_earned(db: Session, user_id: UUID, badge_id: UUID, badge_name: str, rarity: str):
        """Track badge earned"""
        event_type = "rare_badge_earned" if rarity in ["rare", "epic", "legendary"] else "badge_earned"
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="engagement",
            metadata={
                "badge_id": str(badge_id),
                "badge_name": badge_name,
                "rarity": rarity
            }
        )
    
    @staticmethod
    def track_coins_earned(db: Session, user_id: UUID, amount: int, source: str):
        """Track coins earned"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="coins_earned",
            event_category="rewards",
            metadata={
                "amount": amount,
                "source": source
            }
        )
    
    @staticmethod
    def track_notification_read(db: Session, user_id: UUID, notification_id: UUID):
        """Track notification read"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="notification_read",
            event_category="engagement",
            metadata={
                "notification_id": str(notification_id)
            }
        )
    
    # ================================
    # HELP-SEEKING EVENTS
    # ================================
    
    @staticmethod
    def track_expert_contact_requested(db: Session, user_id: UUID, contact_type: str):
        """Track expert contact request"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="expert_contact_requested",
            event_category="help_seeking",
            metadata={
                "contact_type": contact_type
            }
        )
    
    @staticmethod
    def track_support_ticket_created(db: Session, user_id: UUID, ticket_id: UUID, subject: str, category: str):
        """Track support ticket creation"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="support_ticket_created",
            event_category="help_seeking",
            metadata={
                "ticket_id": str(ticket_id),
                "subject": subject,
                "category": category
            }
        )
    
    @staticmethod
    def track_faq_viewed(db: Session, user_id: UUID, faq_id: UUID, question: str):
        """Track FAQ view"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="faq_viewed",
            event_category="help_seeking",
            metadata={
                "faq_id": str(faq_id),
                "question": question
            }
        )
    
    @staticmethod
    def track_calculator_used(db: Session, user_id: UUID, calculator_type: str, input_data: Dict[str, Any]):
        """Track calculator usage"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="calculator_used",
            event_category="help_seeking",
            metadata={
                "calculator_type": calculator_type,
                "has_input": bool(input_data)
            }
        )
    
    @staticmethod
    def track_material_downloaded(db: Session, user_id: UUID, material_id: UUID, material_title: str, resource_type: str):
        """Track material download"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="material_downloaded",
            event_category="help_seeking",
            metadata={
                "material_id": str(material_id),
                "material_title": material_title,
                "resource_type": resource_type
            }
        )
    
    # ================================
    # GOAL INDICATION EVENTS
    # ================================
    
    @staticmethod
    def track_onboarding_completed(db: Session, user_id: UUID):
        """Track onboarding completion"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="onboarding_completed",
            event_category="goal_indication",
            metadata={
                "completed_at": datetime.now().isoformat()
            }
        )
    
    @staticmethod
    def track_timeline_updated(db: Session, user_id: UUID, old_timeline: Optional[int], new_timeline: int):
        """Track timeline update"""
        # Determine if timeline was shortened (increased urgency)
        event_type = "timeline_shortened" if (old_timeline and new_timeline < old_timeline) else "timeline_updated"
        
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type=event_type,
            event_category="goal_indication",
            metadata={
                "old_timeline_months": old_timeline,
                "new_timeline_months": new_timeline,
                "shortened": old_timeline and new_timeline < old_timeline
            }
        )
    
    @staticmethod
    def track_location_provided(db: Session, user_id: UUID, zipcode: str):
        """Track location provided"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="location_provided",
            event_category="goal_indication",
            metadata={
                "zipcode": zipcode
            }
        )
    
    @staticmethod
    def track_professional_status_updated(db: Session, user_id: UUID, has_realtor: bool, has_loan_officer: bool):
        """Track professional status update"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="professional_status_updated",
            event_category="goal_indication",
            metadata={
                "has_realtor": has_realtor,
                "has_loan_officer": has_loan_officer
            }
        )
    
    # ================================
    # REWARDS EVENTS
    # ================================
    
    @staticmethod
    def track_coins_spent(db: Session, user_id: UUID, amount: int, purpose: str):
        """Track coins spent"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="coins_spent",
            event_category="rewards",
            metadata={
                "amount": amount,
                "purpose": purpose
            }
        )
    
    @staticmethod
    def track_coupon_redeemed(db: Session, user_id: UUID, coupon_id: UUID, coupon_title: str, coins_spent: int):
        """Track coupon redemption"""
        return EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="coupon_redeemed",
            event_category="rewards",
            metadata={
                "coupon_id": str(coupon_id),
                "coupon_title": coupon_title,
                "coins_spent": coins_spent
            }
        )
