from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from models import Module, Lesson, QuizQuestion, QuizAnswer, RewardCoupon, Badge, User
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


def setup_admin(app):
    """Setup admin interface"""
    authentication_backend = AdminAuth(secret_key=os.getenv("SECRET_KEY", "your-secret-key-change-this"))
    
    admin = Admin(
        app,
        engine,
        title="Nest Navigate CMS",
        authentication_backend=authentication_backend,
        base_url="/admin"
    )
    
    # Register all admin views
    admin.add_view(ModuleAdmin)
    admin.add_view(LessonAdmin)
    admin.add_view(QuizQuestionAdmin)
    admin.add_view(QuizAnswerAdmin)
    admin.add_view(RewardCouponAdmin)
    admin.add_view(BadgeAdmin)
    admin.add_view(UserAdmin)
    
    return admin