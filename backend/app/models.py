import datetime
from decimal import Decimal
from typing import List, Optional
import enum

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Boolean,
    Text,
    Date,
    TIMESTAMP,
    JSON,
    DECIMAL,
    UUID,
    text,
    Enum,
    Float,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column, declarative_base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, INET

Base = declarative_base()


# ================================
# ENUMS FOR ANALYTICS
# ================================


class LeadTemperature(enum.Enum):
    """Lead temperature classification"""
    hot_lead = "hot_lead"
    warm_lead = "warm_lead"
    cold_lead = "cold_lead"
    dormant = "dormant"


class IntentBand(enum.Enum):
    """User intent classification"""
    low_intent = "low_intent"
    medium_intent = "medium_intent"
    high_intent = "high_intent"
    very_high_intent = "very_high_intent"


class EventCategory(enum.Enum):
    """Categorization of user behavior events"""
    learning = "learning"
    engagement = "engagement"
    help_seeking = "help_seeking"
    goal_indication = "goal_indication"
    rewards = "rewards"


# ================================
# AUTHENTICATION & USER MANAGEMENT
# ================================


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    date_of_birth: Mapped[Optional[datetime.date]] = mapped_column(Date, nullable=True)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    password_reset_token: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    password_reset_expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_login_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    onboarding_response: Mapped[List["UserOnboarding"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    coin_transactions: Mapped[List["UserCoinTransaction"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    coin_balance: Mapped[Optional["UserCoinBalance"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    badges: Mapped[List["UserBadge"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    lesson_progress: Mapped[List["UserLessonProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    module_progress: Mapped[List["UserModuleProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    quiz_attempts: Mapped[List["UserQuizAttempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    module_quiz_attempts: Mapped[List["UserModuleQuizAttempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    coupon_redemptions: Mapped[List["UserCouponRedemption"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    calculator_usages: Mapped[List["CalculatorUsage"]] = relationship(
        back_populates="user"
    )
    activity_logs: Mapped[List["UserActivityLog"]] = relationship(back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    
    # Analytics relationships
    lead_score: Mapped[Optional["UserLeadScore"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    behavior_events: Mapped[List["UserBehaviorEvent"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    lead_score_history: Mapped[List["LeadScoreHistory"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __str__(self):
        return f"{self.email} ({self.first_name} {self.last_name})"


class UserOnboarding(Base):
    __tablename__ = "user_onboarding"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
     # Step 1: Realtor and loan officer status
    has_realtor: Mapped[bool] = mapped_column(Boolean, default=False)
    has_loan_officer: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Step 2: Expert contact preference
    wants_expert_contact: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "Yes, I'd love to" or "Maybe later"
    
    # Step 3: Homeownership timeline in months
    homeownership_timeline_months: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    
    # Step 4: Target cities (multiple cities)
    target_cities: Mapped[Optional[List[str]]] = mapped_column(
        JSON, nullable=True
    )
    
    # Legacy fields for backward compatibility
    selected_avatar: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    zipcode: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    homebuying_timeline_months: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    learning_style: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    reward_interests: Mapped[Optional[List[str]]] = mapped_column(
        JSON, nullable=True
    )
    homebuying_stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    budget_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    target_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    timeline_to_buy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    first_time_buyer: Mapped[bool] = mapped_column(Boolean, default=True)
    credit_score_range: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="onboarding_response")


# ================================
# LEARNING CONTENT MANAGEMENT
# ================================


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    prerequisite_module_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("modules.id"), nullable=True
    )
    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    difficulty_level: Mapped[str] = mapped_column(String(20), default="beginner")
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    lessons: Mapped[List["Lesson"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )
    progress: Mapped[List["UserModuleProgress"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )
    quiz_attempts: Mapped[List["UserModuleQuizAttempt"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )
    
    def __str__(self):
        return self.title


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lesson_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_transcription: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    nest_coins_reward: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    module: Mapped["Module"] = relationship(back_populates="lessons")
    quiz_questions: Mapped[List["QuizQuestion"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    progress: Mapped[List["UserLessonProgress"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    badge_rewards: Mapped[List["LessonBadgeReward"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    user_quiz_attempts: Mapped[List["UserQuizAttempt"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )
    
    def __str__(self):
        return self.title


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), default="multiple_choice")
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="quiz_questions")
    answers: Mapped[List["QuizAnswer"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )

    def __str__(self):
    # Truncate long questions
        return self.question_text[:80] + "..." if len(self.question_text) > 80 else self.question_text



class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    question_id: Mapped[UUID] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE")
    )
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    question: Mapped["QuizQuestion"] = relationship(back_populates="answers")
    user_quiz_answers: Mapped[List["UserQuizAnswer"]] = relationship(
        back_populates="selected_answer"
    )

    # Add this method
    def __str__(self):
        return self.answer_text


# ================================
# REWARD SYSTEM
# ================================


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    badge_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rarity: Mapped[str] = mapped_column(String(20), default="common")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    lesson_rewards: Mapped[List["LessonBadgeReward"]] = relationship(
        back_populates="badge", cascade="all, delete-orphan"
    )
    users: Mapped[List["UserBadge"]] = relationship(
        back_populates="badge", cascade="all, delete-orphan"
    )

    def __str__(self):
        return self.name


class LessonBadgeReward(Base):
    __tablename__ = "lesson_badge_rewards"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    badge_id: Mapped[UUID] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"))
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    lesson: Mapped["Lesson"] = relationship(back_populates="badge_rewards")
    badge: Mapped["Badge"] = relationship(back_populates="lesson_rewards")


class RewardCoupon(Base):
    __tablename__ = "reward_coupons"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coupon_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    discount_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    discount_value: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(10, 2), nullable=True
    )
    partner_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cost_in_coins: Mapped[int] = mapped_column(Integer, nullable=False)
    max_redemptions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_redemptions: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    terms_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user_redemptions: Mapped[List["UserCouponRedemption"]] = relationship(
        back_populates="coupon", cascade="all, delete-orphan"
    )

    def __str__(self):
        return f"{self.title} ({self.partner_company})"


# ================================
# USER PROGRESS & ACHIEVEMENTS
# ================================


class UserCoinTransaction(Base):
    __tablename__ = "user_coin_transactions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    source_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="coin_transactions")


class UserCoinBalance(Base):
    __tablename__ = "user_coin_balances"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current_balance: Mapped[int] = mapped_column(Integer, default=0)
    lifetime_earned: Mapped[int] = mapped_column(Integer, default=0)
    lifetime_spent: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="coin_balance")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    badge_id: Mapped[UUID] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"))
    earned_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    source_lesson_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("lessons.id"), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="badges")
    badge: Mapped["Badge"] = relationship(back_populates="users")


class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    quiz_attempts: Mapped[int] = mapped_column(Integer, default=0)
    quiz_best_score: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(5, 2), nullable=True
    )
    video_progress_seconds: Mapped[int] = mapped_column(Integer, default=0)
    
    # Enhanced tracking fields for optimized progress monitoring
    content_type_consumed: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "video" or "transcript"
    transcript_progress_percentage: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(5, 2), nullable=True, default=Decimal("0.00")
    )
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    completion_method: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "auto", "manual", "milestone"
    milestones_reached: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # "25,50,75" - comma-separated milestone percentages
    
    first_started_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_accessed_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="lesson_progress")
    lesson: Mapped["Lesson"] = relationship(back_populates="progress")


class UserModuleProgress(Base):
    __tablename__ = "user_module_progress"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    module_id: Mapped[UUID] = mapped_column(
        ForeignKey("modules.id", ondelete="CASCADE")
    )
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_lessons: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_percentage: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    
    # Mini-game (Grow Your Nest) tracking
    minigame_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    minigame_best_score: Mapped[Optional[Decimal]] = mapped_column(
        DECIMAL(5, 2), nullable=True
    )
    minigame_attempts: Mapped[int] = mapped_column(Integer, default=0)
    # Grow Your Nest tree (lesson + freeroam) state
    tree_growth_points: Mapped[int] = mapped_column(Integer, default=0)
    tree_current_stage: Mapped[int] = mapped_column(Integer, default=0)
    tree_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    tree_completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    first_started_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    last_accessed_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="module_progress")
    module: Mapped["Module"] = relationship(back_populates="progress")


class UserQuizAttempt(Base):
    __tablename__ = "user_quiz_attempts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id: Mapped[UUID] = mapped_column(
        ForeignKey("lessons.id", ondelete="CASCADE")
    )
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
    completed_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="quiz_attempts")
    lesson: Mapped["Lesson"] = relationship(back_populates="user_quiz_attempts")
    quiz_answers: Mapped[List["UserQuizAnswer"]] = relationship(
        back_populates="quiz_attempt", cascade="all, delete-orphan"
    )


class UserQuizAnswer(Base):
    __tablename__ = "user_quiz_answers"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    quiz_attempt_id: Mapped[UUID] = mapped_column(
        ForeignKey("user_quiz_attempts.id", ondelete="CASCADE")
    )
    question_id: Mapped[UUID] = mapped_column(ForeignKey("quiz_questions.id"))
    selected_answer_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("quiz_answers.id"), nullable=True
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    quiz_attempt: Mapped["UserQuizAttempt"] = relationship(
        back_populates="quiz_answers"
    )
    question: Mapped["QuizQuestion"] = relationship()
    selected_answer: Mapped[Optional["QuizAnswer"]] = relationship(
        back_populates="user_quiz_answers"
    )


class UserModuleQuizAttempt(Base):
    """Track user's mini-game (Grow Your Nest) attempts at module level"""
    __tablename__ = "user_module_quiz_attempts"
    
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    module_id: Mapped[UUID] = mapped_column(ForeignKey("modules.id", ondelete="CASCADE"))
    
    attempt_number: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, nullable=False)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Game-specific metadata (scores, levels, achievements in the game)
    game_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    started_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    completed_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="module_quiz_attempts")
    module: Mapped["Module"] = relationship(back_populates="quiz_attempts")


class UserCouponRedemption(Base):
    __tablename__ = "user_coupon_redemptions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    coupon_id: Mapped[UUID] = mapped_column(
        ForeignKey("reward_coupons.id", ondelete="CASCADE")
    )
    redemption_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    coins_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    redeemed_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    used_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="coupon_redemptions")
    coupon: Mapped["RewardCoupon"] = relationship(back_populates="user_redemptions")


# ================================
# CALCULATORS & TOOLS
# ================================


class CalculatorUsage(Base):
    __tablename__ = "calculator_usage"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    calculator_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="calculator_usages")


# ================================
# ANALYTICS & LEAD SCORING
# ================================


class UserLeadScore(Base):
    __tablename__ = "user_lead_scores"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    
    # Component scores (0-100 scale)
    engagement_score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    timeline_urgency_score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    help_seeking_score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    learning_velocity_score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    rewards_score: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    
    # Composite score (0-1000 scale)
    composite_score: Mapped[Decimal] = mapped_column(DECIMAL(6, 2), default=0.0)
    
    # Classifications
    lead_temperature: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # hot_lead, warm_lead, cold_lead, dormant
    intent_band: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # low_intent, medium_intent, high_intent, very_high_intent
    
    # Profile completion
    profile_completion_pct: Mapped[Decimal] = mapped_column(DECIMAL(5, 2), default=0.0)
    available_signals_count: Mapped[int] = mapped_column(Integer, default=0)
    total_signals_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Metadata
    last_calculated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    last_activity_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="lead_score")


class UserBehaviorEvent(Base):
    __tablename__ = "user_behavior_events"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    # Event details
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # learning, engagement, help_seeking, goal_indication, rewards
    event_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Idempotency support for deduplication
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )
    
    # Scoring impact
    event_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now, index=True
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="behavior_events")


class LeadScoreHistory(Base):
    __tablename__ = "lead_score_history"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    
    # Snapshot data
    snapshot_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    composite_score: Mapped[Decimal] = mapped_column(DECIMAL(6, 2), nullable=False)
    lead_temperature: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    intent_band: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Full metrics snapshot
    metrics_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="lead_score_history")


# ================================
# SYSTEM TABLES
# ================================


class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    activity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    activity_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="activity_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    notification_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    expires_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")


# ================================
# HELP & SUPPORT SYSTEM
# ================================


class FAQ(Base):
    __tablename__ = "faqs"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(
        String(20), default="normal"
    )  # low, normal, high, urgent
    status: Mapped[str] = mapped_column(
        String(20), default="open"
    )  # open, in_progress, resolved, closed
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    admin_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship()


# ================================
# MATERIALS & RESOURCES
# ================================


class MaterialResource(Base):
    __tablename__ = "material_resources"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resource_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # calculator, checklist, document, tool
    file_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )


class MaterialDownload(Base):
    __tablename__ = "material_downloads"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=text("uuid_generate_v4()")
    )
    user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    material_id: Mapped[UUID] = mapped_column(
        ForeignKey("material_resources.id", ondelete="CASCADE")
    )
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    downloaded_at: Mapped[datetime.datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.datetime.now
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship()
    material: Mapped["MaterialResource"] = relationship()

