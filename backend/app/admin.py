from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from models import (
    Module, Lesson, QuizQuestion, QuizAnswer, RewardCoupon, Badge, User,
    UserLeadScore, UserBehaviorEvent, LeadScoreHistory
)
from database import engine
from auth import AuthManager
import os


# Authentication Backend for Admin
class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")
        
        admin_emails = os.getenv("ADMIN_EMAILS", "").split(",")
        
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


# Admin Views for each model
class ModuleAdmin(ModelView, model=Module):
    column_list = [Module.id, Module.title, Module.order_index, Module.difficulty_level, Module.is_active]
    column_searchable_list = [Module.title]
    column_sortable_list = [Module.order_index, Module.created_at]
    column_default_sort = [(Module.order_index, False)]
    form_columns = [
        Module.title, Module.description, Module.thumbnail_url, Module.order_index,
        Module.is_active, Module.prerequisite_module_id, Module.estimated_duration_minutes,
        Module.difficulty_level
    ]
    column_labels = {
        "order_index": "Order",
        "is_active": "Active",
        "prerequisite_module_id": "Prerequisite Module",
        "estimated_duration_minutes": "Duration (mins)",
        "difficulty_level": "Difficulty"
    }
    name = "Module"
    name_plural = "Modules"
    icon = "fa-solid fa-book"


class LessonAdmin(ModelView, model=Lesson):
    column_list = [Lesson.id, Lesson.title, "module", Lesson.order_index, Lesson.nest_coins_reward, Lesson.is_active]
    column_searchable_list = [Lesson.title]
    column_sortable_list = [Lesson.order_index, Lesson.created_at]
    column_default_sort = [(Lesson.order_index, False)]
    
    # Use relationship name for better dropdown
    form_columns = [
        "module",  # This shows a dropdown with module names
        Lesson.title, 
        Lesson.description, 
        Lesson.image_url,
        Lesson.video_url, 
        Lesson.video_transcription, 
        Lesson.order_index,
        Lesson.is_active, 
        Lesson.estimated_duration_minutes, 
        Lesson.nest_coins_reward
    ]
    
    column_labels = {
        "module": "Module",
        "order_index": "Order",
        "nest_coins_reward": "Coins Reward",
        "is_active": "Active",
        "estimated_duration_minutes": "Duration (mins)",
        "video_url": "Video URL",
        "image_url": "Image URL",
        "video_transcription": "Transcript"
    }
    
    name = "Lesson"
    name_plural = "Lessons"
    icon = "fa-solid fa-graduation-cap"


class QuizQuestionAdmin(ModelView, model=QuizQuestion):
    column_list = [QuizQuestion.id, QuizQuestion.question_text, "lesson", QuizQuestion.question_type, QuizQuestion.order_index]
    column_searchable_list = [QuizQuestion.question_text]
    column_sortable_list = [QuizQuestion.order_index, QuizQuestion.created_at]
    column_default_sort = [(QuizQuestion.order_index, False)]
    
    form_columns = [
        "lesson",  # Dropdown with lesson names
        QuizQuestion.question_text, 
        QuizQuestion.question_type,
        QuizQuestion.explanation, 
        QuizQuestion.order_index, 
        QuizQuestion.is_active
    ]
    
    column_labels = {
        "lesson": "Lesson",
        "question_text": "Question",
        "question_type": "Type",
        "order_index": "Order",
        "is_active": "Active"
    }
    
    name = "Quiz Question"
    name_plural = "Quiz Questions"
    icon = "fa-solid fa-question-circle"


class QuizAnswerAdmin(ModelView, model=QuizAnswer):
    column_list = [QuizAnswer.id, QuizAnswer.answer_text, "question", QuizAnswer.is_correct, QuizAnswer.order_index]
    column_searchable_list = [QuizAnswer.answer_text]
    column_sortable_list = [QuizAnswer.order_index]
    column_default_sort = [(QuizAnswer.order_index, False)]
    
    form_columns = [
        "question",  # Dropdown with questions
        QuizAnswer.answer_text, 
        QuizAnswer.is_correct,
        QuizAnswer.order_index
    ]
    
    column_labels = {
        "question": "Question",
        "answer_text": "Answer",
        "is_correct": "Correct?",
        "order_index": "Order"
    }
    
    name = "Quiz Answer"
    name_plural = "Quiz Answers"
    icon = "fa-solid fa-check-circle"


