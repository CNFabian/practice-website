#!/usr/bin/env bash
# Run Grow Your Nest API tests.
# From repo root: ./app/tests/run_grow_your_nest_tests.sh
# Or from app/: ./tests/run_grow_your_nest_tests.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$APP_ROOT/.." 2>/dev/null || cd "$APP_ROOT"
export PYTHONPATH="${APP_ROOT}:${PYTHONPATH:-}"
python -m pytest "$SCRIPT_DIR/test_grow_your_nest.py" -v --tb=short "$@"
