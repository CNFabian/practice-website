"""
Scoring Signals Catalog

Defines all data points used for lead scoring, their dimensions,
and availability rules.
"""
from typing import Dict, List, Any, Optional
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from models import (
    User, UserOnboarding, UserLessonProgress, UserModuleProgress,
    UserQuizAttempt, UserModuleQuizAttempt, UserCoinBalance, UserCoinTransaction, UserBadge,
    CalculatorUsage, SupportTicket, FAQ, MaterialDownload,
    UserCouponRedemption, UserActivityLog
)


class ScoreDimension(Enum):
    """Scoring dimensions"""
    ENGAGEMENT = "engagement"
    TIMELINE_URGENCY = "timeline_urgency"
    HELP_SEEKING = "help_seeking"
    LEARNING_VELOCITY = "learning_velocity"
    REWARDS = "rewards"


@dataclass
class ScoringSignal:
    """Represents a single scoring signal"""
    signal_id: str
    name: str
    dimension: ScoreDimension
    description: str
    weight: float  # How much this signal contributes to its dimension (0-1)
    extraction_func: str  # Name of function to extract this signal


class ScoringSignalsCatalog:
    """
    Comprehensive catalog of all scoring signals.
    
    Total signals: 49
    - Engagement: 16 signals
    - Timeline Urgency: 6 signals
    - Help Seeking: 10 signals
    - Learning Velocity: 9 signals
    - Rewards: 8 signals
    """
    
    # ================================
    # ENGAGEMENT SIGNALS (12)
    # ================================
    ENGAGEMENT_SIGNALS = [
        ScoringSignal(
            signal_id="eng_001",
            name="Has logged in",
            dimension=ScoreDimension.ENGAGEMENT,
            description="User has logged in at least once",
            weight=0.05,
            extraction_func="extract_has_logged_in"
        ),
        ScoringSignal(
            signal_id="eng_002",
            name="Days since last login",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Recency of last login (inverse scoring)",
            weight=0.15,
            extraction_func="extract_days_since_last_login"
        ),
        ScoringSignal(
            signal_id="eng_003",
            name="Total login count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of times user has logged in",
            weight=0.10,
            extraction_func="extract_login_count"
        ),
        ScoringSignal(
            signal_id="eng_004",
            name="Lessons started count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of lessons user has started",
            weight=0.10,
            extraction_func="extract_lessons_started"
        ),
        ScoringSignal(
            signal_id="eng_005",
            name="Lessons completed count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of lessons user has completed",
            weight=0.15,
            extraction_func="extract_lessons_completed"
        ),
        ScoringSignal(
            signal_id="eng_006",
            name="Modules started count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of modules user has started",
            weight=0.08,
            extraction_func="extract_modules_started"
        ),
        ScoringSignal(
            signal_id="eng_007",
            name="Modules completed count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of modules user has completed",
            weight=0.12,
            extraction_func="extract_modules_completed"
        ),
        ScoringSignal(
            signal_id="eng_008",
            name="Quiz attempts count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of quizzes user has attempted",
            weight=0.08,
            extraction_func="extract_quiz_attempts"
        ),
        ScoringSignal(
            signal_id="eng_009",
            name="Quiz pass rate",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Percentage of quizzes passed",
            weight=0.10,
            extraction_func="extract_quiz_pass_rate"
        ),
        ScoringSignal(
            signal_id="eng_010",
            name="Average quiz score",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Average score across all quiz attempts",
            weight=0.05,
            extraction_func="extract_avg_quiz_score"
        ),
        ScoringSignal(
            signal_id="eng_011",
            name="Days active in last 30 days",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of unique days user was active",
            weight=0.10,
            extraction_func="extract_active_days_last_30"
        ),
        ScoringSignal(
            signal_id="eng_012",
            name="Notification read rate",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Percentage of notifications read",
            weight=0.02,
            extraction_func="extract_notification_read_rate"
        ),
        ScoringSignal(
            signal_id="eng_013",
            name="Mini-game attempts count",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Number of mini-games (Grow Your Nest) user has attempted",
            weight=0.12,
            extraction_func="extract_minigame_attempts"
        ),
        ScoringSignal(
            signal_id="eng_014",
            name="Mini-game pass rate",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Percentage of mini-games passed",
            weight=0.15,
            extraction_func="extract_minigame_pass_rate"
        ),
        ScoringSignal(
            signal_id="eng_015",
            name="Average mini-game score",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Average score across all mini-game attempts",
            weight=0.08,
            extraction_func="extract_minigame_avg_score"
        ),
        ScoringSignal(
            signal_id="eng_016",
            name="Lessons complete awaiting mini-game",
            dimension=ScoreDimension.ENGAGEMENT,
            description="Modules where all lessons are complete but mini-game not yet passed (high-intent signal)",
            weight=0.18,
            extraction_func="extract_lessons_complete_awaiting_minigame"
        ),
    ]
    
    # ================================
    # TIMELINE URGENCY SIGNALS (6)
    # ================================
    TIMELINE_URGENCY_SIGNALS = [
        ScoringSignal(
            signal_id="urg_001",
            name="Homeownership timeline months",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="Target timeline from onboarding",
            weight=0.40,
            extraction_func="extract_homeownership_timeline"
        ),
        ScoringSignal(
            signal_id="urg_002",
            name="Timeline change trend",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="Whether timeline is getting shorter (higher urgency)",
            weight=0.15,
            extraction_func="extract_timeline_trend"
        ),
        ScoringSignal(
            signal_id="urg_003",
            name="Zipcode provided",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="User has provided target location",
            weight=0.10,
            extraction_func="extract_has_zipcode"
        ),
        ScoringSignal(
            signal_id="urg_004",
            name="Activity acceleration",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="User's learning activity is increasing over time",
            weight=0.15,
            extraction_func="extract_activity_acceleration"
        ),
        ScoringSignal(
            signal_id="urg_005",
            name="Completion velocity vs timeline",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="Completion rate matches stated timeline urgency",
            weight=0.15,
            extraction_func="extract_velocity_vs_timeline"
        ),
        ScoringSignal(
            signal_id="urg_006",
            name="Days since onboarding",
            dimension=ScoreDimension.TIMELINE_URGENCY,
            description="How long user has been on platform",
            weight=0.05,
            extraction_func="extract_days_since_onboarding"
        ),
    ]
    
    # ================================
    # HELP SEEKING SIGNALS (10)
    # ================================
    HELP_SEEKING_SIGNALS = [
        ScoringSignal(
            signal_id="help_001",
            name="Wants expert contact",
            dimension=ScoreDimension.HELP_SEEKING,
            description="User selected 'Yes' for expert contact",
            weight=0.20,
            extraction_func="extract_wants_expert_contact"
        ),
        ScoringSignal(
            signal_id="help_002",
            name="Has realtor",
            dimension=ScoreDimension.HELP_SEEKING,
            description="User is working with a realtor",
            weight=0.10,
            extraction_func="extract_has_realtor"
        ),
        ScoringSignal(
            signal_id="help_003",
            name="Has loan officer",
            dimension=ScoreDimension.HELP_SEEKING,
            description="User is working with a loan officer",
            weight=0.10,
            extraction_func="extract_has_loan_officer"
        ),
        ScoringSignal(
            signal_id="help_004",
            name="Support tickets created",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Number of support tickets submitted",
            weight=0.10,
            extraction_func="extract_support_ticket_count"
        ),
        ScoringSignal(
            signal_id="help_005",
            name="FAQ views count",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Number of FAQ articles viewed",
            weight=0.05,
            extraction_func="extract_faq_views"
        ),
        ScoringSignal(
            signal_id="help_006",
            name="Calculator usage count",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Number of times calculators were used",
            weight=0.15,
            extraction_func="extract_calculator_usage"
        ),
        ScoringSignal(
            signal_id="help_007",
            name="Calculator types used",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Variety of calculator types used",
            weight=0.10,
            extraction_func="extract_calculator_variety"
        ),
        ScoringSignal(
            signal_id="help_008",
            name="Materials downloaded",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Number of materials/resources downloaded",
            weight=0.10,
            extraction_func="extract_materials_downloaded"
        ),
        ScoringSignal(
            signal_id="help_009",
            name="Advanced materials accessed",
            dimension=ScoreDimension.HELP_SEEKING,
            description="User has accessed advanced resources",
            weight=0.08,
            extraction_func="extract_advanced_materials"
        ),
        ScoringSignal(
            signal_id="help_010",
            name="Recent help-seeking activity",
            dimension=ScoreDimension.HELP_SEEKING,
            description="Help-seeking actions in last 7 days",
            weight=0.02,
            extraction_func="extract_recent_help_seeking"
        ),
    ]
    
    # ================================
    # LEARNING VELOCITY SIGNALS (9)
    # ================================
    LEARNING_VELOCITY_SIGNALS = [
        ScoringSignal(
            signal_id="vel_001",
            name="Lessons per week",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Average lessons completed per week",
            weight=0.20,
            extraction_func="extract_lessons_per_week"
        ),
        ScoringSignal(
            signal_id="vel_002",
            name="Average time to complete module",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Speed of module completion",
            weight=0.15,
            extraction_func="extract_avg_module_completion_time"
        ),
        ScoringSignal(
            signal_id="vel_003",
            name="First-time quiz pass rate",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Percentage of quizzes passed on first attempt",
            weight=0.15,
            extraction_func="extract_first_time_pass_rate"
        ),
        ScoringSignal(
            signal_id="vel_004",
            name="Lesson completion ratio",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Completed lessons / Started lessons",
            weight=0.10,
            extraction_func="extract_lesson_completion_ratio"
        ),
        ScoringSignal(
            signal_id="vel_005",
            name="Module completion ratio",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Completed modules / Started modules",
            weight=0.10,
            extraction_func="extract_module_completion_ratio"
        ),
        ScoringSignal(
            signal_id="vel_006",
            name="Curriculum progression",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="How far through curriculum (0-100%)",
            weight=0.15,
            extraction_func="extract_curriculum_progression"
        ),
        ScoringSignal(
            signal_id="vel_007",
            name="Advanced content engagement",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="User engages with advanced lessons",
            weight=0.08,
            extraction_func="extract_advanced_content_engagement"
        ),
        ScoringSignal(
            signal_id="vel_008",
            name="Learning consistency",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Regular learning pattern vs sporadic",
            weight=0.05,
            extraction_func="extract_learning_consistency"
        ),
        ScoringSignal(
            signal_id="vel_009",
            name="Recent learning acceleration",
            dimension=ScoreDimension.LEARNING_VELOCITY,
            description="Learning activity increasing in recent weeks",
            weight=0.02,
            extraction_func="extract_recent_acceleration"
        ),
    ]
    
    # ================================
    # REWARDS SIGNALS (8)
    # ================================
    REWARDS_SIGNALS = [
        ScoringSignal(
            signal_id="rew_001",
            name="Total coins earned",
            dimension=ScoreDimension.REWARDS,
            description="Lifetime coins earned",
            weight=0.15,
            extraction_func="extract_coins_earned"
        ),
        ScoringSignal(
            signal_id="rew_002",
            name="Total coins spent",
            dimension=ScoreDimension.REWARDS,
            description="Lifetime coins spent",
            weight=0.10,
            extraction_func="extract_coins_spent"
        ),
        ScoringSignal(
            signal_id="rew_003",
            name="Current coin balance",
            dimension=ScoreDimension.REWARDS,
            description="Current coin balance",
            weight=0.05,
            extraction_func="extract_coin_balance"
        ),
        ScoringSignal(
            signal_id="rew_004",
            name="Coins earned last 30 days",
            dimension=ScoreDimension.REWARDS,
            description="Recent coin earning activity",
            weight=0.20,
            extraction_func="extract_coins_earned_last_30"
        ),
        ScoringSignal(
            signal_id="rew_005",
            name="Badges earned count",
            dimension=ScoreDimension.REWARDS,
            description="Total badges earned",
            weight=0.15,
            extraction_func="extract_badges_count"
        ),
        ScoringSignal(
            signal_id="rew_006",
            name="Rare badges earned",
            dimension=ScoreDimension.REWARDS,
            description="User has earned rare/epic badges",
            weight=0.10,
            extraction_func="extract_rare_badges"
        ),
        ScoringSignal(
            signal_id="rew_007",
            name="Coupons redeemed",
            dimension=ScoreDimension.REWARDS,
            description="Number of reward coupons redeemed",
            weight=0.15,
            extraction_func="extract_coupons_redeemed"
        ),
        ScoringSignal(
            signal_id="rew_008",
            name="Reward engagement rate",
            dimension=ScoreDimension.REWARDS,
            description="Active participation in reward system",
            weight=0.10,
            extraction_func="extract_reward_engagement"
        ),
    ]
    
    @classmethod
    def get_all_signals(cls) -> List[ScoringSignal]:
        """Get all scoring signals"""
        return (
            cls.ENGAGEMENT_SIGNALS +
            cls.TIMELINE_URGENCY_SIGNALS +
            cls.HELP_SEEKING_SIGNALS +
            cls.LEARNING_VELOCITY_SIGNALS +
            cls.REWARDS_SIGNALS
        )
    
    @classmethod
    def get_signals_by_dimension(cls, dimension: ScoreDimension) -> List[ScoringSignal]:
        """Get signals for a specific dimension"""
        all_signals = cls.get_all_signals()
        return [s for s in all_signals if s.dimension == dimension]
    
    @classmethod
    def get_total_signal_count(cls) -> int:
        """Total number of signals"""
        return len(cls.get_all_signals())
    
    @classmethod
    def get_signal_by_id(cls, signal_id: str) -> Optional[ScoringSignal]:
        """Get a specific signal by ID"""
        all_signals = cls.get_all_signals()
        for signal in all_signals:
            if signal.signal_id == signal_id:
                return signal
        return None


