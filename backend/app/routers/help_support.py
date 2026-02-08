from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func

from database import get_db
from auth import get_current_user, get_optional_user
from models import User, FAQ, SupportTicket
from schemas import (
    FAQResponse, SupportTicketCreate, SupportTicketResponse, SuccessResponse
)
from analytics.event_tracker import EventTracker

router = APIRouter()


@router.get("/faqs", response_model=List[FAQResponse])
def get_faqs(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """Get frequently asked questions"""
    query = db.query(FAQ).filter(FAQ.is_active == True)
    
    if category:
        query = query.filter(FAQ.category == category)
    
    if search:
        query = query.filter(
            FAQ.question.ilike(f"%{search}%") | FAQ.answer.ilike(f"%{search}%")
        )
    
    faqs = query.order_by(FAQ.order_index, FAQ.question).limit(limit).all()
    
    return [
        FAQResponse(
            id=faq.id,
            question=faq.question,
            answer=faq.answer,
            category=faq.category,
            order_index=faq.order_index,
            view_count=faq.view_count
        )
        for faq in faqs
    ]


@router.get("/faqs/{faq_id}", response_model=FAQResponse)
def get_faq(
    faq_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific FAQ by ID"""
    faq = db.query(FAQ).filter(
        and_(FAQ.id == faq_id, FAQ.is_active == True)
    ).first()
    
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ not found"
        )
    
    # Increment view count
    faq.view_count += 1
    db.commit()
    
    return FAQResponse(
        id=faq.id,
        question=faq.question,
        answer=faq.answer,
        category=faq.category,
        order_index=faq.order_index,
        view_count=faq.view_count
    )


@router.get("/faq-categories")
def get_faq_categories(db: Session = Depends(get_db)):
    """Get available FAQ categories"""
    categories = db.query(FAQ.category).filter(
        and_(FAQ.is_active == True, FAQ.category.isnot(None))
    ).distinct().all()
    
    return {
        "categories": [cat[0] for cat in categories if cat[0]],
        "predefined_categories": [
            {"id": "general", "name": "General Questions", "description": "Basic platform questions"},
            {"id": "learning", "name": "Learning & Courses", "description": "Questions about modules and lessons"},
            {"id": "rewards", "name": "Rewards & Coins", "description": "Questions about the reward system"},
            {"id": "account", "name": "Account & Profile", "description": "Account management questions"},
            {"id": "technical", "name": "Technical Support", "description": "Technical issues and troubleshooting"},
            {"id": "homebuying", "name": "Home Buying Process", "description": "Questions about buying a home"}
        ]
    }


@router.post("/contact", response_model=SupportTicketResponse, status_code=status.HTTP_201_CREATED)
def submit_support_ticket(
    ticket_data: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Submit a support ticket"""
    # Create support ticket
    ticket = SupportTicket(
        user_id=current_user.id if current_user else None,
        name=ticket_data.name,
        email=ticket_data.email,
        subject=ticket_data.subject,
        message=ticket_data.message,
        category=ticket_data.category
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    
    # Track support ticket creation event (only if user is logged in)
    if current_user:
        EventTracker.track_support_ticket_created(
            db, current_user.id, ticket.id, ticket.subject, ticket.category or "general"
        )
    
    return SupportTicketResponse(
        id=ticket.id,
        name=ticket.name,
        email=ticket.email,
        subject=ticket.subject,
        message=ticket.message,
        priority=ticket.priority,
        status=ticket.status,
        category=ticket.category,
        admin_response=ticket.admin_response,
        responded_at=ticket.responded_at,
        resolved_at=ticket.resolved_at,
        created_at=ticket.created_at
    )


@router.get("/my-tickets", response_model=List[SupportTicketResponse])
def get_user_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Get user's support tickets"""
    query = db.query(SupportTicket).filter(SupportTicket.user_id == current_user.id)
    
    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)
    
    tickets = query.order_by(desc(SupportTicket.created_at)).offset(offset).limit(limit).all()
    
    return [
        SupportTicketResponse(
            id=ticket.id,
            name=ticket.name,
            email=ticket.email,
            subject=ticket.subject,
            message=ticket.message,
            priority=ticket.priority,
            status=ticket.status,
            category=ticket.category,
            admin_response=ticket.admin_response,
            responded_at=ticket.responded_at,
            resolved_at=ticket.resolved_at,
            created_at=ticket.created_at
        )
        for ticket in tickets
    ]


@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
def get_ticket(
    ticket_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific support ticket"""
    ticket = db.query(SupportTicket).filter(
        and_(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == current_user.id
        )
    ).first()
    
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found"
        )
    
    return SupportTicketResponse(
        id=ticket.id,
        name=ticket.name,
        email=ticket.email,
        subject=ticket.subject,
        message=ticket.message,
        priority=ticket.priority,
        status=ticket.status,
        category=ticket.category,
        admin_response=ticket.admin_response,
        responded_at=ticket.responded_at,
        resolved_at=ticket.resolved_at,
        created_at=ticket.created_at
    )


@router.get("/resources")
def get_help_resources():
    """Get available help resources and guides"""
    return {
        "getting_started": [
            {
                "title": "Welcome to the Learning Platform",
                "description": "Get started with your gamified learning journey",
                "url": "/help/getting-started",
                "category": "onboarding"
            },
            {
                "title": "Complete Your Onboarding",
                "description": "Learn how to set up your profile and preferences",
                "url": "/help/onboarding-guide",
                "category": "onboarding"
            },
            {
                "title": "Understanding the Coin System",
                "description": "How to earn and spend coins in the platform",
                "url": "/help/coin-system",
                "category": "rewards"
            }
        ],
        "learning_guides": [
            {
                "title": "How to Take Courses",
                "description": "Step-by-step guide to accessing and completing courses",
                "url": "/help/taking-courses",
                "category": "learning"
            },
            {
                "title": "Quiz and Assessment Guide",
                "description": "Tips for taking quizzes and improving your scores",
                "url": "/help/quiz-guide",
                "category": "learning"
            },
            {
                "title": "Tracking Your Progress",
                "description": "Monitor your learning progress and achievements",
                "url": "/help/progress-tracking",
                "category": "learning"
            }
        ],
        "rewards_guides": [
            {
                "title": "Earning Badges",
                "description": "How to unlock achievements and earn badges",
                "url": "/help/earning-badges",
                "category": "rewards"
            },
            {
                "title": "Redeeming Rewards",
                "description": "How to use your coins to get rewards and coupons",
                "url": "/help/redeeming-rewards",
                "category": "rewards"
            },
            {
                "title": "Partner Offers",
                "description": "Learn about our partner companies and exclusive deals",
                "url": "/help/partner-offers",
                "category": "rewards"
            }
        ],
        "tools_guides": [
            {
                "title": "Using Calculators",
                "description": "How to use our financial calculators effectively",
                "url": "/help/calculators",
                "category": "tools"
            },
            {
                "title": "Downloading Resources",
                "description": "Access and download checklists and guides",
                "url": "/help/resources",
                "category": "tools"
            }
        ]
    }


@router.get("/quick-help")
def get_quick_help():
    """Get quick help topics and solutions"""
    return {
        "common_issues": [
            {
                "issue": "Can't access a lesson",
                "solution": "Make sure you've completed all prerequisite modules and lessons in order.",
                "category": "learning"
            },
            {
                "issue": "Quiz not submitting",
                "solution": "Ensure all questions are answered and you have a stable internet connection.",
                "category": "technical"
            },
            {
                "issue": "Coins not appearing",
                "solution": "Coins are awarded after successfully passing quizzes. Check your transaction history.",
                "category": "rewards"
            },
            {
                "issue": "Forgot password",
                "solution": "Use the 'Forgot Password' link on the login page to reset your password.",
                "category": "account"
            },
            {
                "issue": "Can't redeem coupon",
                "solution": "Check if you have sufficient coins and the coupon hasn't expired.",
                "category": "rewards"
            }
        ],
        "tips": [
            {
                "title": "Maximize Your Learning",
                "tip": "Watch videos completely before taking quizzes to maximize your coin earnings.",
                "category": "learning"
            },
            {
                "title": "Save Coins Strategically",
                "tip": "Check reward expiration dates and plan your coin spending accordingly.",
                "category": "rewards"
            },
            {
                "title": "Use Calculators",
                "tip": "Practice with our calculators to better understand financial concepts.",
                "category": "tools"
            }
        ]
    }


@router.get("/contact-info")
def get_contact_information():
    """Get contact information and support hours"""
    return {
        "support_email": "support@learningplatform.com",
        "help_center": "https://help.learningplatform.com",
        "support_hours": {
            "monday_friday": "9:00 AM - 6:00 PM EST",
            "saturday": "10:00 AM - 4:00 PM EST",
            "sunday": "Closed",
            "holidays": "Limited hours during major holidays"
        },
        "response_times": {
            "general_inquiries": "24-48 hours",
            "technical_issues": "4-8 hours",
            "account_issues": "2-4 hours",
            "urgent_matters": "1-2 hours"
        },
        "emergency_contact": {
            "available": False,
            "note": "For urgent technical issues, please submit a high-priority support ticket."
        }
    }


@router.get("/system-status")
def get_system_status():
    """Get current system status and any known issues"""
    # This would typically connect to a monitoring system
    # For now, return a static status
    return {
        "overall_status": "operational",
        "last_updated": datetime.now().isoformat(),
        "services": {
            "api": {"status": "operational", "uptime": "99.9%"},
            "database": {"status": "operational", "uptime": "99.8%"},
            "video_streaming": {"status": "operational", "uptime": "99.7%"},
            "payment_processing": {"status": "operational", "uptime": "99.9%"}
        },
        "incidents": [],
        "maintenance": {
            "scheduled": False,
            "next_window": "Sunday 2:00 AM - 4:00 AM EST"
        }
    }


@router.get("/feedback-form")
def get_feedback_form_fields():
    """Get feedback form structure"""
    return {
        "form_fields": [
            {
                "name": "category",
                "type": "select",
                "label": "Feedback Category",
                "required": True,
                "options": [
                    {"value": "feature_request", "label": "Feature Request"},
                    {"value": "bug_report", "label": "Bug Report"},
                    {"value": "content_feedback", "label": "Content Feedback"},
                    {"value": "user_experience", "label": "User Experience"},
                    {"value": "general", "label": "General Feedback"}
                ]
            },
            {
                "name": "subject",
                "type": "text",
                "label": "Subject",
                "required": True,
                "max_length": 255
            },
            {
                "name": "description",
                "type": "textarea",
                "label": "Description",
                "required": True,
                "max_length": 2000,
                "placeholder": "Please provide detailed feedback..."
            },
            {
                "name": "rating",
                "type": "number",
                "label": "Overall Rating (1-5)",
                "required": False,
                "min": 1,
                "max": 5
            }
        ]
    }
