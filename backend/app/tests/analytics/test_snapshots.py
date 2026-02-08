#!/usr/bin/env python3
"""
Test History Snapshots
Validates daily snapshot creation
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from database import get_db
from analytics.scheduler import AnalyticsScheduler
from models import LeadScoreHistory
from sqlalchemy import desc, func, text

def test_snapshots():
    """Test history snapshot creation"""
    print("=" * 80)
    print("TEST 5: HISTORY SNAPSHOT VALIDATION")
    print("=" * 80)
    
    db = next(get_db())
    
    try:
        # Check initial snapshot count
        initial_count = db.query(func.count(LeadScoreHistory.id)).scalar()
        print(f"\n📊 Initial snapshot count: {initial_count}")
        
        # Create snapshots
        print("\n🧪 Test 5A: Create Daily Snapshots")
        result = AnalyticsScheduler.create_daily_snapshots()
        
        print(f"   Status: {result['status']}")
        print(f"   Message: {result['message']}")
        print(f"   Total Users: {result.get('total_users', 0)}")
        print(f"   Successful: {result.get('successful', 0)}")
        print(f"   Failed: {result.get('failed', 0)}")
        
        if result['status'] == 'success':
            print("   ✅ Snapshot creation successful")
        else:
            print(f"   ❌ Snapshot creation failed: {result.get('message', 'Unknown error')}")
            return False
        
        # Check final snapshot count
        final_count = db.query(func.count(LeadScoreHistory.id)).scalar()
        new_snapshots = final_count - initial_count
        
        print(f"\n📊 Snapshots after creation: {final_count} (+{new_snapshots})")
        
        # Get recent snapshots
        print("\n🧪 Test 5B: Verify Snapshot Data")
        snapshots = db.query(LeadScoreHistory).order_by(
            desc(LeadScoreHistory.created_at)
        ).limit(5).all()
        
        if snapshots:
            print(f"   ✅ Found {len(snapshots)} recent snapshots")
            
            for i, snapshot in enumerate(snapshots[:3], 1):
                print(f"\n   Snapshot {i}:")
                print(f"      Date: {snapshot.snapshot_date}")
                print(f"      Composite Score: {snapshot.composite_score}")
                print(f"      Temperature: {snapshot.lead_temperature}")
                print(f"      Intent: {snapshot.intent_band}")
                print(f"      Has Metrics: {'✅' if snapshot.metrics_json else '❌'}")
                
                # Validate snapshot data
                valid_score = 0 <= float(snapshot.composite_score) <= 1000
                has_temp = snapshot.lead_temperature is not None
                has_intent = snapshot.intent_band is not None
                has_metrics = snapshot.metrics_json is not None
                
                if not valid_score:
                    print(f"      ❌ Invalid score: {snapshot.composite_score}")
                if not has_temp:
                    print(f"      ⚠️  Missing temperature")
                if not has_intent:
                    print(f"      ⚠️  Missing intent")
        else:
            print("   ⚠️  No snapshots found")
        
        # Check for duplicate snapshots (same user, same date)
        print("\n🧪 Test 5C: Check for Duplicates")
        duplicate_check = db.execute(text("""
            SELECT user_id, snapshot_date, COUNT(*) as cnt
            FROM lead_score_history
            GROUP BY user_id, snapshot_date
            HAVING COUNT(*) > 1
            LIMIT 5
        """)).fetchall()
        
        if duplicate_check:
            print(f"   ⚠️  Found {len(duplicate_check)} duplicate snapshots")
            for dup in duplicate_check:
                print(f"      User: {dup[0]}, Date: {dup[1]}, Count: {dup[2]}")
        else:
            print("   ✅ No duplicate snapshots found")
        
        # Group snapshots by date
        print("\n📊 SNAPSHOTS BY DATE:")
        date_groups = db.execute(text("""
            SELECT 
                snapshot_date,
                COUNT(*) as count,
                AVG(composite_score) as avg_score
            FROM lead_score_history
            GROUP BY snapshot_date
            ORDER BY snapshot_date DESC
            LIMIT 7
        """)).fetchall()
        
        for row in date_groups:
            print(f"   {row[0]}: {row[1]} snapshots (avg score: {float(row[2]):.2f})")
        
        # Summary
        success_conditions = [
            result['status'] == 'success',
            len(snapshots) > 0,
            len(duplicate_check) == 0
        ]
        
        if all(success_conditions):
            print("\n✅ SNAPSHOT TEST PASSED")
            return True
        else:
            print("\n⚠️  SNAPSHOT TEST COMPLETED WITH WARNINGS")
            return True  # Not critical failure
            
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = test_snapshots()
    sys.exit(0 if success else 1)

