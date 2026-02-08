"""
Test Idempotency and Deduplication

Tests that duplicate events are properly prevented and idempotency keys work correctly.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from uuid import uuid4
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Import from app
from database import SessionLocal
from models import User, UserBehaviorEvent, Module, Lesson, UserLessonProgress
from analytics.event_tracker import EventTracker
from auth import AuthManager


def test_idempotency_key_prevents_duplicates():
    """Test that idempotency keys prevent duplicate events"""
    print("\n" + "="*80)
    print("TEST 1: Idempotency Key Prevents Duplicates")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Create test user
        user_id = uuid4()
        user = User(
            id=user_id,
            email=f"idempotency_test_{uuid4()}@test.com",
            password_hash=AuthManager.get_password_hash("password123"),
            first_name="Idempotency",
            last_name="Test"
        )
        db.add(user)
        db.commit()
        
        # Create test module and lesson
        module = Module(
            title="Test Module",
            order_index=1,
            is_active=True
        )
        db.add(module)
        db.flush()
        
        lesson = Lesson(
            module_id=module.id,
            title="Test Lesson",
            order_index=1,
            is_active=True
        )
        db.add(lesson)
        db.commit()
        
        # Generate idempotency key
        idempotency_key = f"{user_id}:lesson:{lesson.id}:milestone:50"
        
        # Track milestone event FIRST time
        event1, created1 = EventTracker.track_lesson_milestone(
            db=db,
            user_id=user_id,
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            milestone=50,
            content_type="video",
            idempotency_key=idempotency_key
        )
        
        print(f"✓ First milestone event: created={created1}, event_id={event1.id}")
        assert created1 is True, "First event should be created"
        
        # Try to track SAME milestone event again (should be deduplicated)
        event2, created2 = EventTracker.track_lesson_milestone(
            db=db,
            user_id=user_id,
            lesson_id=lesson.id,
            lesson_title=lesson.title,
            milestone=50,
            content_type="video",
            idempotency_key=idempotency_key
        )
        
        print(f"✓ Second milestone event: created={created2}, event_id={event2.id}")
        assert created2 is False, "Second event should NOT be created (duplicate)"
        assert event1.id == event2.id, "Should return same event"
        
        # Verify only ONE event exists in database
        event_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.idempotency_key == idempotency_key
        ).count()
        
        print(f"✓ Event count in database: {event_count}")
        assert event_count == 1, "Only one event should exist"
        
        print("\n✅ TEST PASSED: Idempotency key successfully prevents duplicates")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def test_time_based_deduplication():
    """Test that time-based deduplication prevents rapid duplicates"""
    print("\n" + "="*80)
    print("TEST 2: Time-Based Deduplication")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Create test user
        user_id = uuid4()
        user = User(
            id=user_id,
            email=f"timededup_test_{uuid4()}@test.com",
            password_hash=AuthManager.get_password_hash("password123"),
            first_name="TimeDedup",
            last_name="Test"
        )
        db.add(user)
        db.commit()
        
        # Track event without idempotency key (uses time-based dedup)
        event1, created1 = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="user_login",
            event_category="engagement",
            metadata={"timestamp": datetime.now().isoformat()},
            dedup_window_seconds=60  # 60 second dedup window
        )
        
        print(f"✓ First login event: created={created1}")
        assert created1 is True, "First event should be created"
        
        # Try to track same event immediately (within dedup window)
        event2, created2 = EventTracker.track_event(
            db=db,
            user_id=user_id,
            event_type="user_login",
            event_category="engagement",
            metadata={"timestamp": datetime.now().isoformat()},
            dedup_window_seconds=60
        )
        
        print(f"✓ Second login event (within window): created={created2}")
        assert created2 is False, "Second event should NOT be created (within dedup window)"
        assert event1.id == event2.id, "Should return same event"
        
        # Verify only ONE recent event exists
        recent_cutoff = datetime.now() - timedelta(seconds=60)
        event_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.user_id == user_id,
            UserBehaviorEvent.event_type == "user_login",
            UserBehaviorEvent.created_at >= recent_cutoff
        ).count()
        
        print(f"✓ Recent event count: {event_count}")
        assert event_count == 1, "Only one recent event should exist"
        
        print("\n✅ TEST PASSED: Time-based deduplication works correctly")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def test_lesson_completed_constraint():
    """Test that lesson_completed events are unique per user+lesson"""
    print("\n" + "="*80)
    print("TEST 3: Lesson Completed Unique Constraint")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Create test user
        user_id = uuid4()
        user = User(
            id=user_id,
            email=f"lessondup_test_{uuid4()}@test.com",
            password_hash=AuthManager.get_password_hash("password123"),
            first_name="LessonDup",
            last_name="Test"
        )
        db.add(user)
        db.commit()
        
        # Create test module and lesson
        module = Module(
            title="Test Module",
            order_index=1,
            is_active=True
        )
        db.add(module)
        db.flush()
        
        lesson = Lesson(
            module_id=module.id,
            title="Test Lesson",
            order_index=1,
            is_active=True
        )
        db.add(lesson)
        db.commit()
        
        # Track lesson completion FIRST time
        event1, created1 = EventTracker.track_lesson_completed(
            db=db,
            user_id=user_id,
            lesson_id=lesson.id,
            lesson_title=lesson.title
        )
        
        print(f"✓ First completion event: created={created1}")
        assert created1 is True, "First event should be created"
        
        # Try to track SAME lesson completion again
        event2, created2 = EventTracker.track_lesson_completed(
            db=db,
            user_id=user_id,
            lesson_id=lesson.id,
            lesson_title=lesson.title
        )
        
        print(f"✓ Second completion event: created={created2}")
        assert created2 is False, "Second event should NOT be created (duplicate)"
        
        # Verify only ONE completion event exists
        event_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.user_id == user_id,
            UserBehaviorEvent.event_type == "lesson_completed",
            UserBehaviorEvent.event_data['lesson_id'].astext == str(lesson.id)
        ).count()
        
        print(f"✓ Completion event count: {event_count}")
        assert event_count == 1, "Only one completion event should exist"
        
        print("\n✅ TEST PASSED: Lesson completion constraint works correctly")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def test_different_milestones_allowed():
    """Test that different milestones for same lesson are allowed"""
    print("\n" + "="*80)
    print("TEST 4: Different Milestones Are Allowed")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Create test user
        user_id = uuid4()
        user = User(
            id=user_id,
            email=f"multimilestone_test_{uuid4()}@test.com",
            password_hash=AuthManager.get_password_hash("password123"),
            first_name="MultiMilestone",
            last_name="Test"
        )
        db.add(user)
        db.commit()
        
        # Create test module and lesson
        module = Module(
            title="Test Module",
            order_index=1,
            is_active=True
        )
        db.add(module)
        db.flush()
        
        lesson = Lesson(
            module_id=module.id,
            title="Test Lesson",
            order_index=1,
            is_active=True
        )
        db.add(lesson)
        db.commit()
        
        # Track different milestones (should all be created)
        milestones = [25, 50, 75, 90]
        for milestone in milestones:
            event, created = EventTracker.track_lesson_milestone(
                db=db,
                user_id=user_id,
                lesson_id=lesson.id,
                lesson_title=lesson.title,
                milestone=milestone,
                content_type="video"
            )
            
            print(f"✓ Milestone {milestone}%: created={created}")
            assert created is True, f"Milestone {milestone}% should be created"
        
        # Verify all 4 milestone events exist
        milestone_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.user_id == user_id,
            UserBehaviorEvent.event_type.like("lesson_milestone_%"),
            UserBehaviorEvent.event_data['lesson_id'].astext == str(lesson.id)
        ).count()
        
        print(f"✓ Total milestone events: {milestone_count}")
        assert milestone_count == 4, "All 4 milestone events should exist"
        
        print("\n✅ TEST PASSED: Different milestones are correctly allowed")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*80)
    print("IDEMPOTENCY & DEDUPLICATION TEST SUITE")
    print("="*80)
    
    try:
        test_idempotency_key_prevents_duplicates()
        test_time_based_deduplication()
        test_lesson_completed_constraint()
        test_different_milestones_allowed()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED")
        print("="*80)
        
    except Exception as e:
        print("\n" + "="*80)
        print("❌ TESTS FAILED")
        print("="*80)
        sys.exit(1)

