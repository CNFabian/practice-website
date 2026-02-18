#!/usr/bin/env python3
"""
Create Test Data for Analytics Validation
Populates the database with test users and activity data
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from models import (
    User, UserOnboarding, Module, Lesson, QuizQuestion, QuizAnswer,
    UserLessonProgress, UserModuleProgress, UserQuizAttempt,
    UserCoinBalance, UserBehaviorEvent, UserModuleQuizAttempt
)
from analytics.event_tracker import EventTracker
from auth import AuthManager
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
import random

def create_test_data():
    """Create comprehensive test data"""
    print("=" * 80)
    print("CREATING TEST DATA FOR ANALYTICS VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"\n⚠️  Warning: {existing_users} users already exist")
            if os.environ.get("CI"):
                print("CI mode: skipping additional test data (using existing).")
                return True
            response = input("Do you want to create additional test data? (y/n): ")
            if response.lower() != 'y':
                print("Aborted.")
                return False
        
        # Step 1: Create test users with varying engagement levels
        print("\n📝 Step 1: Creating Test Users")
        
        test_users = [
            {
                "email": "highly_engaged@test.com",
                "first_name": "Highly",
                "last_name": "Engaged",
                "engagement_level": "high"
            },
            {
                "email": "moderately_engaged@test.com",
                "first_name": "Moderately",
                "last_name": "Engaged",
                "engagement_level": "medium"
            },
            {
                "email": "low_engaged@test.com",
                "first_name": "Low",
                "last_name": "Engaged",
                "engagement_level": "low"
            },
            {
                "email": "new_user@test.com",
                "first_name": "New",
                "last_name": "User",
                "engagement_level": "none"
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Check if user exists
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                print(f"   ⚠️  User {user_data['email']} already exists, skipping")
                created_users.append(existing)
                continue
            
            user = User(
                email=user_data["email"],
                password_hash=AuthManager.get_password_hash("TestPass123!"),
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone=f"+1555{random.randint(1000000, 9999999)}",
                is_active=True,
                created_at=datetime.now() - timedelta(days=random.randint(1, 30)),
                last_login_at=datetime.now() - timedelta(hours=random.randint(1, 24))
            )
            db.add(user)
            db.flush()
            
            created_users.append(user)
            print(f"   ✅ Created user: {user.email} (ID: {user.id})")
        
        db.commit()
        
        # Step 2: Create onboarding data
        print("\n📝 Step 2: Creating Onboarding Data")
        
        for i, user in enumerate(created_users):
            if test_users[i]["engagement_level"] != "none":
                onboarding = UserOnboarding(
                    user_id=user.id,
                    selected_avatar=random.choice(["avatar1", "avatar2", "avatar3"]),
                    has_realtor=random.choice([True, False]),
                    has_loan_officer=random.choice([True, False]),
                    wants_expert_contact=random.choice([True, False]),
                    homeownership_timeline_months=random.choice([3, 6, 12, 18, 24, 36]),
                    zipcode=f"{random.randint(10000, 99999)}",
                    completed_at=datetime.now() - timedelta(days=random.randint(1, 15))
                )
                db.add(onboarding)
                print(f"   ✅ Created onboarding for {user.email}")
                
                # Track onboarding completed event
                EventTracker.track_onboarding_completed(db, user.id)
        
        db.commit()
        
        # Step 3: Get or create modules and lessons
        print("\n📝 Step 3: Setting up Modules and Lessons")
        
        modules = db.query(Module).filter(Module.is_active == True).all()
        
        if not modules:
            print("   ⚠️  No modules found, creating sample module")
            module = Module(
                title="Test Module: Home Buying Basics",
                description="Learn the fundamentals of home buying",
                difficulty_level="beginner",
                order_index=1,
                is_active=True
            )
            db.add(module)
            db.flush()
            
            # Create sample lessons
            for i in range(3):
                lesson = Lesson(
                    module_id=module.id,
                    title=f"Test Lesson {i+1}",
                    description=f"Sample lesson content {i+1}",
                    lesson_summary=f"This is a summary of lesson {i+1}",
                    order_index=i,
                    is_active=True,
                    estimated_duration_minutes=10,
                    nest_coins_reward=10
                )
                db.add(lesson)
            
            db.commit()
            modules = [module]
            print(f"   ✅ Created sample module with 3 lessons")
        else:
            print(f"   ✅ Found {len(modules)} existing modules")
        
        # Step 4: Create lesson progress for engaged users
        print("\n📝 Step 4: Creating Lesson Progress")
        
        for i, user in enumerate(created_users):
            engagement = test_users[i]["engagement_level"]
            
            if engagement == "none":
                continue
            
            # Get lessons
            lessons = db.query(Lesson).filter(Lesson.is_active == True).limit(5).all()
            
            if not lessons:
                print(f"   ⚠️  No lessons found for user {user.email}")
                continue
            
            # Determine how many lessons to complete based on engagement
            lessons_to_complete = {
                "high": len(lessons),
                "medium": max(1, len(lessons) // 2),
                "low": 1
            }.get(engagement, 0)
            
            for j, lesson in enumerate(lessons[:lessons_to_complete]):
                progress = UserLessonProgress(
                    user_id=user.id,
                    lesson_id=lesson.id,
                    status="completed",
                    video_progress_seconds=600,
                    content_type_consumed="video",
                    time_spent_seconds=random.randint(300, 900),
                    completion_method="auto",
                    milestones_reached="25,50,75,90",
                    first_started_at=datetime.now() - timedelta(days=random.randint(1, 10)),
                    completed_at=datetime.now() - timedelta(days=random.randint(0, 5)),
                    last_accessed_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                )
                db.add(progress)
                
                # Track events
                EventTracker.track_lesson_started(db, user.id, lesson.id, lesson.title)
                EventTracker.track_lesson_milestone(db, user.id, lesson.id, lesson.title, 50, "video")
                EventTracker.track_lesson_completed(db, user.id, lesson.id, lesson.title)
            
            print(f"   ✅ Created {lessons_to_complete} lesson completions for {user.email}")
        
        db.commit()
        
        # Step 5: Create module progress
        print("\n📝 Step 5: Creating Module Progress")
        
        for i, user in enumerate(created_users):
            engagement = test_users[i]["engagement_level"]
            
            if engagement == "none":
                continue
            
            for module in modules[:1]:  # Just first module for now
                # Count completed lessons
                completed_lessons = db.query(UserLessonProgress).join(Lesson).filter(
                    UserLessonProgress.user_id == user.id,
                    Lesson.module_id == module.id,
                    UserLessonProgress.status == "completed"
                ).count()
                
                total_lessons = db.query(Lesson).filter(
                    Lesson.module_id == module.id,
                    Lesson.is_active == True
                ).count()
                
                if completed_lessons > 0:
                    # Determine status based on engagement
                    if completed_lessons == total_lessons and engagement == "high":
                        status = "lessons_complete"  # Ready for mini-game
                        minigame_completed = False
                    elif engagement == "high":
                        status = "in_progress"
                        minigame_completed = False
                    else:
                        status = "in_progress"
                        minigame_completed = False
                    
                    completion_pct = (completed_lessons / total_lessons) * 100
                    
                    module_progress = UserModuleProgress(
                        user_id=user.id,
                        module_id=module.id,
                        total_lessons=total_lessons,
                        lessons_completed=completed_lessons,
                        completion_percentage=Decimal(str(completion_pct)),
                        status=status,
                        minigame_completed=minigame_completed,
                        minigame_attempts=0,
                        first_started_at=datetime.now() - timedelta(days=random.randint(5, 15)),
                        last_accessed_at=datetime.now() - timedelta(hours=random.randint(1, 48))
                    )
                    db.add(module_progress)
                    
                    # Track module started event
                    EventTracker.track_module_started(db, user.id, module.id, module.title)
                    
                    print(f"   ✅ Created module progress for {user.email}: {status}")
        
        db.commit()
        
        # Step 6: Create coin balances
        print("\n📝 Step 6: Creating Coin Balances")
        
        for i, user in enumerate(created_users):
            engagement = test_users[i]["engagement_level"]
            
            coins = {
                "high": 150,
                "medium": 50,
                "low": 10,
                "none": 0
            }.get(engagement, 0)
            
            if coins > 0:
                balance = UserCoinBalance(
                    user_id=user.id,
                    current_balance=coins,
                    lifetime_earned=coins,
                    lifetime_spent=0
                )
                db.add(balance)
                print(f"   ✅ Created {coins} coins for {user.email}")
        
        db.commit()
        
        # Step 7: Create additional behavior events
        print("\n📝 Step 7: Creating Additional Events")
        
        for i, user in enumerate(created_users):
            engagement = test_users[i]["engagement_level"]
            
            if engagement == "none":
                continue
            
            # Create varied events
            event_count = {
                "high": 15,
                "medium": 8,
                "low": 3
            }.get(engagement, 0)
            
            for _ in range(event_count):
                EventTracker.track_login(db, user.id, is_daily_first=random.choice([True, False]))
            
            print(f"   ✅ Created {event_count} additional events for {user.email}")
        
        db.commit()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST DATA CREATION SUMMARY")
        print("=" * 80)
        
        user_count = db.query(User).count()
        event_count = db.query(UserBehaviorEvent).count()
        progress_count = db.query(UserLessonProgress).count()
        
        print(f"\n✅ Successfully created test data:")
        print(f"   Users: {user_count}")
        print(f"   Events: {event_count}")
        print(f"   Lesson Progress: {progress_count}")
        print(f"   Module Progress: {db.query(UserModuleProgress).count()}")
        print(f"   Onboarding Complete: {db.query(UserOnboarding).filter(UserOnboarding.completed_at.isnot(None)).count()}")
        
        print("\n🎯 Test users created:")
        for user_data in test_users:
            print(f"   📧 {user_data['email']} (engagement: {user_data['engagement_level']})")
            print(f"      Password: TestPass123!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_test_data()
    if success:
        print("\n✅ TEST DATA CREATION COMPLETE!")
        print("\nNext steps:")
        print("  1. Run validation tests: ./tests/analytics/run_all_tests.sh")
        print("  2. Check analytics dashboard")
        print("  3. Test score calculations")
    sys.exit(0 if success else 1)

