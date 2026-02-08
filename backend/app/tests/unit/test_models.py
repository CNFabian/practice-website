"""
Unit tests for SQLAlchemy models.

Tests model class attributes, defaults, and instantiation with required fields
(no database session required for basic attribute/default checks).
"""
import sys
import os
from uuid import uuid4
from decimal import Decimal
import datetime

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from models import User, Module, Lesson, UserModuleProgress


# ----- User -----


def test_user_model_has_expected_table():
    assert User.__tablename__ == "users"


def test_user_instantiation_with_required_fields():
    uid = uuid4()
    user = User(
        id=uid,
        email="test@example.com",
        password_hash="hashed",
        first_name="First",
        last_name="Last",
    )
    assert user.id == uid
    assert user.email == "test@example.com"
    assert user.password_hash == "hashed"
    assert user.first_name == "First"
    assert user.last_name == "Last"
    # Column defaults may be applied at flush; unflushed instance can have None
    assert user.is_active in (True, None)
    assert user.is_verified in (False, None)
    assert user.is_admin in (False, None)


def test_user_str():
    user = User(
        id=uuid4(),
        email="u@x.com",
        password_hash="h",
        first_name="A",
        last_name="B",
    )
    assert "u@x.com" in str(user)
    assert "A" in str(user)


# ----- Module -----


def test_module_model_has_expected_table():
    assert Module.__tablename__ == "modules"


def test_module_instantiation_with_required_fields():
    mid = uuid4()
    mod = Module(
        id=mid,
        title="Test Module",
        order_index=0,
    )
    assert mod.id == mid
    assert mod.title == "Test Module"
    assert mod.order_index == 0
    assert mod.is_active in (True, None)
    assert mod.difficulty_level in ("beginner", None)


def test_module_str():
    mod = Module(id=uuid4(), title="My Module", order_index=1)
    assert str(mod) == "My Module"


# ----- Lesson -----


def test_lesson_model_has_expected_table():
    assert Lesson.__tablename__ == "lessons"


def test_lesson_instantiation_with_required_fields():
    lid = uuid4()
    mid = uuid4()
    lesson = Lesson(
        id=lid,
        module_id=mid,
        title="Test Lesson",
        order_index=0,
    )
    assert lesson.id == lid
    assert lesson.module_id == mid
    assert lesson.title == "Test Lesson"
    assert lesson.order_index == 0
    assert lesson.is_active in (True, None)


# ----- UserModuleProgress -----


def test_user_module_progress_model_has_expected_table():
    assert UserModuleProgress.__tablename__ == "user_module_progress"


def test_user_module_progress_required_fields():
    uid = uuid4()
    mid = uuid4()
    progress = UserModuleProgress(
        id=uuid4(),
        user_id=uid,
        module_id=mid,
        total_lessons=5,
    )
    assert progress.user_id == uid
    assert progress.module_id == mid
    assert progress.total_lessons == 5
    # Optional/default columns may exist and be 0/False/None (or not yet set)
    if hasattr(progress, "lessons_completed"):
        assert progress.lessons_completed in (0, None)
    if hasattr(progress, "tree_growth_points"):
        assert progress.tree_growth_points in (0, None)
    if hasattr(progress, "tree_completed"):
        assert progress.tree_completed in (False, None)


# UserModuleQuizAttempt: add tests when that model exists (e.g. after module-quiz merge)
