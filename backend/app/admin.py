from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from wtforms.validators import DataRequired, Optional as OptionalValidator, NumberRange
from models import (
    Module, Lesson, QuizQuestion, QuizAnswer, RewardCoupon, Badge, User,
    UserLeadScore, UserBehaviorEvent, LeadScoreHistory
)
from database import engine
from auth import AuthManager
import os


def _truncate(text, max_len=60):
    """Truncate text for list display."""
    if text is None:
        return "—"
    s = str(text).strip()
    return (s[: max_len] + "…") if len(s) > max_len else s


# Authentication Backend for Admin
class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")
        
        admin_emails = [e.strip() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]
        
        if email not in admin_emails:
            return False
        
        from database import SessionLocal
        db = SessionLocal()
        try:
            user = AuthManager.authenticate_user(db, email, password)
            if user:
                request.session.update({"user_id": str(user.id), "email": email})
                return True
        finally:
            db.close()
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("user_id") is not None


# =============================================================================
# CONTENT MANAGEMENT (Modules → Lessons → Quiz Questions → Quiz Answers)
# =============================================================================

CONTENT_CATEGORY = "Content"
CONTENT_ICON = "fa-solid fa-book-open"


class ModuleAdmin(ModelView, model=Module):
    category = CONTENT_CATEGORY
    category_icon = CONTENT_ICON
    name = "Module"
    name_plural = "Modules"
    icon = "fa-solid fa-book"

    # List: compact, readable, sortable
    column_list = [
        Module.order_index,
        Module.title,
        Module.difficulty_level,
        Module.estimated_duration_minutes,
        Module.is_active,
        Module.created_at,
    ]
    column_labels = {
        "order_index": "#",
        "title": "Title",
        "difficulty_level": "Difficulty",
        "estimated_duration_minutes": "Duration (min)",
        "is_active": "Active",
        "created_at": "Created",
        "description": "Description",
        "thumbnail_url": "Thumbnail URL",
        "prerequisite_module_id": "Prerequisite Module",
    }
    column_searchable_list = [Module.title, Module.description]
    column_sortable_list = [Module.order_index, Module.title, Module.created_at]
    column_default_sort = [(Module.order_index, False)]
    column_formatters = {
        Module.description: lambda m, a: _truncate(m.description, 80),
    }
    column_filters = [Module.is_active, Module.difficulty_level]

    # Form: logical order, text areas for long fields
    form_columns = [
        Module.title,
        Module.description,
        Module.order_index,
        Module.difficulty_level,
        Module.estimated_duration_minutes,
        Module.thumbnail_url,
        Module.prerequisite_module_id,
        Module.is_active,
    ]
    form_args = {
        "title": {"label": "Title", "validators": [DataRequired()], "description": "Display name of the module."},
        "description": {"label": "Description", "description": "Optional summary for the module."},
        "order_index": {"label": "Order", "validators": [DataRequired(), NumberRange(min=0)], "description": "Order in the list (0 = first)."},
        "difficulty_level": {"label": "Difficulty", "description": "e.g. beginner, intermediate, advanced."},
        "estimated_duration_minutes": {"label": "Duration (minutes)", "description": "Estimated time to complete."},
        "is_active": {"label": "Active", "description": "Inactive modules are hidden from users."},
    }
    form_widget_args = {
        "description": {"rows": 4},
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]
    can_view_details = True


