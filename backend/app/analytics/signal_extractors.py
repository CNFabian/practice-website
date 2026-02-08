"""
Signal Extractors

Functions to extract actual signal values from database for scoring.
Each function returns None if data is not available, or a normalized value (0-100).
"""
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct

from models import (
    User, UserOnboarding, UserLessonProgress, UserModuleProgress,
    UserQuizAttempt, UserCoinBalance, UserCoinTransaction, UserBadge,
    CalculatorUsage, SupportTicket, MaterialDownload, UserCouponRedemption,
    UserActivityLog, Notification, Badge, Lesson, Module
)


class SignalExtractor:
    """Extracts and normalizes signal values from database"""
    
    def __init__(self, db: Session, user_id: UUID):
        self.db = db
        self.user_id = user_id
        self._cached_data = {}
    
    # ================================
    # ENGAGEMENT SIGNALS
    # ================================
    
    def extract_has_logged_in(self) -> Optional[float]:
        """Has user ever logged in? (binary: 0 or 100)"""
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user:
            return None
        return 100.0 if user.last_login_at else 0.0
    
    def extract_days_since_last_login(self) -> Optional[float]:
        """Recency score: 100 for today, decreases with time"""
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user or not user.last_login_at:
            return None
        
        days_ago = (datetime.now(timezone.utc) - user.last_login_at).days
        # Perfect score for login today, decreases linearly to 0 at 30 days
        score = max(0, 100 - (days_ago / 30.0 * 100))
        return float(score)
    
    def extract_login_count(self) -> Optional[float]:
        """Login frequency score (0-100)"""
        count = self.db.query(UserActivityLog).filter(
            and_(
                UserActivityLog.user_id == self.user_id,
                UserActivityLog.activity_type == 'login'
            )
        ).count()
        
        if count == 0:
            user = self.db.query(User).filter(User.id == self.user_id).first()
            if user and user.last_login_at:
                count = 1  # At least one login
            else:
                return None
        
        # Normalize: 1 login = 10, 10 logins = 50, 30+ logins = 100
        score = min(100, (count / 30.0) * 100)
        return float(score)
    
    def extract_lessons_started(self) -> Optional[float]:
        """Number of lessons started (0-100)"""
        count = self.db.query(UserLessonProgress).filter(
            UserLessonProgress.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 lesson = 5, 20 lessons = 100
        score = min(100, (count / 20.0) * 100)
        return float(score)
    
    def extract_lessons_completed(self) -> Optional[float]:
        """Number of lessons completed (0-100)"""
        count = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 lesson = 10, 10 lessons = 100
        score = min(100, (count / 10.0) * 100)
        return float(score)
    
    def extract_modules_started(self) -> Optional[float]:
        """Number of modules started (0-100)"""
        count = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 module = 20, 5 modules = 100
        score = min(100, (count / 5.0) * 100)
        return float(score)
    
    def extract_modules_completed(self) -> Optional[float]:
        """Number of modules completed (0-100)"""
        count = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'completed'
            )
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 module = 25, 4 modules = 100
        score = min(100, (count / 4.0) * 100)
        return float(score)
    
    def extract_quiz_attempts(self) -> Optional[float]:
        """Number of quiz attempts (0-100)"""
        count = self.db.query(UserQuizAttempt).filter(
            UserQuizAttempt.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 quiz = 10, 10 quizzes = 100
        score = min(100, (count / 10.0) * 100)
        return float(score)
    
    def extract_quiz_pass_rate(self) -> Optional[float]:
        """Percentage of quizzes passed (0-100)"""
        total = self.db.query(UserQuizAttempt).filter(
            UserQuizAttempt.user_id == self.user_id
        ).count()
        
        if total == 0:
            return None
        
        passed = self.db.query(UserQuizAttempt).filter(
            and_(
                UserQuizAttempt.user_id == self.user_id,
                UserQuizAttempt.passed == True
            )
        ).count()
        
        return float((passed / total) * 100)
    
    def extract_avg_quiz_score(self) -> Optional[float]:
        """Average quiz score (0-100)"""
        avg_score = self.db.query(func.avg(UserQuizAttempt.score)).filter(
            UserQuizAttempt.user_id == self.user_id
        ).scalar()
        
        if avg_score is None:
            return None
        
        return float(avg_score)
    
    def extract_minigame_attempts(self) -> Optional[float]:
        """Number of mini-game attempts (0-100)"""
        from models import UserModuleQuizAttempt
        count = self.db.query(UserModuleQuizAttempt).filter(
            UserModuleQuizAttempt.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 attempt = 25, 4+ attempts = 100
        score = min(100, (count / 4.0) * 100)
        return float(score)
    
    def extract_minigame_pass_rate(self) -> Optional[float]:
        """Mini-game pass rate (0-100)"""
        from models import UserModuleQuizAttempt
        total = self.db.query(UserModuleQuizAttempt).filter(
            UserModuleQuizAttempt.user_id == self.user_id
        ).count()
        
        if total == 0:
            return None
        
        passed = self.db.query(UserModuleQuizAttempt).filter(
            and_(
                UserModuleQuizAttempt.user_id == self.user_id,
                UserModuleQuizAttempt.passed == True
            )
        ).count()
        
        return float((passed / total) * 100)
    
    def extract_minigame_avg_score(self) -> Optional[float]:
        """Average mini-game score (0-100)"""
        from models import UserModuleQuizAttempt
        avg_score = self.db.query(func.avg(UserModuleQuizAttempt.score)).filter(
            UserModuleQuizAttempt.user_id == self.user_id
        ).scalar()
        
        if avg_score is None:
            return None
        
        return float(avg_score)
    
    def extract_active_days_last_30(self) -> Optional[float]:
        """Number of unique active days in last 30 days (0-100)"""
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        # Count distinct days with activity
        active_days = self.db.query(
            func.date(UserActivityLog.created_at)
        ).filter(
            and_(
                UserActivityLog.user_id == self.user_id,
                UserActivityLog.created_at >= thirty_days_ago
            )
        ).distinct().count()
        
        if active_days == 0:
            return None
        
        # Normalize: 1 day = 5, 20 days = 100
        score = min(100, (active_days / 20.0) * 100)
        return float(score)
    
    def extract_notification_read_rate(self) -> Optional[float]:
        """Percentage of notifications read (0-100)"""
        total = self.db.query(Notification).filter(
            Notification.user_id == self.user_id
        ).count()
        
        if total == 0:
            return None
        
        read = self.db.query(Notification).filter(
            and_(
                Notification.user_id == self.user_id,
                Notification.is_read == True
            )
        ).count()
        
        return float((read / total) * 100)
    
    # ================================
    # TIMELINE URGENCY SIGNALS
    # ================================
    
    def extract_homeownership_timeline(self) -> Optional[float]:
        """Timeline urgency score (0-100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or onboarding.homeownership_timeline_months is None:
            return None
        
        months = onboarding.homeownership_timeline_months
        
        # Inverse score: shorter timeline = higher urgency
        if months <= 3:
            return 100.0
        elif months <= 6:
            return 85.0
        elif months <= 12:
            return 70.0
        elif months <= 24:
            return 50.0
        elif months <= 36:
            return 30.0
        else:
            return 10.0
    
    def extract_timeline_trend(self) -> Optional[float]:
        """Timeline change trend (100 if shortened, 50 if stable, 0 if lengthened)"""
        # For MVP, return 50 (neutral) if timeline exists
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or onboarding.homeownership_timeline_months is None:
            return None
        
        # TODO: Track timeline changes in future iteration
        return 50.0
    
    def extract_has_zipcode(self) -> Optional[float]:
        """Has provided target location (binary: 0 or 100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding:
            return None
        
        return 100.0 if onboarding.zipcode else 0.0
    
    def extract_activity_acceleration(self) -> Optional[float]:
        """Is learning activity increasing over time? (0-100)"""
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user or not user.created_at:
            return None
        
        days_since_signup = (datetime.now(timezone.utc) - user.created_at).days
        if days_since_signup < 14:
            return None  # Need at least 2 weeks of data
        
        # Compare recent 7 days vs previous 7 days
        recent_week = datetime.now(timezone.utc) - timedelta(days=7)
        previous_week = datetime.now(timezone.utc) - timedelta(days=14)
        
        recent_completions = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.completed_at >= recent_week,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        previous_completions = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.completed_at >= previous_week,
                UserLessonProgress.completed_at < recent_week,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        if previous_completions == 0 and recent_completions == 0:
            return 0.0
        elif previous_completions == 0:
            return 100.0  # Started from nothing
        else:
            # Calculate acceleration
            acceleration = (recent_completions - previous_completions) / previous_completions
            # Normalize: -50% = 0, 0% = 50, +100% = 100
            score = 50 + (acceleration * 50)
            return float(max(0, min(100, score)))
    
    def extract_velocity_vs_timeline(self) -> Optional[float]:
        """Completion velocity matches stated timeline (0-100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or onboarding.homeownership_timeline_months is None:
            return None
        
        # Check if user has completed lessons
        completed_count = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        if completed_count == 0:
            return None
        
        # Get account age in days
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user or not user.created_at:
            return 50.0
        
        days_active = max(1, (datetime.now(timezone.utc) - user.created_at).days)
        lessons_per_day = completed_count / days_active
        
        # Expected pace based on timeline
        # Assume 30 total lessons to complete curriculum
        timeline_months = onboarding.homeownership_timeline_months
        expected_lessons_per_day = 30 / (timeline_months * 30)
        
        # Compare actual vs expected
        if expected_lessons_per_day == 0:
            return 50.0
        
        ratio = lessons_per_day / expected_lessons_per_day
        # ratio = 1 means perfect match (100), > 1 means ahead (good), < 1 means behind
        if ratio >= 1:
            return 100.0
        else:
            return float(ratio * 100)
    
    def extract_days_since_onboarding(self) -> Optional[float]:
        """Days since onboarding completion (0-100, higher = longer on platform)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or not onboarding.completed_at:
            return None
        
        days_since = (datetime.now(timezone.utc) - onboarding.completed_at).days
        # Normalize: 0 days = 0, 30 days = 50, 60+ days = 100
        score = min(100, (days_since / 60.0) * 100)
        return float(score)
    
    # ================================
    # HELP SEEKING SIGNALS
    # ================================
    
    def extract_wants_expert_contact(self) -> Optional[float]:
        """Wants expert contact (binary: 0 or 100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or not onboarding.wants_expert_contact:
            return None
        
        return 100.0 if onboarding.wants_expert_contact == "Yes" else 30.0
    
    def extract_has_realtor(self) -> Optional[float]:
        """Has realtor (binary: 0 or 100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or onboarding.has_realtor is None:
            return None
        
        return 100.0 if onboarding.has_realtor else 0.0
    
    def extract_has_loan_officer(self) -> Optional[float]:
        """Has loan officer (binary: 0 or 100)"""
        onboarding = self.db.query(UserOnboarding).filter(
            UserOnboarding.user_id == self.user_id
        ).first()
        
        if not onboarding or onboarding.has_loan_officer is None:
            return None
        
        return 100.0 if onboarding.has_loan_officer else 0.0
    
    def extract_support_ticket_count(self) -> Optional[float]:
        """Number of support tickets (0-100)"""
        count = self.db.query(SupportTicket).filter(
            SupportTicket.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 ticket = 50, 3+ tickets = 100
        score = min(100, (count / 3.0) * 100)
        return float(score)
    
    def extract_faq_views(self) -> Optional[float]:
        """FAQ views count (0-100)"""
        # TODO: Implement when FAQ view tracking is added
        return None
    
    def extract_calculator_usage(self) -> Optional[float]:
        """Calculator usage count (0-100)"""
        count = self.db.query(CalculatorUsage).filter(
            CalculatorUsage.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 use = 25, 4+ uses = 100
        score = min(100, (count / 4.0) * 100)
        return float(score)
    
    def extract_calculator_variety(self) -> Optional[float]:
        """Variety of calculator types used (0-100)"""
        distinct_types = self.db.query(
            func.count(distinct(CalculatorUsage.calculator_type))
        ).filter(
            CalculatorUsage.user_id == self.user_id
        ).scalar()
        
        if not distinct_types or distinct_types == 0:
            return None
        
        # Normalize: 1 type = 25, 4 types = 100
        score = min(100, (distinct_types / 4.0) * 100)
        return float(score)
    
    def extract_materials_downloaded(self) -> Optional[float]:
        """Materials downloaded count (0-100)"""
        count = self.db.query(MaterialDownload).filter(
            MaterialDownload.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 download = 33, 3+ downloads = 100
        score = min(100, (count / 3.0) * 100)
        return float(score)
    
    def extract_advanced_materials(self) -> Optional[float]:
        """Has accessed advanced materials (binary: 0 or 100)"""
        # Check if any downloaded materials are advanced
        # For MVP, any material download counts as 50
        count = self.db.query(MaterialDownload).filter(
            MaterialDownload.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        return 50.0  # TODO: Implement advanced material detection
    
    def extract_recent_help_seeking(self) -> Optional[float]:
        """Recent help-seeking activity (last 7 days, 0-100)"""
        recent_date = datetime.now(timezone.utc) - timedelta(days=7)
        
        tickets = self.db.query(SupportTicket).filter(
            and_(
                SupportTicket.user_id == self.user_id,
                SupportTicket.created_at >= recent_date
            )
        ).count()
        
        calc_usage = self.db.query(CalculatorUsage).filter(
            and_(
                CalculatorUsage.user_id == self.user_id,
                CalculatorUsage.created_at >= recent_date
            )
        ).count()
        
        materials = self.db.query(MaterialDownload).filter(
            and_(
                MaterialDownload.user_id == self.user_id,
                MaterialDownload.downloaded_at >= recent_date
            )
        ).count()
        
        total_activity = tickets + calc_usage + materials
        
        if total_activity == 0:
            return None
        
        # Normalize: 1 activity = 33, 3+ = 100
        score = min(100, (total_activity / 3.0) * 100)
        return float(score)
    
    # ================================
    # LEARNING VELOCITY SIGNALS
    # ================================
    
    def extract_lessons_per_week(self) -> Optional[float]:
        """Average lessons completed per week (0-100)"""
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user or not user.created_at:
            return None
        
        weeks_active = max(1, (datetime.now(timezone.utc) - user.created_at).days / 7.0)
        
        completed = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        if completed == 0:
            return None
        
        lessons_per_week = completed / weeks_active
        
        # Normalize: 1 per week = 33, 3+ per week = 100
        score = min(100, (lessons_per_week / 3.0) * 100)
        return float(score)
    
    def extract_avg_module_completion_time(self) -> Optional[float]:
        """Average module completion time (0-100, faster = better)"""
        completed_modules = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'completed',
                UserModuleProgress.first_started_at.isnot(None),
                UserModuleProgress.completed_at.isnot(None)
            )
        ).all()
        
        if not completed_modules:
            return None
        
        total_days = 0
        for module_prog in completed_modules:
            days = (module_prog.completed_at - module_prog.first_started_at).days
            total_days += days
        
        avg_days = total_days / len(completed_modules)
        
        # Normalize: 1 day = 100, 7 days = 70, 14 days = 40, 30+ days = 0
        if avg_days <= 1:
            return 100.0
        elif avg_days <= 7:
            return 70.0 + (7 - avg_days) / 6.0 * 30  # Linear between 1-7 days
        elif avg_days <= 14:
            return 40.0 + (14 - avg_days) / 7.0 * 30  # Linear between 7-14 days
        elif avg_days <= 30:
            return max(0, 40 - ((avg_days - 14) / 16.0 * 40))  # Linear to 0
        else:
            return 0.0
    
    def extract_first_time_pass_rate(self) -> Optional[float]:
        """First-time quiz pass rate (0-100)"""
        # Get first attempts for each lesson
        from sqlalchemy import func as sql_func
        
        first_attempts = self.db.query(UserQuizAttempt).filter(
            and_(
                UserQuizAttempt.user_id == self.user_id,
                UserQuizAttempt.attempt_number == 1
            )
        ).all()
        
        if not first_attempts:
            return None
        
        passed_first = sum(1 for attempt in first_attempts if attempt.passed)
        
        return float((passed_first / len(first_attempts)) * 100)
    
    def extract_lesson_completion_ratio(self) -> Optional[float]:
        """Completed / Started lessons ratio (0-100)"""
        started = self.db.query(UserLessonProgress).filter(
            UserLessonProgress.user_id == self.user_id
        ).count()
        
        if started == 0:
            return None
        
        completed = self.db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed'
            )
        ).count()
        
        return float((completed / started) * 100)
    
    def extract_module_completion_ratio(self) -> Optional[float]:
        """Completed / Started modules ratio (0-100)"""
        started = self.db.query(UserModuleProgress).filter(
            UserModuleProgress.user_id == self.user_id
        ).count()
        
        if started == 0:
            return None
        
        completed = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'completed'
            )
        ).count()
        
        return float((completed / started) * 100)
    
    def extract_lessons_complete_awaiting_minigame(self) -> Optional[float]:
        """Modules where lessons complete but mini-game not yet passed (0-100)
        
        This is a HIGH-INTENT signal - user is at the mini-game gate,
        ready to complete module. Shows strong engagement and commitment.
        """
        count = self.db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == self.user_id,
                UserModuleProgress.status == 'lessons_complete'
            )
        ).count()
        
        if count == 0:
            return None
        
        # High score for readiness - user is at completion gate
        # 1 module ready = 50, 2+ modules ready = 100
        score = min(100, (count / 2.0) * 100)
        return float(score)
    
    def extract_curriculum_progression(self) -> Optional[float]:
        """Overall curriculum progression (0-100)"""
        total_lessons = self.db.query(Lesson).join(Module).filter(
            and_(Lesson.is_active == True, Module.is_active == True)
        ).count()
        
        if total_lessons == 0:
            return None
        
        completed_lessons = self.db.query(UserLessonProgress).join(Lesson).join(Module).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed',
                Lesson.is_active == True,
                Module.is_active == True
            )
        ).count()
        
        if completed_lessons == 0:
            return None
        
        return float((completed_lessons / total_lessons) * 100)
    
    def extract_advanced_content_engagement(self) -> Optional[float]:
        """Engagement with advanced content (0-100)"""
        # Check if user has completed at least one intermediate/advanced module
        # For MVP, check if completed 50%+ of curriculum
        progression = self.extract_curriculum_progression()
        if progression is None:
            return None
        
        return float(min(100, progression * 2))  # Scale up: 50% = 100
    
    def extract_learning_consistency(self) -> Optional[float]:
        """Learning consistency score (0-100)"""
        user = self.db.query(User).filter(User.id == self.user_id).first()
        if not user or not user.created_at:
            return None
        
        days_since_signup = (datetime.now(timezone.utc) - user.created_at).days
        if days_since_signup < 14:
            return None
        
        # Get completion dates for lessons
        completions = self.db.query(UserLessonProgress.completed_at).filter(
            and_(
                UserLessonProgress.user_id == self.user_id,
                UserLessonProgress.status == 'completed',
                UserLessonProgress.completed_at.isnot(None)
            )
        ).order_by(UserLessonProgress.completed_at).all()
        
        if len(completions) < 3:
            return None
        
        # Calculate standard deviation of gaps between completions
        dates = [c[0] for c in completions]
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        
        if not gaps:
            return 50.0
        
        avg_gap = sum(gaps) / len(gaps)
        variance = sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)
        std_dev = variance ** 0.5
        
        # Lower std dev = more consistent = higher score
        # Normalize: std_dev 0-1 day = 100, 3 days = 70, 7+ days = 0
        if std_dev <= 1:
            return 100.0
        elif std_dev <= 3:
            return 70.0 + (3 - std_dev) / 2.0 * 30
        elif std_dev <= 7:
            return max(0, 70 - ((std_dev - 3) / 4.0 * 70))
        else:
            return 0.0
    
    def extract_recent_acceleration(self) -> Optional[float]:
        """Recent learning acceleration (0-100)"""
        # Same as activity_acceleration but specifically for learning
        return self.extract_activity_acceleration()
    
    # ================================
    # REWARDS SIGNALS
    # ================================
    
    def extract_coins_earned(self) -> Optional[float]:
        """Total coins earned (0-100)"""
        balance = self.db.query(UserCoinBalance).filter(
            UserCoinBalance.user_id == self.user_id
        ).first()
        
        if not balance or balance.lifetime_earned == 0:
            return None
        
        # Normalize: 100 coins = 20, 500 coins = 60, 1000+ coins = 100
        coins = balance.lifetime_earned
        if coins >= 1000:
            return 100.0
        elif coins >= 500:
            return 60.0 + ((coins - 500) / 500.0 * 40)
        elif coins >= 100:
            return 20.0 + ((coins - 100) / 400.0 * 40)
        else:
            return float((coins / 100.0) * 20)
    
    def extract_coins_spent(self) -> Optional[float]:
        """Total coins spent (0-100)"""
        balance = self.db.query(UserCoinBalance).filter(
            UserCoinBalance.user_id == self.user_id
        ).first()
        
        if not balance or balance.lifetime_spent == 0:
            return None
        
        # Normalize: 50 coins = 40, 200+ coins = 100
        spent = balance.lifetime_spent
        score = min(100, (spent / 200.0) * 100)
        return float(score)
    
    def extract_coin_balance(self) -> Optional[float]:
        """Current coin balance (0-100)"""
        balance = self.db.query(UserCoinBalance).filter(
            UserCoinBalance.user_id == self.user_id
        ).first()
        
        if not balance:
            return None
        
        # Normalize: 50 coins = 25, 200 coins = 50, 500+ coins = 100
        current = balance.current_balance
        if current >= 500:
            return 100.0
        elif current >= 200:
            return 50.0 + ((current - 200) / 300.0 * 50)
        elif current >= 50:
            return 25.0 + ((current - 50) / 150.0 * 25)
        else:
            return float((current / 50.0) * 25)
    
    def extract_coins_earned_last_30(self) -> Optional[float]:
        """Coins earned in last 30 days (0-100)"""
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        
        total = self.db.query(func.sum(UserCoinTransaction.amount)).filter(
            and_(
                UserCoinTransaction.user_id == self.user_id,
                UserCoinTransaction.transaction_type == 'earned',
                UserCoinTransaction.created_at >= thirty_days_ago
            )
        ).scalar()
        
        if not total or total == 0:
            return None
        
        # Normalize: 100 coins = 50, 300+ coins = 100
        score = min(100, (total / 300.0) * 100)
        return float(score)
    
    def extract_badges_count(self) -> Optional[float]:
        """Total badges earned (0-100)"""
        count = self.db.query(UserBadge).filter(
            UserBadge.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 badge = 25, 4+ badges = 100
        score = min(100, (count / 4.0) * 100)
        return float(score)
    
    def extract_rare_badges(self) -> Optional[float]:
        """Has rare/epic badges (0-100)"""
        rare_count = self.db.query(UserBadge).join(Badge).filter(
            and_(
                UserBadge.user_id == self.user_id,
                Badge.rarity.in_(['rare', 'epic', 'legendary'])
            )
        ).count()
        
        if rare_count == 0:
            # Check if user has any badges
            any_badges = self.db.query(UserBadge).filter(
                UserBadge.user_id == self.user_id
            ).count()
            if any_badges == 0:
                return None
            return 0.0
        
        # Normalize: 1 rare = 50, 2+ rare = 100
        score = min(100, (rare_count / 2.0) * 100)
        return float(score)
    
    def extract_coupons_redeemed(self) -> Optional[float]:
        """Coupons redeemed count (0-100)"""
        count = self.db.query(UserCouponRedemption).filter(
            UserCouponRedemption.user_id == self.user_id
        ).count()
        
        if count == 0:
            return None
        
        # Normalize: 1 coupon = 50, 2+ coupons = 100
        score = min(100, (count / 2.0) * 100)
        return float(score)
    
    def extract_reward_engagement(self) -> Optional[float]:
        """Overall reward system engagement (0-100)"""
        balance = self.db.query(UserCoinBalance).filter(
            UserCoinBalance.user_id == self.user_id
        ).first()
        
        badges = self.db.query(UserBadge).filter(
            UserBadge.user_id == self.user_id
        ).count()
        
        coupons = self.db.query(UserCouponRedemption).filter(
            UserCouponRedemption.user_id == self.user_id
        ).count()
        
        if not balance and badges == 0 and coupons == 0:
            return None
        
        # Composite score
        coin_score = 30 if balance and balance.lifetime_earned > 0 else 0
        badge_score = min(40, badges * 10)
        coupon_score = min(30, coupons * 15)
        
        return float(coin_score + badge_score + coupon_score)
