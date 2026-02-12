"""
API tests for learning module critical paths.

Covers: GET /api/learning/modules, GET /api/learning/modules/{id}/lessons.
Ensures lessons with null lesson_summary return 200 (no 500).
"""
import os
import sys
from uuid import uuid4

import pytest

_here = os.path.abspath(os.path.dirname(__file__))
_app_root = os.path.abspath(os.path.join(_here, ".."))
if _app_root not in sys.path:
    sys.path.insert(0, _app_root)

from fastapi.testclient import TestClient

try:
    from app import app
except ImportError:
    from app.app import app

from database import SessionLocal
from models import User, Module, Lesson
from auth import AuthManager, get_current_user

API_PREFIX = "/api/learning"


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def test_user(db):
    """Create a test user and return (user, token)."""
    email = f"learning_api_test_{uuid4().hex[:12]}@test.com"
    user = User(
        email=email,
        password_hash=AuthManager.get_password_hash("TestPass123!"),
        first_name="Learning",
        last_name="Test",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = AuthManager.create_access_token(data={"sub": str(user.id)})
    yield user, token
    db.delete(user)
    db.commit()


@pytest.fixture(scope="module")
def module_with_lesson_null_summary(db):
    """Create a module and lesson with lesson_summary=None (production-like)."""
    mod = Module(
        title="Test Module Learning API",
        description="Desc",
        order_index=100,
        difficulty_level="beginner",
        is_active=True,
    )
    db.add(mod)
    db.flush()
    lesson = Lesson(
        module_id=mod.id,
        title="Lesson Without Summary",
        order_index=0,
        is_active=True,
        lesson_summary=None,
    )
    db.add(lesson)
    db.commit()
    db.refresh(mod)
    db.refresh(lesson)
    yield mod, lesson
    db.delete(lesson)
    db.delete(mod)
    db.commit()


@pytest.fixture
def auth_client(test_user):
    """Client with get_current_user overridden."""
    user, _ = test_user
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_get_modules_returns_200(auth_client: TestClient):
    """GET /api/learning/modules returns 200."""
    response = auth_client.get(f"{API_PREFIX}/modules")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_module_lessons_with_null_summary_returns_200(
    auth_client: TestClient, module_with_lesson_null_summary
):
    """GET /api/learning/modules/{id}/lessons returns 200 when lessons have null lesson_summary."""
    mod, _ = module_with_lesson_null_summary
    response = auth_client.get(f"{API_PREFIX}/modules/{mod.id}/lessons")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        # At least one lesson; optional fields may be null
        first = data[0]
        assert "id" in first
        assert "title" in first
        assert "lesson_summary" in first  # key present; value may be None
        assert first.get("lesson_summary") is None or isinstance(first["lesson_summary"], str)