class LessonAdmin(ModelView, model=Lesson):
    category = CONTENT_CATEGORY
    category_icon = CONTENT_ICON
    name = "Lesson"
    name_plural = "Lessons"
    icon = "fa-solid fa-graduation-cap"

    column_list = [
        Lesson.order_index,
        Lesson.title,
        "module",
        Lesson.estimated_duration_minutes,
        Lesson.nest_coins_reward,
        Lesson.is_active,
    ]
    column_labels = {
        "order_index": "#",
        "title": "Title",
        "module": "Module",
        "estimated_duration_minutes": "Duration (min)",
        "nest_coins_reward": "Coins",
        "is_active": "Active",
        "description": "Description",
        "lesson_summary": "Summary",
        "image_url": "Image URL",
        "video_url": "Video URL",
        "video_transcription": "Video transcript",
    }
    column_searchable_list = [Lesson.title, Lesson.description]
    column_sortable_list = [Lesson.order_index, Lesson.title, Lesson.nest_coins_reward]
    column_default_sort = [(Lesson.order_index, False)]
    column_formatters = {
        Lesson.description: lambda m, a: _truncate(m.description, 80),
    }
    column_filters = [Lesson.is_active]

    # AJAX refs so module dropdown is searchable and doesn't load everything at once
    form_ajax_refs = {
        "module": {"fields": ("title",), "order_by": "order_index"},
    }
    form_columns = [
        "module",
        Lesson.title,
        Lesson.description,
        Lesson.lesson_summary,
        Lesson.order_index,
        Lesson.estimated_duration_minutes,
        Lesson.nest_coins_reward,
        Lesson.image_url,
        Lesson.video_url,
        Lesson.video_transcription,
        Lesson.is_active,
    ]
    form_args = {
        "title": {"label": "Title", "validators": [DataRequired()], "description": "Display name of the lesson."},
        "description": {"label": "Description", "description": "Full lesson description."},
        "lesson_summary": {"label": "Summary", "description": "Short summary (optional)."},
        "order_index": {"label": "Order", "validators": [DataRequired(), NumberRange(min=0)], "description": "Order within the module."},
        "nest_coins_reward": {"label": "Coins reward", "description": "Coins awarded on completion."},
        "video_transcription": {"label": "Video transcript", "description": "Optional transcript text."},
        "is_active": {"label": "Active", "description": "Inactive lessons are hidden."},
    }
    form_widget_args = {
        "description": {"rows": 4},
        "lesson_summary": {"rows": 2},
        "video_transcription": {"rows": 6},
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]
    can_view_details = True


class QuizQuestionAdmin(ModelView, model=QuizQuestion):
    category = CONTENT_CATEGORY
    category_icon = CONTENT_ICON
    name = "Quiz Question"
    name_plural = "Quiz Questions"
    icon = "fa-solid fa-question-circle"

    column_list = [
        QuizQuestion.order_index,
        QuizQuestion.question_text,
        "lesson",
        QuizQuestion.question_type,
        QuizQuestion.is_active,
    ]
    column_labels = {
        "order_index": "#",
        "question_text": "Question",
        "lesson": "Lesson",
        "question_type": "Type",
        "explanation": "Explanation",
        "is_active": "Active",
    }
    column_searchable_list = [QuizQuestion.question_text, QuizQuestion.explanation]
    column_sortable_list = [QuizQuestion.order_index, QuizQuestion.created_at]
    column_default_sort = [(QuizQuestion.order_index, False)]
    column_formatters = {
        QuizQuestion.question_text: lambda m, a: _truncate(m.question_text, 70),
        "lesson": lambda m, a: getattr(m.lesson, "title", None) or "—",
    }
    column_filters = [QuizQuestion.is_active, QuizQuestion.question_type]

    form_ajax_refs = {
        "lesson": {"fields": ("title",), "order_by": "order_index"},
    }
    form_columns = [
        "lesson",
        QuizQuestion.question_text,
        QuizQuestion.question_type,
        QuizQuestion.explanation,
        QuizQuestion.order_index,
        QuizQuestion.is_active,
    ]
    form_args = {
        "question_text": {"label": "Question text", "validators": [DataRequired()], "description": "The question shown to the user."},
        "question_type": {"label": "Type", "description": "e.g. multiple_choice."},
        "explanation": {"label": "Explanation", "description": "Shown after answering (optional)."},
        "order_index": {"label": "Order", "validators": [DataRequired(), NumberRange(min=0)]},
        "is_active": {"label": "Active"},
    }
    form_widget_args = {
        "question_text": {"rows": 3},
        "explanation": {"rows": 3},
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]
    can_view_details = True


