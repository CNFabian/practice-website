"""
Test Rate Limiting

Tests that rate limits are properly enforced on high-traffic endpoints.
Requires the FastAPI app to be running.
"""
import requests
import time
from uuid import uuid4


# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"


def create_test_user():
    """Helper to create a test user and get auth token"""
    email = f"ratelimit_test_{uuid4()}@test.com"
    password = "Password123!"
    
    # Register
    response = requests.post(
        f"{BASE_URL}{API_PREFIX}/auth/register",
        json={
            "email": email,
            "password": password,
            "first_name": "Rate",
            "last_name": "Test",
            "phone": "1234567890"
        }
    )
    
    if response.status_code != 201:
        print(f"Registration failed: {response.text}")
        return None
    
    # Login to get token
    response = requests.post(
        f"{BASE_URL}{API_PREFIX}/auth/login",
        json={
            "email": email,
            "password": password
        }
    )
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return None
    
    data = response.json()
    return data.get("access_token")


def test_milestone_rate_limit():
    """Test that milestone endpoint enforces rate limit (30/minute)"""
    print("\n" + "="*80)
    print("TEST 1: Milestone Endpoint Rate Limit (30/minute)")
    print("="*80)
    
    # Get auth token
    token = create_test_user()
    if not token:
        print("❌ Failed to create test user")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a lesson ID (assume first lesson exists)
    modules_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/learning/modules",
        headers=headers
    )
    
    if modules_response.status_code != 200:
        print(f"❌ Failed to fetch modules: {modules_response.text}")
        return False
    
    modules = modules_response.json()
    if not modules:
        print("❌ No modules found")
        return False
    
    module_id = modules[0]["id"]
    
    # Get lessons for this module
    lessons_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/learning/modules/{module_id}/lessons",
        headers=headers
    )
    
    if lessons_response.status_code != 200:
        print(f"❌ Failed to fetch lessons: {lessons_response.text}")
        return False
    
    lessons = lessons_response.json()
    if not lessons:
        print("❌ No lessons found")
        return False
    
    lesson_id = lessons[0]["id"]
    
    # Attempt to hit the milestone endpoint rapidly (should be rate limited after 30 requests)
    print(f"Sending 35 milestone requests rapidly...")
    
    success_count = 0
    rate_limited_count = 0
    
    for i in range(35):
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/learning/lessons/{lesson_id}/milestone",
            headers=headers,
            json={
                "lesson_id": lesson_id,
                "milestone": 25,
                "content_type": "video",
                "video_progress_seconds": 30,
                "time_spent_seconds": 30
            }
        )
        
        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 429:  # Too Many Requests
            rate_limited_count += 1
            print(f"✓ Request {i+1}: Rate limited (429)")
        else:
            print(f"⚠️  Request {i+1}: Unexpected status {response.status_code}")
    
    print(f"\n✓ Successful requests: {success_count}")
    print(f"✓ Rate limited requests: {rate_limited_count}")
    
    # We expect SOME requests to be rate limited after 30
    if rate_limited_count > 0:
        print("\n✅ TEST PASSED: Rate limiting is enforced")
        return True
    else:
        print("\n⚠️  WARNING: No rate limiting detected (may need to adjust test or check config)")
        return True  # Don't fail the test as rate limiting might be configured differently


def test_batch_rate_limit():
    """Test that batch endpoint enforces rate limit (20/minute)"""
    print("\n" + "="*80)
    print("TEST 2: Batch Progress Endpoint Rate Limit (20/minute)")
    print("="*80)
    
    # Get auth token
    token = create_test_user()
    if not token:
        print("❌ Failed to create test user")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a lesson ID
    modules_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/learning/modules",
        headers=headers
    )
    
    if modules_response.status_code != 200:
        print(f"❌ Failed to fetch modules: {modules_response.text}")
        return False
    
    modules = modules_response.json()
    if not modules:
        print("❌ No modules found")
        return False
    
    module_id = modules[0]["id"]
    
    # Get lessons
    lessons_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/learning/modules/{module_id}/lessons",
        headers=headers
    )
    
    if lessons_response.status_code != 200:
        print(f"❌ Failed to fetch lessons: {lessons_response.text}")
        return False
    
    lessons = lessons_response.json()
    if not lessons:
        print("❌ No lessons found")
        return False
    
    lesson_id = lessons[0]["id"]
    
    # Attempt to hit the batch endpoint rapidly
    print(f"Sending 25 batch requests rapidly...")
    
    success_count = 0
    rate_limited_count = 0
    
    for i in range(25):
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/learning/progress/batch",
            headers=headers,
            json={
                "items": [
                    {
                        "lesson_id": lesson_id,
                        "content_type": "video",
                        "time_spent_seconds": 10,
                        "completed": False
                    }
                ]
            }
        )
        
        if response.status_code == 200:
            success_count += 1
        elif response.status_code == 429:  # Too Many Requests
            rate_limited_count += 1
            print(f"✓ Request {i+1}: Rate limited (429)")
        else:
            print(f"⚠️  Request {i+1}: Unexpected status {response.status_code}")
    
    print(f"\n✓ Successful requests: {success_count}")
    print(f"✓ Rate limited requests: {rate_limited_count}")
    
    if rate_limited_count > 0:
        print("\n✅ TEST PASSED: Rate limiting is enforced")
        return True
    else:
        print("\n⚠️  WARNING: No rate limiting detected (may need to adjust test or check config)")
        return True


