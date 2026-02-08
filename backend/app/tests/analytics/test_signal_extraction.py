#!/usr/bin/env python3
"""
Test Signal Extraction
Validates that signal extractors work correctly
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from analytics.signal_extractors import SignalExtractor
from analytics.scoring_signals import SignalAvailabilityChecker, ScoringSignalsCatalog
from models import User

def test_signal_extraction():
    """Test signal extraction functionality"""
    print("=" * 80)
    print("TEST 2: SIGNAL EXTRACTION VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Get a test user
        user = db.query(User).first()
        
        if not user:
            print("❌ FAILED: No users found in database")
            return False
        
        print(f"\n✅ Test user found: {user.email}")
        
        # Create extractor
        extractor = SignalExtractor(db, user.id)
        
        # Test catalog
        print("\n🧪 Test 2A: Signal Catalog")
        all_signals = ScoringSignalsCatalog.get_all_signals()
        print(f"   Total signals in catalog: {len(all_signals)}")
        
        if len(all_signals) == 49:
            print(f"   ✅ Correct signal count (49)")
        else:
            print(f"   ❌ Unexpected signal count: {len(all_signals)} (expected 49)")
        
        # Count by dimension
        engagement_signals = [s for s in all_signals if s.dimension.value == 'engagement']
        print(f"   Engagement signals: {len(engagement_signals)}")
        
        if len(engagement_signals) == 16:
            print(f"   ✅ Correct engagement signal count (16)")
        else:
            print(f"   ⚠️  Unexpected count: {len(engagement_signals)} (expected 16)")
        
        # Test extraction methods exist
        print("\n🧪 Test 2B: Extractor Methods")
        
        test_methods = [
            'extract_lessons_completed',
            'extract_modules_completed',
            'extract_quiz_pass_rate',
            'extract_minigame_attempts',
            'extract_minigame_pass_rate',
            'extract_minigame_avg_score',
            'extract_lessons_complete_awaiting_minigame'
        ]
        
        methods_found = 0
        for method in test_methods:
            if hasattr(extractor, method):
                print(f"   ✅ {method}")
                methods_found += 1
            else:
                print(f"   ❌ {method} - NOT FOUND")
        
        # Test actual extraction
        print("\n🧪 Test 2C: Extract Sample Signals")
        
        test_extractions = {
            'Lessons Completed': extractor.extract_lessons_completed(),
            'Modules Completed': extractor.extract_modules_completed(),
            'Quiz Pass Rate': extractor.extract_quiz_pass_rate(),
            'Mini-game Attempts': extractor.extract_minigame_attempts(),
            'Lessons at Gate': extractor.extract_lessons_complete_awaiting_minigame()
        }
        
        valid_extractions = 0
        for name, value in test_extractions.items():
            if value is None:
                print(f"   ⚪ {name}: None (no data)")
                valid_extractions += 1  # None is valid
            elif 0 <= value <= 100:
                print(f"   ✅ {name}: {value:.2f}")
                valid_extractions += 1
            else:
                print(f"   ❌ {name}: {value} (invalid range)")
        
        # Test availability checker
        print("\n🧪 Test 2D: Signal Availability")
        checker = SignalAvailabilityChecker(db, user.id)
        summary = checker.get_availability_summary()
        
        print(f"   Total Signals: {summary['total_signals_count']}")
        print(f"   Available: {summary['available_signals_count']}")
        print(f"   Profile Completion: {summary['completion_percentage']:.1f}%")
        
        # Summary
        print(f"\n📊 SUMMARY:")
        print(f"   Methods found: {methods_found}/{len(test_methods)}")
        print(f"   Valid extractions: {valid_extractions}/{len(test_extractions)}")
        print(f"   Profile completion: {summary['completion_percentage']:.1f}%")
        
        if methods_found == len(test_methods) and valid_extractions == len(test_extractions):
            print("\n✅ SIGNAL EXTRACTION TEST PASSED")
            return True
        else:
            print("\n❌ SIGNAL EXTRACTION TEST FAILED")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_signal_extraction()
    sys.exit(0 if success else 1)