class QuizAnswerAdmin(ModelView, model=QuizAnswer):
    category = CONTENT_CATEGORY
    category_icon = CONTENT_ICON
    name = "Quiz Answer"
    name_plural = "Quiz Answers"
    icon = "fa-solid fa-check-circle"

    column_list = [
        QuizAnswer.order_index,
        QuizAnswer.answer_text,
        "question",
        QuizAnswer.is_correct,
    ]
    column_labels = {
        "order_index": "#",
        "answer_text": "Answer",
        "question": "Question",
        "is_correct": "Correct",
    }
    column_searchable_list = [QuizAnswer.answer_text]
    column_sortable_list = [QuizAnswer.order_index]
    column_default_sort = [(QuizAnswer.order_index, False)]
    column_formatters = {
        QuizAnswer.answer_text: lambda m, a: _truncate(m.answer_text, 50),
        "question": lambda m, a: _truncate(getattr(m.question, "question_text", None), 45) if m.question else "—",
        QuizAnswer.is_correct: lambda m, a: "✓ Yes" if m.is_correct else "✗ No",
    }
    column_filters = [QuizAnswer.is_correct]

    form_ajax_refs = {
        "question": {"fields": ("question_text",), "order_by": "order_index"},
    }
    form_columns = [
        "question",
        QuizAnswer.answer_text,
        QuizAnswer.is_correct,
        QuizAnswer.order_index,
    ]
    form_args = {
        "answer_text": {"label": "Answer text", "validators": [DataRequired()], "description": "The choice shown to the user."},
        "is_correct": {"label": "Correct answer?", "description": "Exactly one correct answer per question is typical."},
        "order_index": {"label": "Order", "validators": [DataRequired(), NumberRange(min=0)]},
    }
    form_widget_args = {
        "answer_text": {"rows": 2},
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]
    can_view_details = True


# =============================================================================
# REWARDS
# =============================================================================

REWARDS_CATEGORY = "Rewards"
REWARDS_ICON = "fa-solid fa-gift"


class RewardCouponAdmin(ModelView, model=RewardCoupon):
    category = REWARDS_CATEGORY
    category_icon = REWARDS_ICON
    name = "Reward Coupon"
    name_plural = "Reward Coupons"
    icon = "fa-solid fa-ticket"

    column_list = [
        RewardCoupon.title,
        RewardCoupon.partner_company,
        RewardCoupon.cost_in_coins,
        RewardCoupon.current_redemptions,
        RewardCoupon.max_redemptions,
        RewardCoupon.is_active,
    ]
    column_searchable_list = [RewardCoupon.title, RewardCoupon.partner_company]
    column_sortable_list = [RewardCoupon.cost_in_coins, RewardCoupon.created_at]
    column_filters = [RewardCoupon.is_active]
    column_labels = {
        "cost_in_coins": "Cost (Coins)",
        "partner_company": "Partner",
        "is_active": "Active",
        "max_redemptions": "Max Redemptions",
        "current_redemptions": "Redeemed",
        "expires_at": "Expires",
        "image_url": "Image URL",
        "terms_conditions": "Terms & Conditions",
    }
    form_columns = [
        RewardCoupon.title,
        RewardCoupon.description,
        RewardCoupon.partner_company,
        RewardCoupon.coupon_code,
        RewardCoupon.discount_type,
        RewardCoupon.discount_value,
        RewardCoupon.cost_in_coins,
        RewardCoupon.max_redemptions,
        RewardCoupon.current_redemptions,
        RewardCoupon.expires_at,
        RewardCoupon.image_url,
        RewardCoupon.terms_conditions,
        RewardCoupon.is_active,
    ]
    form_widget_args = {
        "description": {"rows": 3},
        "terms_conditions": {"rows": 3},
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]


class BadgeAdmin(ModelView, model=Badge):
    category = REWARDS_CATEGORY
    category_icon = REWARDS_ICON
    name = "Badge"
    name_plural = "Badges"
    icon = "fa-solid fa-medal"

    column_list = [Badge.name, Badge.badge_type, Badge.rarity, Badge.is_active]
    column_searchable_list = [Badge.name, Badge.description]
    column_sortable_list = [Badge.name, Badge.created_at]
    column_filters = [Badge.is_active, Badge.badge_type, Badge.rarity]
    column_labels = {
        "icon_url": "Icon URL",
        "badge_type": "Type",
        "is_active": "Active",
    }
    form_columns = [
        Badge.name,
        Badge.description,
        Badge.icon_url,
        Badge.badge_type,
        Badge.rarity,
        Badge.is_active,
    ]
    form_widget_args = {
        "description": {"rows": 2},
    }
    page_size = 25


# =============================================================================
# USERS
# =============================================================================

USERS_CATEGORY = "Users"
USERS_ICON = "fa-solid fa-users"


