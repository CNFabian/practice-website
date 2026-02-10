from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, validator


# ================================
# BASE SCHEMAS
# ================================


class BaseSchema(BaseModel):
    class Config:
        from_attributes = True


# ================================
# AUTHENTICATION SCHEMAS
# ================================


class UserRegistration(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # YYYY-MM-DD format


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseSchema):
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    date_of_birth: Optional[str]
    profile_picture_url: Optional[str]
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class SendVerificationCodeRequest(BaseModel):
    """Request a 6-digit verification code (before sign-up)."""
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    """Email + 6-digit code for verification (sign-up flow)."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d+$")


# ================================
# ONBOARDING SCHEMAS
# ================================


class OnboardingStep1(BaseModel):
    """Step 1: Realtor and loan officer status"""

    has_realtor: str = Field(
        ..., 
        pattern="^(Yes, I am|Not yet)$",
        description="Are you working with a real estate officer?"
    )
    has_loan_officer: str = Field(
        ..., 
        pattern="^(Yes, I am|Not yet)$",
        description="Are you working with a loan officer?"
    )


class OnboardingStep2(BaseModel):
    """Step 2: Expert contact preference"""

    wants_expert_contact: str = Field(
        ...,
        pattern="^(Yes, I'd love to|Maybe later)$",
        description="Would you like to get in contact with experts?",
    )


class OnboardingStep3(BaseModel):
    """Step 3: Homeownership timeline"""

    homeownership_timeline_months: int = Field(
        ...,
        ge=1,
        le=120,
        description="When do you want to achieve homeownership? (in months)",
    )


class OnboardingStep4(BaseModel):
    """Step 4: Target cities for future home"""

    target_cities: List[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Select cities you're interested in",
        examples=[["New York", "Los Angeles"], ["Chicago"]]
    )
    
    @validator('target_cities')
    def validate_cities(cls, v):
        if not v or len(v) == 0:
            raise ValueError('At least one city must be selected')
        if len(v) > 10:
            raise ValueError('Maximum 10 cities allowed')
        # Sanitize city names
        sanitized = [city.strip()[:100] for city in v if city.strip()]
        if not sanitized:
            raise ValueError('Valid city names required')
        return sanitized


class OnboardingComplete(BaseModel):
    """Complete all onboarding steps at once"""
    has_realtor: str
    has_loan_officer: str
    wants_expert_contact: str
    homeownership_timeline_months: int
    target_cities: List[str]


class OnboardingResponse(BaseSchema):
    """Onboarding data response"""
    id: UUID
    user_id: UUID
    has_realtor: bool
    has_loan_officer: bool
    wants_expert_contact: Optional[str]
    homeownership_timeline_months: Optional[int]
    target_cities: Optional[List[str]]
    completed_at: Optional[datetime]
    updated_at: datetime


class OnboardingStatusPayload(BaseModel):
    """Onboarding status payload"""
    user_id: UUID
    completed: bool
    step: int
    total_steps: int = 4

    has_realtor: Optional[bool] = None
    has_loan_officer: Optional[bool] = None
    wants_expert_contact: Optional[str] = None
    homeownership_timeline_months: Optional[int] = None
    target_cities: Optional[List[str]] = None
    completed_at: Optional[datetime] = None


# ================================
# LEARNING CONTENT SCHEMAS
# ================================


class ModuleResponse(BaseSchema):
    id: UUID
    title: str
    description: Optional[str]
    thumbnail_url: Optional[str]
    order_index: int
    is_active: bool
    prerequisite_module_id: Optional[UUID]
    estimated_duration_minutes: Optional[int]
    difficulty_level: str
    created_at: datetime
    lesson_count: Optional[int] = None
    progress_percentage: Optional[Decimal] = None
    all_lessons_completed: Optional[bool] = None
    free_roam_available: Optional[bool] = None
    # Tree state fields for Grow Your Nest
    tree_growth_points: Optional[int] = None
    tree_current_stage: Optional[int] = None
    tree_total_stages: Optional[int] = 5
    tree_completed: Optional[bool] = None


class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order_index: int = Field(..., ge=0)
    is_active: bool = True
    prerequisite_module_id: Optional[UUID] = None
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    difficulty_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")


class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    order_index: int = Field(..., ge=0)
    is_active: bool = True
    prerequisite_module_id: Optional[UUID] = None
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    difficulty_level: str = Field(default="beginner", pattern="^(beginner|intermediate|advanced)$")


class LessonResponse(BaseSchema):
    id: UUID
    module_id: UUID
    title: str
    description: Optional[str]
    lesson_summary: Optional[str]
    image_url: Optional[str]
    video_url: Optional[str]
    video_transcription: Optional[str]
    order_index: int
    is_active: bool
    estimated_duration_minutes: Optional[int]
    nest_coins_reward: int
    created_at: datetime
    is_completed: Optional[bool] = None
    progress_seconds: Optional[int] = None
    grow_your_nest_played: Optional[bool] = None


class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    lesson_summary: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    video_transcription: Optional[str] = None
    order_index: int = Field(..., ge=0)
    is_active: bool = True
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    nest_coins_reward: int = Field(default=0, ge=0)


class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    lesson_summary: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    video_transcription: Optional[str] = None
    order_index: int = Field(..., ge=0)
    is_active: bool = True
    estimated_duration_minutes: Optional[int] = Field(None, ge=1)
    nest_coins_reward: int = Field(default=0, ge=0)


class QuizQuestionResponse(BaseSchema):
    id: UUID
    lesson_id: UUID
    question_text: str
    question_type: str
    explanation: Optional[str]
    order_index: int


class QuizAnswerResponse(BaseSchema):
    id: UUID
    question_id: UUID
    answer_text: str
    order_index: int
    # is_correct is not included in response for security


class QuizQuestionWithAnswers(QuizQuestionResponse):
    answers: List[QuizAnswerResponse]


class QuizQuestionCreate(BaseModel):
    lesson_id: UUID
    question_text: str = Field(..., min_length=1)
    question_type: str = Field(default="multiple_choice", pattern="^(multiple_choice|true_false|short_answer)$")
    explanation: Optional[str] = None
    order_index: int = Field(..., ge=0)
    is_active: bool = True


class QuizAnswerCreate(BaseModel):
    answer_text: str = Field(..., min_length=1)
    is_correct: bool = False
    order_index: int = Field(..., ge=0)


class QuizSubmission(BaseModel):
    lesson_id: UUID
    answers: List[Dict[str, UUID]]  # [{"question_id": "answer_id"}]
    time_taken_seconds: Optional[int] = None


class QuizResult(BaseModel):
    attempt_id: UUID
    score: Decimal
    total_questions: int
    correct_answers: int
    passed: bool
    coins_earned: int
    badges_earned: List[str]
    time_taken_seconds: Optional[int]


class UserProgressUpdate(BaseModel):
    lesson_id: UUID
    video_progress_seconds: int


# ================================
# OPTIMIZED PROGRESS TRACKING SCHEMAS
# ================================


class LessonMilestoneUpdate(BaseModel):
    """Track lesson milestone reached (25%, 50%, 75%)"""
    lesson_id: UUID
    milestone: int = Field(..., ge=0, le=100)  # 25, 50, 75, 90
    content_type: str = Field(..., pattern="^(video|transcript)$")
    video_progress_seconds: Optional[int] = Field(None, ge=0)
    transcript_progress_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    time_spent_seconds: int = Field(..., ge=0)


class LessonCompletionRequest(BaseModel):
    """Mark lesson as complete (auto or manual)"""
    lesson_id: UUID
    completion_method: str = Field(default="manual", pattern="^(auto|manual|milestone)$")
    video_progress_seconds: Optional[int] = Field(None, ge=0)
    transcript_progress_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    time_spent_seconds: int = Field(..., ge=0)
    content_type: Optional[str] = Field(None, pattern="^(video|transcript)$")


class BatchProgressItem(BaseModel):
    """Single lesson progress item for batch update"""
    lesson_id: UUID
    milestone: Optional[int] = Field(None, ge=0, le=100)
    content_type: Optional[str] = Field(None, pattern="^(video|transcript)$")
    video_progress_seconds: Optional[int] = Field(None, ge=0)
    transcript_progress_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    time_spent_seconds: int = Field(..., ge=0)
    completed: bool = False


class BatchProgressUpdate(BaseModel):
    """Batch update multiple lessons in single request"""
    items: List[BatchProgressItem] = Field(..., min_items=1, max_items=50)


class LessonProgressResponse(BaseModel):
    """Response after progress update"""
    lesson_id: UUID
    status: str
    milestones_reached: List[int]
    completion_percentage: Decimal
    auto_completed: bool = False
    message: str


# ================================
# REWARD SYSTEM SCHEMAS
# ================================


class BadgeResponse(BaseSchema):
    id: UUID
    name: str
    description: Optional[str]
    icon_url: Optional[str]
    badge_type: Optional[str]
    rarity: str
    created_at: datetime


class UserBadgeResponse(BaseSchema):
    id: UUID
    badge: BadgeResponse
    earned_at: datetime
    source_lesson_id: Optional[UUID]


class RewardCouponResponse(BaseSchema):
    id: UUID
    title: str
    description: Optional[str]
    partner_company: Optional[str]
    cost_in_coins: int
    max_redemptions: Optional[int]
    current_redemptions: int
    expires_at: Optional[datetime]
    image_url: Optional[str]
    terms_conditions: Optional[str]
    is_active: bool


class CouponRedemption(BaseModel):
    coupon_id: UUID


class UserCouponRedemptionResponse(BaseSchema):
    id: UUID
    coupon: RewardCouponResponse
    redemption_code: str
    coins_spent: int
    redeemed_at: datetime
    expires_at: Optional[datetime]
    is_active: bool


class CoinBalanceResponse(BaseSchema):
    current_balance: int
    lifetime_earned: int
    lifetime_spent: int
    updated_at: datetime


class CoinTransactionResponse(BaseSchema):
    id: UUID
    transaction_type: str
    amount: int
    source_type: Optional[str]
    description: Optional[str]
    created_at: datetime


# ================================
# DASHBOARD SCHEMAS
# ================================


class DashboardOverview(BaseModel):
    total_coins: int
    total_badges: int
    modules_completed: int
    total_modules: int
    current_streak: int
    recent_achievements: List[str]
    next_lesson: Optional[LessonResponse]


class ModuleProgress(BaseModel):
    module: ModuleResponse
    lessons_completed: int
    total_lessons: int
    completion_percentage: Decimal
    status: str


# ================================
# MATERIALS SCHEMAS
# ================================


class MaterialResourceResponse(BaseSchema):
    id: UUID
    title: str
    description: Optional[str]
    resource_type: str
    file_url: Optional[str]
    external_url: Optional[str]
    thumbnail_url: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    download_count: int
    order_index: int
    created_at: datetime


class CalculatorInput(BaseModel):
    calculator_type: str
    input_data: Dict[str, Any]


class CalculatorResult(BaseModel):
    calculator_type: str
    input_data: Dict[str, Any]
    result_data: Dict[str, Any]
    session_id: Optional[str] = None


# ================================
# HELP & SUPPORT SCHEMAS
# ================================


class FAQResponse(BaseSchema):
    id: UUID
    question: str
    answer: str
    category: Optional[str]
    order_index: int
    view_count: int


class SupportTicketCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=10)
    category: Optional[str] = None


class SupportTicketResponse(BaseSchema):
    id: UUID
    name: str
    email: str
    subject: str
    message: str
    priority: str
    status: str
    category: Optional[str]
    admin_response: Optional[str]
    responded_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime


# ================================
# NOTIFICATION SCHEMAS
# ================================


class NotificationResponse(BaseSchema):
    id: UUID
    notification_type: str
    title: str
    message: str
    is_read: bool
    priority: str
    expires_at: Optional[datetime]
    created_at: datetime


class NotificationUpdate(BaseModel):
    is_read: bool


# ================================
# MINI-GAME (GROW YOUR NEST) SCHEMAS
# ================================


class MiniGameQuestion(BaseModel):
    """Single question for mini-game"""
    id: str
    lesson_id: str
    lesson_title: str
    question_text: str
    question_type: str
    order_index: int
    answers: List[Dict[str, Any]]  # [{"id": "uuid", "answer_text": "...", "order_index": 0}]


class MiniGameQuestionsResponse(BaseModel):
    """Response with all questions for the module mini-game"""
    module: Dict[str, Any]  # Module info
    total_lessons: int
    completed_lessons: int
    total_questions: int
    questions: List[MiniGameQuestion]  # Flat list of all questions from all lessons
    user_status: Dict[str, Any]  # User's progress and attempt history


class MiniGameSubmission(BaseModel):
    """Submit mini-game answers"""
    module_id: UUID
    answers: List[Dict[str, UUID]]  # [{"question_id": "answer_id"}]
    time_taken_seconds: Optional[int] = None
    game_data: Optional[Dict[str, Any]] = None  # Store game-specific data (score, level, etc.)


class MiniGameResult(BaseModel):
    """Mini-game results"""
    attempt_id: UUID
    module_id: UUID
    module_title: str
    score: Decimal
    total_questions: int
    correct_answers: int
    passed: bool
    coins_earned: int
    badges_earned: List[str]
    time_taken_seconds: Optional[int]
    attempt_number: int
    module_completed: bool  # Whether this attempt completed the module


class MiniGameAttemptHistory(BaseModel):
    """Previous attempt summary"""
    id: UUID
    attempt_number: int
    score: Decimal
    passed: bool
    completed_at: datetime


# ================================
# COMMON RESPONSE SCHEMAS
# ================================


class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[List[str]] = None


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int


# ================================
# SETTINGS SCHEMAS
# ================================


class UserSettings(BaseModel):
    notifications_enabled: bool = True
    email_notifications: bool = True
    push_notifications: bool = True
    marketing_emails: bool = False
    weekly_digest: bool = True


class UserSettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    weekly_digest: Optional[bool] = None


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # YYYY-MM-DD format
    profile_picture_url: Optional[str] = None


# ================================
# ANALYTICS SCHEMAS
# ================================


class LeadScoreResponse(BaseSchema):
    """Lead score details"""
    user_id: UUID
    engagement_score: float
    timeline_urgency_score: float
    help_seeking_score: float
    learning_velocity_score: float
    rewards_score: float
    composite_score: float
    lead_temperature: Optional[str]
    intent_band: Optional[str]
    profile_completion_pct: float
    available_signals_count: int
    total_signals_count: int
    last_calculated_at: datetime
    last_activity_at: Optional[datetime]


class LeadSummary(BaseModel):
    """Simplified lead summary for list views"""
    user_id: UUID
    email: str
    first_name: str
    last_name: str
    composite_score: float
    lead_temperature: Optional[str]
    temperature_label: Optional[str]
    intent_band: Optional[str]
    intent_label: Optional[str]
    profile_completion_pct: float
    last_activity_at: Optional[datetime]
    created_at: datetime


class LeadDetailResponse(BaseModel):
    """Detailed lead information with user data and scores"""
    user_id: UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    created_at: datetime
    last_login_at: Optional[datetime]
    
    # Scores
    scores: LeadScoreResponse
    
    # Classification
    temperature: Optional[str]
    temperature_label: Optional[str]
    intent_band: Optional[str]
    intent_label: Optional[str]
    classification_reasoning: Optional[str]
    
    # Recommended actions
    recommended_actions: Optional[Dict[str, Any]]
    
    # Onboarding data
    onboarding_data: Optional[Dict[str, Any]]


class LeadScoreHistoryResponse(BaseModel):
    """Historical lead score snapshot"""
    snapshot_date: str
    composite_score: float
    lead_temperature: Optional[str]
    intent_band: Optional[str]
    metrics: Optional[Dict[str, Any]]


class AnalyticsInsightsResponse(BaseModel):
    """Aggregate analytics insights"""
    total_leads: int
    temperature_distribution: Dict[str, Any]
    intent_distribution: Dict[str, Any]
    average_composite_score: float
    average_profile_completion: float
    high_priority_leads: int
    actionable_leads: int


class UserProgressResponse(BaseModel):
    """User's own progress metrics (non-sensitive)"""
    user_id: UUID
    engagement_level: str  # Low, Medium, High
    progress_percentage: float
    lessons_completed: int
    modules_completed: int
    badges_earned: int
    coins_balance: int
    recent_achievements: List[str]


class RecalculationRequest(BaseModel):
    """Request to recalculate scores"""
    user_ids: Optional[List[UUID]] = None  # None = all users
    force: bool = False  # Force recalculation even if recent


class RecalculationResponse(BaseModel):
    """Response from recalculation operation"""
    success: bool
    message: str
    total_users: int
    successful: int
    failed: int
    execution_time_seconds: float