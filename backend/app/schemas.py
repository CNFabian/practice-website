from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


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


# ================================
# ONBOARDING SCHEMAS
# ================================


class OnboardingStep1(BaseModel):
    """Avatar selection"""

    selected_avatar: str = Field(
        ..., min_length=1, max_length=100, description="Avatar identifier"
    )


class OnboardingStep2(BaseModel):
    """Realtor and loan officer status"""

    has_realtor: bool = Field(
        ..., description="Are you working with a real estate officer/agent?"
    )
    has_loan_officer: bool = Field(
        ..., description="Are you working with a loan officer?"
    )


class OnboardingStep3(BaseModel):
    """Expert contact preference"""

    wants_expert_contact: str = Field(
        ...,
        pattern="^(Yes|Maybe later)$",
        description="Would you like to get in contact with an expert?",
    )


class OnboardingStep4(BaseModel):
    """Homeownership timeline"""

    homeownership_timeline_months: int = Field(
        ...,
        ge=1,
        le=120,
        description="When do you want to achieve homeownership? (in months)",
    )


class OnboardingStep5(BaseModel):
    """Future home location"""

    zipcode: str = Field(
        ...,
        min_length=5,
        max_length=10,
        pattern="^[0-9]{5}(-[0-9]{4})?$",
        description="Add your zipcode",
        examples=["12345", "12345-6789"],
    )


# City Search Schemas (for Google Places API integration)
class CitySearchRequest(BaseModel):
    """Request model for city search"""
    query: str = Field(
        ..., 
        min_length=2, 
        max_length=100,
        description="City name to search for",
        examples=["los", "san francisco", "new york"]
    )

    class Config:
        json_schema_extra = {
            "example": {
                "query": "los"
            }
        }


class CityData(BaseModel):
    """Response model for a single city"""
    city: str = Field(..., description="City name")
    state: str = Field(..., description="State abbreviation (e.g., CA, TX)")
    zipcode: str = Field(..., description="Postal code")

    class Config:
        json_schema_extra = {
            "example": {
                "city": "Los Angeles",
                "state": "CA",
                "zipcode": "90001"
            }
        }


class CitySearchResponse(BaseModel):
    """Response model for city search"""
    cities: List[CityData] = Field(..., description="List of matching cities")

    class Config:
        json_schema_extra = {
            "example": {
                "cities": [
                    {
                        "city": "Los Angeles",
                        "state": "CA",
                        "zipcode": "90001"
                    },
                    {
                        "city": "Los Banos",
                        "state": "CA",
                        "zipcode": "93635"
                    }
                ]
            }
        }


class OnboardingComplete(BaseModel):
    selected_avatar: str
    has_realtor: bool
    has_loan_officer: bool
    wants_expert_contact: str
    homeownership_timeline_months: int
    zipcode: str


class OnboardingResponse(BaseSchema):
    id: UUID
    user_id: UUID
    selected_avatar: Optional[str]
    has_realtor: bool
    has_loan_officer: bool
    wants_expert_contact: Optional[str]
    homeownership_timeline_months: Optional[int]
    zipcode: Optional[str]
    completed_at: Optional[datetime]
    updated_at: datetime


class OnboardingStatusPayload(BaseModel):
    user_id: UUID
    completed: bool
    step: int
    total_steps: int = 5

    selected_avatar: Optional[str] = None
    has_realtor: Optional[bool] = None
    has_loan_officer: Optional[bool] = None
    wants_expert_contact: Optional[str] = None
    homeownership_timeline_months: Optional[int] = None
    zipcode: Optional[str] = None
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


class LessonResponse(BaseSchema):
    id: UUID
    module_id: UUID
    title: str
    description: Optional[str]
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