class UserAdmin(ModelView, model=User):
    category = USERS_CATEGORY
    category_icon = USERS_ICON
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-user"

    column_list = [
        User.email,
        User.first_name,
        User.last_name,
        User.is_active,
        User.is_verified,
        User.is_admin,
        User.created_at,
    ]
    column_searchable_list = [User.email, User.first_name, User.last_name]
    column_sortable_list = [User.created_at, User.email]
    column_filters = [User.is_active, User.is_verified, User.is_admin]
    form_excluded_columns = [User.password_hash]
    can_delete = False
    column_labels = {
        "is_active": "Active",
        "is_verified": "Verified",
        "is_admin": "Admin",
        "first_name": "First Name",
        "last_name": "Last Name",
        "created_at": "Created",
    }
    page_size = 25
    page_size_options = [10, 25, 50, 100]


# =============================================================================
# ANALYTICS (read-only / lightweight edit)
# =============================================================================

ANALYTICS_CATEGORY = "Analytics"
ANALYTICS_ICON = "fa-solid fa-chart-line"


class LeadScoreAdmin(ModelView, model=UserLeadScore):
    category = ANALYTICS_CATEGORY
    category_icon = ANALYTICS_ICON
    name = "Lead Score"
    name_plural = "Lead Scores"
    icon = "fa-solid fa-fire-flame-curved"
    column_list = [
        "user",
        UserLeadScore.composite_score,
        UserLeadScore.lead_temperature,
        UserLeadScore.intent_band,
        UserLeadScore.profile_completion_pct,
        UserLeadScore.engagement_score,
        UserLeadScore.timeline_urgency_score,
        UserLeadScore.help_seeking_score,
        UserLeadScore.last_calculated_at
    ]
    
    column_searchable_list = []  # Can't search by user directly in SQLAdmin easily
    column_sortable_list = [
        UserLeadScore.composite_score,
        UserLeadScore.profile_completion_pct,
        UserLeadScore.last_calculated_at
    ]
    column_default_sort = [(UserLeadScore.composite_score, True)]  # Descending
    
    column_formatters = {
        UserLeadScore.composite_score: lambda m, a: f"{float(m.composite_score):.2f}",
        UserLeadScore.profile_completion_pct: lambda m, a: f"{float(m.profile_completion_pct):.1f}%",
        UserLeadScore.engagement_score: lambda m, a: f"{float(m.engagement_score):.1f}",
        UserLeadScore.timeline_urgency_score: lambda m, a: f"{float(m.timeline_urgency_score):.1f}",
        UserLeadScore.help_seeking_score: lambda m, a: f"{float(m.help_seeking_score):.1f}",
        UserLeadScore.lead_temperature: lambda m, a: {
            "hot_lead": "🔥 Hot",
            "warm_lead": "🌡️ Warm",
            "cold_lead": "❄️ Cold",
            "dormant": "💤 Dormant"
        }.get(m.lead_temperature, m.lead_temperature),
        UserLeadScore.intent_band: lambda m, a: {
            "very_high_intent": "🚀 Very High",
            "high_intent": "⬆️ High",
            "medium_intent": "➡️ Medium",
            "low_intent": "⬇️ Low"
        }.get(m.intent_band, m.intent_band)
    }
    
    column_labels = {
        "user": "User",
        "composite_score": "Score",
        "lead_temperature": "Temperature",
        "intent_band": "Intent",
        "profile_completion_pct": "Profile %",
        "engagement_score": "Engagement",
        "timeline_urgency_score": "Urgency",
        "help_seeking_score": "Help-Seeking",
        "learning_velocity_score": "Velocity",
        "rewards_score": "Rewards",
        "available_signals_count": "Available Signals",
        "total_signals_count": "Total Signals",
        "last_calculated_at": "Last Calculated",
        "last_activity_at": "Last Activity"
    }
    
    can_create = False
    can_delete = False
    can_edit = False
    page_size = 25


