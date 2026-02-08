#!/usr/bin/env python3
"""
Test Database Storage
Validates scores are correctly saved to database
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from analytics.scoring_engine import ScoringEngine, BatchScoringEngine
from models import User, UserLeadScore
from sqlalchemy import func

def test_storage():
    """Test database storage"""
    print("=" * 80)
    print("TEST 4: DATABASE STORAGE VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Get a test user
        user = db.query(User).first()
        
        if not user:
            print("❌ FAILED: No users found in database")
            return False
        
        print(f"\n✅ Test user found: {user.email}")
        
        # Calculate scores
        print("\n🧪 Test 4A: Calculate and Save Scores")
        engine = ScoringEngine(db, user.id)
        scores = engine.calculate_with_classification()
        
        print(f"   Calculated composite score: {scores['composite_score']:.2f}")
        
        # Save to database
        batch_engine = BatchScoringEngine(db)
        batch_engine._save_scores_to_db(user.id, scores)
        
        print("   ✅ Scores saved to database")
        
        # Retrieve from database
        print("\n🧪 Test 4B: Verify Saved Data")
        db_score = db.query(UserLeadScore).filter(
            UserLeadScore.user_id == user.id
        ).first()
        
        if not db_score:
            print("   ❌ No score found in database after save!")
            return False
        
        print(f"   ✅ Score record found in database")
        
        # Verify values match
        print(f"\n📊 DATABASE VALUES:")
        print(f"   Composite: {db_score.composite_score}")
        print(f"   Engagement: {db_score.engagement_score}")
        print(f"   Timeline Urgency: {db_score.timeline_urgency_score}")
        print(f"   Help Seeking: {db_score.help_seeking_score}")
        print(f"   Learning Velocity: {db_score.learning_velocity_score}")
        print(f"   Rewards: {db_score.rewards_score}")
        print(f"   Temperature: {db_score.lead_temperature}")
        print(f"   Intent: {db_score.intent_band}")
        print(f"   Profile Completion: {db_score.profile_completion_pct}%")
        print(f"   Last Calculated: {db_score.last_calculated_at}")
        
        # Verify accuracy
        print(f"\n🔍 ACCURACY CHECK:")
        tolerance = 0.01
        
        composite_diff = abs(float(db_score.composite_score) - scores['composite_score'])
        composite_match = composite_diff < tolerance
        print(f"   {'✅' if composite_match else '❌'} Composite Score (diff: {composite_diff:.4f})")
        
        engagement_diff = abs(float(db_score.engagement_score) - scores['engagement_score'])
        engagement_match = engagement_diff < tolerance
        print(f"   {'✅' if engagement_match else '❌'} Engagement Score (diff: {engagement_diff:.4f})")
        
        temp_match = db_score.lead_temperature == scores['classification']['temperature']
        print(f"   {'✅' if temp_match else '❌'} Temperature Classification")
        
        intent_match = db_score.intent_band == scores['classification']['intent_band']
        print(f"   {'✅' if intent_match else '❌'} Intent Classification")
        
        # Test batch storage
        print("\n🧪 Test 4C: Batch Storage")
        users = db.query(User).limit(3).all()
        
        if len(users) > 1:
            print(f"   Testing with {len(users)} users")
            
            batch_engine = BatchScoringEngine(db)
            user_ids = [u.id for u in users]
            results = batch_engine.calculate_scores_for_users(user_ids, update_database=True)
            
            successful = sum(1 for r in results.values() if "error" not in r)
            print(f"   ✅ Successfully processed: {successful}/{len(users)}")
        else:
            print(f"   ⚠️  Only 1 user available, skipping batch test")
        
        # Check database statistics
        print("\n📊 DATABASE STATISTICS:")
        total_scores = db.query(func.count(UserLeadScore.user_id)).scalar()
        print(f"   Total scores in database: {total_scores}")
        
        avg_composite = db.query(func.avg(UserLeadScore.composite_score)).scalar()
        if avg_composite:
            print(f"   Average composite score: {float(avg_composite):.2f}")
        
        # Summary
        all_match = composite_match and engagement_match and temp_match and intent_match
        
        if all_match:
            print("\n✅ DATABASE STORAGE TEST PASSED")
            return True
        else:
            print("\n❌ DATABASE STORAGE TEST FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_storage()
    sys.exit(0 if success else 1)