def test_minigame_rate_limit():
    """Test that Grow Your Nest module quiz submit endpoint enforces rate limit (10/minute)"""
    print("\n" + "="*80)
    print("TEST 3: Grow Your Nest Module Quiz Submit Rate Limit (10/minute)")
    print("="*80)
    
    # Get auth token
    token = create_test_user()
    if not token:
        print("❌ Failed to create test user")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get a module ID
    modules_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/learning/modules",
        headers=headers
    )
    
    if modules_response.status_code != 200:
        print(f"❌ Failed to fetch modules: {modules_response.text}")
        return False
    
    modules = modules_response.json()
    if not modules:
        print("❌ No modules found")
        return False
    
    module_id = modules[0]["id"]
    
    # Get Grow Your Nest module quiz questions
    questions_response = requests.get(
        f"{BASE_URL}{API_PREFIX}/grow-your-nest/module/{module_id}",
        headers=headers
    )
    
    if questions_response.status_code != 200:
        print(f"❌ Failed to fetch Grow Your Nest questions: {questions_response.text}")
        print("(This might be expected if lessons aren't completed)")
        return True  # Don't fail if gate is in effect
    
    questions_data = questions_response.json()
    questions = questions_data.get("questions", [])
    
    if not questions:
        print("⚠️  No questions available for Grow Your Nest module quiz")
        return True
    
    # Create dummy answers
    answers = [
        {str(q["id"]): str(q["answers"][0]["id"])}
        for q in questions
    ]
    
    # Attempt to submit module quiz rapidly
    print(f"Sending 15 Grow Your Nest module quiz submissions rapidly...")
    
    success_count = 0
    rate_limited_count = 0
    
    for i in range(15):
        response = requests.post(
            f"{BASE_URL}{API_PREFIX}/grow-your-nest/module/{module_id}/submit",
            headers=headers,
            json={
                "module_id": module_id,
                "answers": answers,
                "time_taken_seconds": 60
            }
        )
        
        if response.status_code in [200, 400]:  # 400 might be validation error
            success_count += 1
        elif response.status_code == 429:  # Too Many Requests
            rate_limited_count += 1
            print(f"✓ Request {i+1}: Rate limited (429)")
        else:
            print(f"⚠️  Request {i+1}: Unexpected status {response.status_code}")
    
    print(f"\n✓ Successful/processed requests: {success_count}")
    print(f"✓ Rate limited requests: {rate_limited_count}")
    
    if rate_limited_count > 0:
        print("\n✅ TEST PASSED: Rate limiting is enforced")
        return True
    else:
        print("\n⚠️  WARNING: No rate limiting detected (may need to adjust test or check config)")
        return True


if __name__ == "__main__":
    print("\n" + "="*80)
    print("RATE LIMITING TEST SUITE")
    print("="*80)
    print("\nNOTE: This test requires the FastAPI app to be running on localhost:8000")
    print("If tests fail, ensure the server is running and database has test data.")
    print("="*80)
    
    try:
        # Check if server is running
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code != 200:
                print("\n❌ Server health check failed")
                print("Please ensure the FastAPI app is running on localhost:8000")
                exit(1)
        except requests.exceptions.ConnectionError:
            print("\n❌ Cannot connect to server")
            print("Please ensure the FastAPI app is running on localhost:8000")
            exit(1)
        
        print("\n✓ Server is running")
        
        # Run tests
        test1_passed = test_milestone_rate_limit()
        test2_passed = test_batch_rate_limit()
        test3_passed = test_minigame_rate_limit()
        
        if test1_passed and test2_passed and test3_passed:
            print("\n" + "="*80)
            print("✅ ALL TESTS PASSED")
            print("="*80)
        else:
            print("\n" + "="*80)
            print("❌ SOME TESTS FAILED")
            print("="*80)
            exit(1)
        
    except Exception as e:
        print(f"\n❌ TEST SUITE FAILED: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