class RewardCouponAdmin(ModelView, model=RewardCoupon):
    column_list = [RewardCoupon.id, RewardCoupon.title, RewardCoupon.partner_company, RewardCoupon.cost_in_coins, RewardCoupon.is_active]
    column_searchable_list = [RewardCoupon.title, RewardCoupon.partner_company]
    column_sortable_list = [RewardCoupon.cost_in_coins, RewardCoupon.created_at]
    
    form_columns = [
        RewardCoupon.title, RewardCoupon.description, RewardCoupon.coupon_code,
        RewardCoupon.discount_type, RewardCoupon.discount_value, RewardCoupon.partner_company,
        RewardCoupon.cost_in_coins, RewardCoupon.max_redemptions, RewardCoupon.current_redemptions,
        RewardCoupon.expires_at, RewardCoupon.image_url, RewardCoupon.terms_conditions,
        RewardCoupon.is_active
    ]
    
    column_labels = {
        "cost_in_coins": "Cost (Coins)",
        "partner_company": "Partner",
        "is_active": "Active",
        "max_redemptions": "Max Redemptions",
        "current_redemptions": "Current Redemptions",
        "expires_at": "Expires",
        "image_url": "Image URL",
        "terms_conditions": "Terms & Conditions"
    }
    
    name = "Reward Coupon"
    name_plural = "Reward Coupons"
    icon = "fa-solid fa-gift"


class BadgeAdmin(ModelView, model=Badge):
    column_list = [Badge.id, Badge.name, Badge.badge_type, Badge.rarity, Badge.is_active]
    column_searchable_list = [Badge.name]
    column_sortable_list = [Badge.created_at]
    
    form_columns = [
        Badge.name, Badge.description, Badge.icon_url, Badge.badge_type,
        Badge.rarity, Badge.is_active
    ]
    
    column_labels = {
        "icon_url": "Icon URL",
        "badge_type": "Type",
        "is_active": "Active"
    }
    
    name = "Badge"
    name_plural = "Badges"
    icon = "fa-solid fa-medal"


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.email, User.first_name, User.last_name, User.is_active, User.is_verified]
    column_searchable_list = [User.email, User.first_name, User.last_name]
    column_sortable_list = [User.created_at]
    form_excluded_columns = [User.password_hash]
    can_delete = False
    
    column_labels = {
        "is_active": "Active",
        "is_verified": "Verified",
        "first_name": "First Name",
        "last_name": "Last Name",
        "created_at": "Created"
    }
    
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"


# ================================
# ANALYTICS ADMIN VIEWS
# ================================


class LeadScoreAdmin(ModelView, model=UserLeadScore):
    """Admin view for lead scores"""
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
    
    can_create = False  # Scores are auto-calculated, not manually created
    can_delete = False  # Don't allow deletion
    can_edit = False  # Read-only view
    
    name = "Lead Score"
    name_plural = "Lead Scores"
    icon = "fa-solid fa-chart-line"


class BehaviorEventAdmin(ModelView, model=UserBehaviorEvent):
    """Admin view for behavior events"""
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
    
    can_create = False  # Events are auto-logged
    can_delete = True   # Allow deletion for cleanup
    can_edit = False    # Read-only
    
    name = "Behavior Event"
    name_plural = "Behavior Events"
    icon = "fa-solid fa-stream"


class LeadScoreHistoryAdmin(ModelView, model=LeadScoreHistory):
    """Admin view for lead score history"""
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
    
    can_create = False  # Snapshots are auto-created
    can_delete = True   # Allow deletion for cleanup
    can_edit = False    # Read-only
    
    name = "Lead Score History"
    name_plural = "Lead Score History"
    icon = "fa-solid fa-history"


def setup_admin(app):
    """Setup admin interface"""
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise ValueError(
            "SECRET_KEY environment variable must be set for admin authentication. "
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
        )
    
    authentication_backend = AdminAuth(secret_key=secret_key)
    
    admin = Admin(
        app,
        engine,
        title="Nest Navigate CMS",
        authentication_backend=authentication_backend,
        base_url="/admin"
    )
    
    # Register content management views
    admin.add_view(ModuleAdmin)
    admin.add_view(LessonAdmin)
    admin.add_view(QuizQuestionAdmin)
    admin.add_view(QuizAnswerAdmin)
    admin.add_view(RewardCouponAdmin)
    admin.add_view(BadgeAdmin)
    admin.add_view(UserAdmin)
    
    # Register analytics views
    admin.add_view(LeadScoreAdmin)
    admin.add_view(BehaviorEventAdmin)
    admin.add_view(LeadScoreHistoryAdmin)
    
    return admin