class SignalAvailabilityChecker:
    """
    Checks which signals are available for a given user.
    A signal is "available" if we have the data to calculate it.
    """
    
    def __init__(self, db: Session, user_id: Any):
        self.db = db
        self.user_id = user_id
        self._user = None
        self._onboarding = None
        self._cached_data = {}
    
    @property
    def user(self):
        """Cached user object"""
        if self._user is None:
            self._user = self.db.query(User).filter(User.id == self.user_id).first()
        return self._user
    
    @property
    def onboarding(self):
        """Cached onboarding object"""
        if self._onboarding is None:
            from models import UserOnboarding
            self._onboarding = self.db.query(UserOnboarding).filter(
                UserOnboarding.user_id == self.user_id
            ).first()
        return self._onboarding
    
    def check_signal_availability(self, signal: ScoringSignal) -> bool:
        """
        Check if a signal is available for this user.
        Returns True if we have the data to calculate this signal.
        """
        method_name = f"_check_{signal.extraction_func}"
        if hasattr(self, method_name):
            return getattr(self, method_name)()
        return False
    
    def get_available_signals(self) -> List[ScoringSignal]:
        """Get list of all available signals for this user"""
        all_signals = ScoringSignalsCatalog.get_all_signals()
        available = []
        for signal in all_signals:
            if self.check_signal_availability(signal):
                available.append(signal)
        return available
    
    def get_availability_summary(self) -> Dict[str, Any]:
        """Get summary of signal availability"""
        available_signals = self.get_available_signals()
        total_signals = ScoringSignalsCatalog.get_total_signal_count()
        
        # Count by dimension
        dimension_counts = {}
        for dimension in ScoreDimension:
            dimension_signals = ScoringSignalsCatalog.get_signals_by_dimension(dimension)
            available_dimension = [s for s in available_signals if s.dimension == dimension]
            dimension_counts[dimension.value] = {
                "available": len(available_dimension),
                "total": len(dimension_signals),
                "percentage": (len(available_dimension) / len(dimension_signals) * 100) if dimension_signals else 0
            }
        
        return {
            "user_id": str(self.user_id),
            "available_signals_count": len(available_signals),
            "total_signals_count": total_signals,
            "completion_percentage": (len(available_signals) / total_signals * 100) if total_signals > 0 else 0,
            "by_dimension": dimension_counts
        }
    
    # ================================
    # ENGAGEMENT AVAILABILITY CHECKS
    # ================================
    
    def _check_extract_has_logged_in(self) -> bool:
        """Always available - we know if user exists"""
        return self.user is not None
    
    def _check_extract_days_since_last_login(self) -> bool:
        """Available if user has last_login_at"""
        return self.user and self.user.last_login_at is not None
    
    def _check_extract_login_count(self) -> bool:
        """Available if we have activity logs"""
        count = self.db.query(UserActivityLog).filter(
            and_(
                UserActivityLog.user_id == self.user_id,
                UserActivityLog.activity_type == 'login'
            )
        ).count()
        return count > 0 or (self.user and self.user.last_login_at is not None)
    
    def _check_extract_lessons_started(self) -> bool:
        """Available if user has lesson progress"""
        count = self.db.query(UserLessonProgress).filter(
            UserLessonProgress.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_lessons_completed(self) -> bool:
        """Available if user has completed lessons"""
        count = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        return count > 0
    
    def _check_extract_modules_started(self) -> bool:
        """Available if user has module progress"""
        count = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_modules_completed(self) -> bool:
        """Available if user has completed modules"""
        count = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'completed'
            )
        ).count()
        return count > 0
    
    def _check_extract_quiz_attempts(self) -> bool:
        """Available if user has taken quizzes"""
        count = self.db.query(UserQuizAttempt).filter(
            UserQuizAttempt.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_quiz_pass_rate(self) -> bool:
        """Available if user has quiz attempts"""
        return self._check_extract_quiz_attempts()
    
    def _check_extract_avg_quiz_score(self) -> bool:
        """Available if user has quiz attempts"""
        return self._check_extract_quiz_attempts()
    
    def _check_extract_minigame_attempts(self) -> bool:
        """Available if user has mini-game attempts"""
        count = self.db.query(UserModuleQuizAttempt).filter(
            UserModuleQuizAttempt.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_minigame_pass_rate(self) -> bool:
        """Available if user has mini-game attempts"""
        return self._check_extract_minigame_attempts()
    
    def _check_extract_minigame_avg_score(self) -> bool:
        """Available if user has mini-game attempts"""
        return self._check_extract_minigame_attempts()
    
    def _check_extract_lessons_complete_awaiting_minigame(self) -> bool:
        """Available if user has modules with lessons complete but mini-game not passed"""
        count = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'lessons_complete'
            )
        ).count()
        return count > 0
    
    def _check_extract_active_days_last_30(self) -> bool:
        """Available if user has any activity logs"""
        count = self.db.query(UserActivityLog).filter(
            UserActivityLog.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_notification_read_rate(self) -> bool:
        """Available if user has notifications"""
        from models import Notification
        count = self.db.query(Notification).filter(
            Notification.user_id == self.user_id
        ).count()
        return count > 0
    
    # ================================
    # TIMELINE URGENCY AVAILABILITY CHECKS
    # ================================
    
    def _check_extract_homeownership_timeline(self) -> bool:
        """Available if onboarding timeline is set"""
        return (self.onboarding and 
                self.onboarding.homeownership_timeline_months is not None)
    
    def _check_extract_timeline_trend(self) -> bool:
        """Available if we have multiple onboarding records (timeline updates)"""
        # For now, just check if timeline exists
        return self._check_extract_homeownership_timeline()
    
    def _check_extract_has_zipcode(self) -> bool:
        """Available if user provided zipcode"""
        return self.onboarding and self.onboarding.zipcode is not None
    
    def _check_extract_activity_acceleration(self) -> bool:
        """Available if user has at least 2 weeks of activity"""
        if not self.user or not self.user.created_at:
            return False
        days_since_signup = (datetime.now(timezone.utc) - self.user.created_at).days
        return days_since_signup >= 14
    
    def _check_extract_velocity_vs_timeline(self) -> bool:
        """Available if we have both timeline and learning progress"""
        has_timeline = self._check_extract_homeownership_timeline()
        has_progress = self._check_extract_lessons_completed()
        return has_timeline and has_progress
    
    def _check_extract_days_since_onboarding(self) -> bool:
        """Available if onboarding is completed"""
        return self.onboarding and self.onboarding.completed_at is not None
    
    # ================================
    # HELP SEEKING AVAILABILITY CHECKS
    # ================================
    
    def _check_extract_wants_expert_contact(self) -> bool:
        """Available if user answered expert contact question"""
        return self.onboarding and self.onboarding.wants_expert_contact is not None
    
    def _check_extract_has_realtor(self) -> bool:
        """Available if user answered realtor question"""
        return self.onboarding and self.onboarding.has_realtor is not None
    
    def _check_extract_has_loan_officer(self) -> bool:
        """Available if user answered loan officer question"""
        return self.onboarding and self.onboarding.has_loan_officer is not None
    
    def _check_extract_support_ticket_count(self) -> bool:
        """Available if user has support tickets"""
        count = self.db.query(SupportTicket).filter(
            SupportTicket.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_faq_views(self) -> bool:
        """Available if we track FAQ views (via activity logs)"""
        # For now, assume not available unless activity logs exist
        return False  # Will be available when we add FAQ view tracking
    
    def _check_extract_calculator_usage(self) -> bool:
        """Available if user has used calculators"""
        count = self.db.query(CalculatorUsage).filter(
            CalculatorUsage.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_calculator_variety(self) -> bool:
        """Available if user has calculator usage"""
        return self._check_extract_calculator_usage()
    
    def _check_extract_materials_downloaded(self) -> bool:
        """Available if user has downloaded materials"""
        count = self.db.query(MaterialDownload).filter(
            MaterialDownload.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_advanced_materials(self) -> bool:
        """Available if user has material downloads"""
        return self._check_extract_materials_downloaded()
    
    def _check_extract_recent_help_seeking(self) -> bool:
        """Available if user has any help-seeking activity"""
        return (self._check_extract_support_ticket_count() or 
                self._check_extract_calculator_usage() or
                self._check_extract_materials_downloaded())
    
    # ================================
    # LEARNING VELOCITY AVAILABILITY CHECKS
    # ================================
    
    def _check_extract_lessons_per_week(self) -> bool:
        """Available if user has completed lessons"""
        return self._check_extract_lessons_completed()
    
    def _check_extract_avg_module_completion_time(self) -> bool:
        """Available if user has completed modules"""
        return self._check_extract_modules_completed()
    
    def _check_extract_first_time_pass_rate(self) -> bool:
        """Available if user has quiz attempts"""
        return self._check_extract_quiz_attempts()
    
    def _check_extract_lesson_completion_ratio(self) -> bool:
        """Available if user has started lessons"""
        return self._check_extract_lessons_started()
    
    def _check_extract_module_completion_ratio(self) -> bool:
        """Available if user has started modules"""
        return self._check_extract_modules_started()
    
    def _check_extract_curriculum_progression(self) -> bool:
        """Available if user has any learning progress"""
        return self._check_extract_lessons_started()
    
    def _check_extract_advanced_content_engagement(self) -> bool:
        """Available if user has lesson progress"""
        return self._check_extract_lessons_started()
    
    def _check_extract_learning_consistency(self) -> bool:
        """Available if user has been active for at least 2 weeks"""
        return self._check_extract_activity_acceleration()
    
    def _check_extract_recent_acceleration(self) -> bool:
        """Available if user has been active for at least 2 weeks"""
        return self._check_extract_activity_acceleration()
    
    # ================================
    # REWARDS AVAILABILITY CHECKS
    # ================================
    
    def _check_extract_coins_earned(self) -> bool:
        """Available if user has coin balance"""
        balance = self.db.query(UserCoinBalance).filter(
            UserCoinBalance.user_id == self.user_id
        ).first()
        return balance is not None
    
    def _check_extract_coins_spent(self) -> bool:
        """Available if user has coin balance"""
        return self._check_extract_coins_earned()
    
    def _check_extract_coin_balance(self) -> bool:
        """Available if user has coin balance"""
        return self._check_extract_coins_earned()
    
    def _check_extract_coins_earned_last_30(self) -> bool:
        """Available if user has coin transactions"""
        count = self.db.query(UserCoinTransaction).filter(
            UserCoinTransaction.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_badges_count(self) -> bool:
        """Available if user has badges"""
        count = self.db.query(UserBadge).filter(
            UserBadge.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_rare_badges(self) -> bool:
        """Available if user has badges"""
        return self._check_extract_badges_count()
    
    def _check_extract_coupons_redeemed(self) -> bool:
        """Available if user has redeemed coupons"""
        count = self.db.query(UserCouponRedemption).filter(
            UserCouponRedemption.user_id == self.user_id
        ).count()
        return count > 0
    
    def _check_extract_reward_engagement(self) -> bool:
        """Available if user has any reward activity"""
        return (self._check_extract_coins_earned() or 
                self._check_extract_badges_count() or
                self._check_extract_coupons_redeemed())
