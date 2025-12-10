from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from database import get_db
from auth import get_current_user
from models import User, Notification
from schemas import NotificationResponse, NotificationUpdate, SuccessResponse
from utils import NotificationManager

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    unread_only: bool = False,
    notification_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Get user notifications"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    
    # Filter out expired notifications
    query = query.filter(
        (Notification.expires_at.is_(None)) | (Notification.expires_at > datetime.now())
    )
    
    notifications = query.order_by(
        desc(Notification.created_at)
    ).offset(offset).limit(limit).all()
    
    return [
        NotificationResponse(
            id=notification.id,
            notification_type=notification.notification_type,
            title=notification.title,
            message=notification.message,
            is_read=notification.is_read,
            priority=notification.priority,
            expires_at=notification.expires_at,
            created_at=notification.created_at
        )
        for notification in notifications
    ]


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
            (Notification.expires_at.is_(None)) | (Notification.expires_at > datetime.now())
        )
    ).count()
    
    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific notification"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if notification is expired
    if notification.expires_at and notification.expires_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Notification has expired"
        )
    
    # Mark as read if it wasn't already
    if not notification.is_read:
        notification.is_read = True
        db.commit()
    
    return NotificationResponse(
        id=notification.id,
        notification_type=notification.notification_type,
        title=notification.title,
        message=notification.message,
        is_read=notification.is_read,
        priority=notification.priority,
        expires_at=notification.expires_at,
        created_at=notification.created_at
    )


@router.put("/{notification_id}", response_model=SuccessResponse)
def update_notification(
    notification_id: UUID,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread)"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = update_data.is_read
    db.commit()
    
    action = "marked as read" if update_data.is_read else "marked as unread"
    return SuccessResponse(message=f"Notification {action} successfully")


@router.post("/mark-all-read", response_model=SuccessResponse)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    count = NotificationManager.mark_all_notifications_read(db, current_user.id)
    
    return SuccessResponse(message=f"Marked {count} notifications as read")


@router.delete("/{notification_id}", response_model=SuccessResponse)
def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return SuccessResponse(message="Notification deleted successfully")


@router.delete("/", response_model=SuccessResponse)
def delete_multiple_notifications(
    notification_ids: List[UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple notifications"""
    if len(notification_ids) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete more than 50 notifications at once"
        )
    
    deleted_count = db.query(Notification).filter(
        and_(
            Notification.id.in_(notification_ids),
            Notification.user_id == current_user.id
        )
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return SuccessResponse(message=f"Deleted {deleted_count} notifications")


@router.get("/types/available")
def get_notification_types():
    """Get available notification types and their descriptions"""
    return {
        "notification_types": [
            {
                "type": "welcome",
                "name": "Welcome",
                "description": "Welcome messages for new users",
                "priority": "high"
            },
            {
                "type": "onboarding_complete",
                "name": "Onboarding Complete",
                "description": "Confirmation when onboarding is finished",
                "priority": "high"
            },
            {
                "type": "coins_earned",
                "name": "Coins Earned",
                "description": "Notifications when coins are earned",
                "priority": "high"
            },
            {
                "type": "coins_spent",
                "name": "Coins Spent",
                "description": "Notifications when coins are spent",
                "priority": "normal"
            },
            {
                "type": "badge_earned",
                "name": "Badge Earned",
                "description": "Notifications when badges are earned",
                "priority": "high"
            },
            {
                "type": "quiz_passed",
                "name": "Quiz Passed",
                "description": "Notifications when quizzes are passed",
                "priority": "high"
            },
            {
                "type": "coupon_redeemed",
                "name": "Coupon Redeemed",
                "description": "Notifications when coupons are redeemed",
                "priority": "high"
            },
            {
                "type": "lesson_completed",
                "name": "Lesson Completed",
                "description": "Notifications when lessons are completed",
                "priority": "normal"
            },
            {
                "type": "module_completed",
                "name": "Module Completed",
                "description": "Notifications when modules are completed",
                "priority": "high"
            },
            {
                "type": "reminder",
                "name": "Reminder",
                "description": "Learning reminders and prompts",
                "priority": "normal"
            },
            {
                "type": "system",
                "name": "System",
                "description": "System updates and announcements",
                "priority": "normal"
            }
        ]
    }


@router.get("/summary/recent")
def get_recent_notifications_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    days: int = 7
):
    """Get summary of recent notifications"""
    from datetime import timedelta
    
    since_date = datetime.now() - timedelta(days=days)
    
    # Get notification counts by type
    notifications = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.created_at >= since_date
        )
    ).all()
    
    # Group by type
    type_counts = {}
    unread_count = 0
    high_priority_count = 0
    
    for notification in notifications:
        notification_type = notification.notification_type
        type_counts[notification_type] = type_counts.get(notification_type, 0) + 1
        
        if not notification.is_read:
            unread_count += 1
        
        if notification.priority == "high":
            high_priority_count += 1
    
    # Get most recent notifications
    recent_notifications = sorted(notifications, key=lambda x: x.created_at, reverse=True)[:5]
    
    return {
        "period_days": days,
        "total_notifications": len(notifications),
        "unread_count": unread_count,
        "high_priority_count": high_priority_count,
        "type_breakdown": type_counts,
        "recent_notifications": [
            {
                "id": notification.id,
                "type": notification.notification_type,
                "title": notification.title,
                "is_read": notification.is_read,
                "priority": notification.priority,
                "created_at": notification.created_at
            }
            for notification in recent_notifications
        ]
    }


@router.post("/test", response_model=SuccessResponse)
def create_test_notification(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a test notification (for development/testing)"""
    test_notification = NotificationManager.create_notification(
        db,
        current_user.id,
        "system",
        "Test Notification",
        "This is a test notification to verify the notification system is working correctly.",
        "normal"
    )
    
    return SuccessResponse(
        message="Test notification created successfully",
        data={"notification_id": str(test_notification.id)}
    )
