#!/bin/bash
# Run all analytics validation tests

echo "================================================================================"
echo "ANALYTICS END-TO-END VALIDATION TEST SUITE"
echo "================================================================================"
echo ""

# Track results
PASSED=0
FAILED=0
TESTS=()

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo ""
    echo "================================================================================"
    echo "Running: $test_name"
    echo "================================================================================"
    
    docker exec app-backend-1 python /app/tests/analytics/$test_file
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        PASSED=$((PASSED + 1))
        TESTS+=("✅ $test_name")
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        FAILED=$((FAILED + 1))
        TESTS+=("❌ $test_name")
    fi
}

# Run all tests
run_test "Event Tracking" "test_event_tracking.py"
run_test "Signal Extraction" "test_signal_extraction.py"
run_test "Score Calculation" "test_scoring.py"
run_test "Database Storage" "test_storage.py"
run_test "History Snapshots" "test_snapshots.py"
run_test "Data Integrity" "test_integrity.py"

# Summary
echo ""
echo "================================================================================"
echo "TEST SUITE SUMMARY"
echo "================================================================================"
echo ""

TOTAL=$((PASSED + FAILED))
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

echo "Test Results:"
for test in "${TESTS[@]}"; do
    echo "  $test"
done

echo ""
echo "================================================================================"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "================================================================================"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "================================================================================"
    exit 1
fi