class BehaviorEventAdmin(ModelView, model=UserBehaviorEvent):
    column_list = [
        UserBehaviorEvent.id,
        "user",
        UserBehaviorEvent.event_type,
        UserBehaviorEvent.event_category,
        UserBehaviorEvent.event_weight,
        UserBehaviorEvent.created_at
    ]
    
    column_sortable_list = [UserBehaviorEvent.created_at, UserBehaviorEvent.event_weight]
    column_default_sort = [(UserBehaviorEvent.created_at, True)]  # Descending
    
    # Use searchable list instead of filters for string columns to avoid SQLAdmin issues
    column_searchable_list = [UserBehaviorEvent.event_type]
    
    column_formatters = {
        UserBehaviorEvent.event_weight: lambda m, a: f"{m.event_weight:.1f}" if m.event_weight else "N/A",
        UserBehaviorEvent.event_category: lambda m, a: {
            "learning": "📚 Learning",
            "engagement": "⚡ Engagement",
            "help_seeking": "🆘 Help-Seeking",
            "goal_indication": "🎯 Goal",
            "rewards": "🎁 Rewards"
        }.get(m.event_category, m.event_category)
    }
    
    column_labels = {
        "user": "User",
        "event_type": "Event Type",
        "event_category": "Category",
        "event_data": "Metadata",
        "event_weight": "Weight",
        "created_at": "Timestamp"
    }
    
    can_create = False
    can_delete = True
    can_edit = False
    page_size = 25


class LeadScoreHistoryAdmin(ModelView, model=LeadScoreHistory):
    category = ANALYTICS_CATEGORY
    category_icon = ANALYTICS_ICON
    name = "Lead Score History"
    name_plural = "Lead Score History"
    icon = "fa-solid fa-clock-rotate-left"
    column_list = [
        LeadScoreHistory.id,
        "user",
        LeadScoreHistory.snapshot_date,
        LeadScoreHistory.composite_score,
        LeadScoreHistory.lead_temperature,
        LeadScoreHistory.intent_band,
        LeadScoreHistory.created_at
    ]
    
    column_sortable_list = [
        LeadScoreHistory.snapshot_date,
        LeadScoreHistory.composite_score,
        LeadScoreHistory.created_at
    ]
    column_default_sort = [(LeadScoreHistory.snapshot_date, True)]  # Descending
    
    column_formatters = {
        LeadScoreHistory.composite_score: lambda m, a: f"{float(m.composite_score):.2f}",
        LeadScoreHistory.lead_temperature: lambda m, a: {
            "hot_lead": "🔥 Hot",
            "warm_lead": "🌡️ Warm",
            "cold_lead": "❄️ Cold",
            "dormant": "💤 Dormant"
        }.get(m.lead_temperature, m.lead_temperature) if m.lead_temperature else "N/A",
        LeadScoreHistory.intent_band: lambda m, a: {
            "very_high_intent": "🚀 Very High",
            "high_intent": "⬆️ High",
            "medium_intent": "➡️ Medium",
            "low_intent": "⬇️ Low"
        }.get(m.intent_band, m.intent_band) if m.intent_band else "N/A"
    }
    
    column_labels = {
        "user": "User",
        "snapshot_date": "Date",
        "composite_score": "Score",
        "lead_temperature": "Temperature",
        "intent_band": "Intent",
        "metrics_json": "Metrics",
        "created_at": "Created"
    }
    
    can_create = False
    can_delete = True
    can_edit = False
    page_size = 25


def setup_admin(app):
    """Setup admin interface with custom templates for a polished, easy-to-use UI."""
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise ValueError(
            "SECRET_KEY environment variable must be set for admin authentication. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    
    authentication_backend = AdminAuth(secret_key=secret_key)
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    
    admin = Admin(
        app,
        engine,
        title="Nest Navigate Admin",
        authentication_backend=authentication_backend,
        base_url="/admin",
        templates_dir=templates_dir,
    )

    # Content (Modules → Lessons → Quiz Questions → Quiz Answers)
    admin.add_view(ModuleAdmin)
    admin.add_view(LessonAdmin)
    admin.add_view(QuizQuestionAdmin)
    admin.add_view(QuizAnswerAdmin)
    # Rewards & Users
    admin.add_view(RewardCouponAdmin)
    admin.add_view(BadgeAdmin)
    admin.add_view(UserAdmin)
    # Analytics (read-only)
    admin.add_view(LeadScoreAdmin)
    admin.add_view(BehaviorEventAdmin)
    admin.add_view(LeadScoreHistoryAdmin)
    
    return admin