#!/usr/bin/env python3
"""
Test Data Integrity
Validates database consistency and data quality
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from sqlalchemy import text

def test_integrity():
    """Test data integrity"""
    print("=" * 80)
    print("TEST 6: DATA INTEGRITY VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        issues_found = []
        
        # Test 1: Invalid Score Ranges
        print("\n🧪 Test 6A: Invalid Score Ranges")
        invalid_scores = db.execute(text("""
            SELECT COUNT(*) as count
            FROM user_lead_scores
            WHERE composite_score < 0 OR composite_score > 1000
               OR engagement_score < 0 OR engagement_score > 100
               OR timeline_urgency_score < 0 OR timeline_urgency_score > 100
               OR help_seeking_score < 0 OR help_seeking_score > 100
               OR learning_velocity_score < 0 OR learning_velocity_score > 100
               OR rewards_score < 0 OR rewards_score > 100
        """)).fetchone()
        
        invalid_count = invalid_scores[0] if invalid_scores else 0
        
        if invalid_count == 0:
            print("   ✅ No invalid score ranges found")
        else:
            print(f"   ❌ Found {invalid_count} records with invalid scores")
            issues_found.append(f"Invalid scores: {invalid_count}")
        
        # Test 2: Orphaned Events
        print("\n🧪 Test 6B: Orphaned Events")
        orphaned_events = db.execute(text("""
            SELECT COUNT(*) as count
            FROM user_behavior_events e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE u.id IS NULL
        """)).fetchone()
        
        orphaned_count = orphaned_events[0] if orphaned_events else 0
        
        if orphaned_count == 0:
            print("   ✅ No orphaned events found")
        else:
            print(f"   ❌ Found {orphaned_count} orphaned events")
            issues_found.append(f"Orphaned events: {orphaned_count}")
        
        # Test 3: Duplicate Snapshots
        print("\n🧪 Test 6C: Duplicate Snapshots")
        duplicates = db.execute(text("""
            SELECT COUNT(*) as count
            FROM (
                SELECT user_id, snapshot_date, COUNT(*) as cnt
                FROM lead_score_history
                GROUP BY user_id, snapshot_date
                HAVING COUNT(*) > 1
            ) dups
        """)).fetchone()
        
        duplicate_count = duplicates[0] if duplicates else 0
        
        if duplicate_count == 0:
            print("   ✅ No duplicate snapshots found")
        else:
            print(f"   ⚠️  Found {duplicate_count} duplicate snapshot groups")
            issues_found.append(f"Duplicate snapshots: {duplicate_count}")
        
        # Test 4: Stale Scores
        print("\n🧪 Test 6D: Stale Scores")
        stale_scores = db.execute(text("""
            SELECT COUNT(*) as count
            FROM user_lead_scores
            WHERE last_calculated_at < NOW() - INTERVAL '7 days'
        """)).fetchone()
        
        stale_count = stale_scores[0] if stale_scores else 0
        
        if stale_count == 0:
            print("   ✅ No stale scores found")
        else:
            print(f"   ⚠️  Found {stale_count} scores older than 7 days")
            # Not adding to issues - this is just informational
        
        # Test 5: Missing Classifications
        print("\n🧪 Test 6E: Missing Classifications")
        missing_class = db.execute(text("""
            SELECT COUNT(*) as count
            FROM user_lead_scores
            WHERE lead_temperature IS NULL OR intent_band IS NULL
        """)).fetchone()
        
        missing_count = missing_class[0] if missing_class else 0
        
        if missing_count == 0:
            print("   ✅ All scores have classifications")
        else:
            print(f"   ⚠️  Found {missing_count} scores without classifications")
            issues_found.append(f"Missing classifications: {missing_count}")
        
        # Test 6: Event Weight Consistency
        print("\n🧪 Test 6F: Event Weight Consistency")
        # Check if event weights match expected values
        weight_check = db.execute(text("""
            SELECT 
                event_type,
                MIN(event_weight) as min_weight,
                MAX(event_weight) as max_weight,
                COUNT(DISTINCT event_weight) as unique_weights
            FROM user_behavior_events
            WHERE event_weight IS NOT NULL
            GROUP BY event_type
            HAVING COUNT(DISTINCT event_weight) > 1
        """)).fetchall()
        
        if len(weight_check) == 0:
            print("   ✅ Event weights are consistent")
        else:
            print(f"   ⚠️  Found {len(weight_check)} event types with inconsistent weights")
            for row in weight_check:
                print(f"      {row[0]}: {row[1]} - {row[2]} ({row[3]} unique values)")
        
        # Database statistics
        print("\n📊 DATABASE STATISTICS:")
        
        # Count tables
        user_count = db.execute(text("SELECT COUNT(*) FROM users")).fetchone()[0]
        event_count = db.execute(text("SELECT COUNT(*) FROM user_behavior_events")).fetchone()[0]
        score_count = db.execute(text("SELECT COUNT(*) FROM user_lead_scores")).fetchone()[0]
        snapshot_count = db.execute(text("SELECT COUNT(*) FROM lead_score_history")).fetchone()[0]
        
        print(f"   Users: {user_count}")
        print(f"   Events: {event_count}")
        print(f"   Scores: {score_count}")
        print(f"   Snapshots: {snapshot_count}")
        
        # Coverage
        if user_count > 0:
            score_coverage = (score_count / user_count) * 100
            print(f"   Score Coverage: {score_coverage:.1f}%")
        
        # Summary
        print(f"\n📊 INTEGRITY SUMMARY:")
        print(f"   Critical Issues: {len([i for i in issues_found if 'Invalid' in i or 'Orphaned' in i])}")
        print(f"   Warnings: {len([i for i in issues_found if i not in ['Invalid', 'Orphaned']])}")
        
        if len(issues_found) == 0:
            print("\n✅ DATA INTEGRITY TEST PASSED")
            return True
        else:
            print(f"\n⚠️  DATA INTEGRITY TEST COMPLETED WITH {len(issues_found)} ISSUES:")
            for issue in issues_found:
                print(f"      - {issue}")
            
            # Only fail on critical issues
            critical = len([i for i in issues_found if 'Invalid' in i or 'Orphaned' in i])
            if critical > 0:
                print("\n❌ CRITICAL ISSUES FOUND")
                return False
            else:
                print("\n⚠️  NON-CRITICAL ISSUES ONLY")
                return True
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_integrity()
    sys.exit(0 if success else 1)

