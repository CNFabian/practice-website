#!/usr/bin/env python3
"""
Test Event Tracking
Validates that events are correctly logged to user_behavior_events table
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from analytics.event_tracker import EventTracker
from models import User, UserBehaviorEvent
from uuid import UUID, uuid4

def test_event_tracking():
    """Test that events are tracked correctly"""
    print("=" * 80)
    print("TEST 1: EVENT TRACKING VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Get a test user
        user = db.query(User).first()
        
        if not user:
            print("❌ FAILED: No users found in database")
            print("   Create a user first to test event tracking")
            return False
        
        print(f"\n✅ Test user found: {user.email}")
        
        # Count existing events
        initial_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.user_id == user.id
        ).count()
        
        print(f"   Existing events for user: {initial_count}")
        
        # Test 1: Track lesson completed event
        print("\n🧪 Test 1A: Track lesson_completed event")
        lesson_event, created = EventTracker.track_lesson_completed(
            db=db,
            user_id=user.id,
            lesson_id=uuid4(),
            lesson_title="Test Lesson for Validation"
        )
        
        if lesson_event:
            print(f"   ✅ Event created: {lesson_event.id}")
            print(f"      Event Type: {lesson_event.event_type}")
            print(f"      Category: {lesson_event.event_category}")
            print(f"      Weight: {lesson_event.event_weight}")
            
            # Verify event weight
            if lesson_event.event_weight == 2.0:
                print(f"      ✅ Weight is correct (2.0)")
            else:
                print(f"      ❌ Weight incorrect: {lesson_event.event_weight} (expected 2.0)")
        else:
            print("   ❌ Failed to create event")
            return False
        
        # Test 2: Track milestone event
        print("\n🧪 Test 1B: Track lesson_milestone event")
        milestone_event, created = EventTracker.track_lesson_milestone(
            db=db,
            user_id=user.id,
            lesson_id=uuid4(),
            lesson_title="Test Lesson",
            milestone=50,
            content_type="video"
        )
        
        if milestone_event:
            print(f"   ✅ Milestone event created: {milestone_event.event_type}")
            print(f"      Weight: {milestone_event.event_weight}")
            
            if milestone_event.event_type == "lesson_milestone_50":
                print(f"      ✅ Event type correct")
            else:
                print(f"      ❌ Event type incorrect: {milestone_event.event_type}")
        
        # Test 3: Track mini-game event
        print("\n🧪 Test 1C: Track minigame events")
        minigame_attempt, created = EventTracker.track_minigame_attempted(
            db=db,
            user_id=user.id,
            module_id=uuid4(),
            attempt_number=1
        )
        
        if minigame_attempt:
            print(f"   ✅ Mini-game attempt event created")
            print(f"      Weight: {minigame_attempt.event_weight}")
        
        # Count events after
        final_count = db.query(UserBehaviorEvent).filter(
            UserBehaviorEvent.user_id == user.id
        ).count()
        
        events_created = final_count - initial_count
        
        print(f"\n📊 SUMMARY:")
        print(f"   Events before: {initial_count}")
        print(f"   Events after: {final_count}")
        print(f"   New events created: {events_created}")
        
        if events_created >= 3:
            print("\n✅ EVENT TRACKING TEST PASSED")
            return True
        else:
            print(f"\n❌ EVENT TRACKING TEST FAILED (expected 3+ events, got {events_created})")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_event_tracking()
    sys.exit(0 if success else 1)

