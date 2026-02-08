#!/usr/bin/env python3
"""
Test Score Calculation
Validates scoring engine calculations
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from analytics.scoring_engine import ScoringEngine
from analytics.classifier import LeadClassifier
from models import User

def test_scoring():
    """Test score calculation"""
    print("=" * 80)
    print("TEST 3: SCORE CALCULATION VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Get a test user
        user = db.query(User).first()
        
        if not user:
            print("❌ FAILED: No users found in database")
            return False
        
        print(f"\n✅ Test user found: {user.email}")
        
        # Create scoring engine
        engine = ScoringEngine(db, user.id)
        
        # Test score calculation
        print("\n🧪 Test 3A: Calculate All Scores")
        scores = engine.calculate_all_scores()
        
        print(f"\n📊 DIMENSION SCORES (0-100):")
        dimension_scores = {
            'Engagement': scores['engagement_score'],
            'Timeline Urgency': scores['timeline_urgency_score'],
            'Help Seeking': scores['help_seeking_score'],
            'Learning Velocity': scores['learning_velocity_score'],
            'Rewards': scores['rewards_score']
        }
        
        all_valid = True
        for name, value in dimension_scores.items():
            in_range = 0 <= value <= 100
            status = "✅" if in_range else "❌"
            print(f"   {status} {name}: {value:.2f}")
            if not in_range:
                all_valid = False
        
        print(f"\n🏆 COMPOSITE SCORE (0-1000):")
        composite = scores['composite_score']
        composite_valid = 0 <= composite <= 1000
        status = "✅" if composite_valid else "❌"
        print(f"   {status} Composite: {composite:.2f}")
        
        print(f"\n📈 PROFILE METRICS:")
        completion = scores['profile_completion_pct']
        completion_valid = 0 <= completion <= 100
        status = "✅" if completion_valid else "❌"
        print(f"   {status} Completion: {completion:.1f}%")
        print(f"   Available Signals: {scores['available_signals_count']}/{scores['total_signals_count']}")
        
        # Test classification
        print("\n🧪 Test 3B: Classification")
        classification = LeadClassifier.classify_lead(scores)
        
        valid_temps = ["hot_lead", "warm_lead", "cold_lead", "dormant"]
        valid_intents = ["very_high_intent", "high_intent", "medium_intent", "low_intent"]
        
        temp_valid = classification['temperature'] in valid_temps
        intent_valid = classification['intent_band'] in valid_intents
        
        temp_status = "✅" if temp_valid else "❌"
        intent_status = "✅" if intent_valid else "❌"
        
        print(f"   {temp_status} Temperature: {classification['temperature']} ({classification['temperature_label']})")
        print(f"   {intent_status} Intent: {classification['intent_band']} ({classification['intent_label']})")
        
        # Test recommendations
        print("\n🧪 Test 3C: Recommendations")
        full_class = LeadClassifier.classify_and_recommend(scores)
        actions = full_class.get('recommended_actions', [])
        
        # Handle if actions is a list
        if isinstance(actions, list):
            print(f"   Recommended Actions: {len(actions)}")
            for i, action in enumerate(actions[:3], 1):
                print(f"      {i}. {action}")
        else:
            print(f"   Recommended Actions: (unexpected format: {type(actions)})")
            actions = []
        
        # Summary
        print(f"\n📊 SUMMARY:")
        all_scores_valid = all_valid and composite_valid and completion_valid
        all_class_valid = temp_valid and intent_valid
        
        print(f"   Scores valid: {'✅' if all_scores_valid else '❌'}")
        print(f"   Classifications valid: {'✅' if all_class_valid else '❌'}")
        print(f"   Recommendations generated: {'✅' if len(actions) > 0 else '❌'}")
        
        if all_scores_valid and all_class_valid:
            print("\n✅ SCORING TEST PASSED")
            return True
        else:
            print("\n❌ SCORING TEST FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_scoring()
    sys.exit(0 if success else 1)

