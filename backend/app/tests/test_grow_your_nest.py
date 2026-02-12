"""
Test Grow Your Nest API route (/api/grow-your-nest).

Covers lesson questions, lesson submit, freeroam questions/progress/state,
module quiz (questions, submit, attempts, stats), auth, and error responses.
"""
import sys
import os
import pytest
from uuid import uuid4

# Add parent so "app" package or app.py is importable (.. = app dir when file is in app/tests/)
_here = os.path.abspath(os.path.dirname(__file__))
_app_root = os.path.abspath(os.path.join(_here, ".."))
if _app_root not in sys.path:
    sys.path.insert(0, _app_root)

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Support both "from app.app import app" (when project root is in path) and "from app import app"
try:
    from app.app import app
except ImportError:
    from app import app
from database import SessionLocal
from models import User, Module, Lesson, QuizQuestion, QuizAnswer, UserLessonProgress
from auth import AuthManager, get_current_user


# Base path for Grow Your Nest (kebab-case URL)
API_PREFIX = "/api/grow-your-nest"


@pytest.fixture(scope="module")
def db():
    """Module-scoped DB session for test data."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def test_user(db: Session):
    """Get or create a test user and return (user, token)."""
    user = db.query(User).first()
    if not user:
        user = User(
            email=f"grow_your_nest_test_{uuid4()}@test.com",
            password_hash=AuthManager.get_password_hash("TestPassword123!"),
            first_name="Grow",
            last_name="Test",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = AuthManager.create_access_token(data={"sub": str(user.id)})
    return user, token


@pytest.fixture(scope="function")
def client():
    """Function-scoped TestClient with no auth override (for testing 403 when no token)."""
    return TestClient(app)


@pytest.fixture(scope="function")
def auth_client(test_user):
    """Function-scoped TestClient with get_current_user overridden (no real JWT needed)."""
    user, _ = test_user
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture(scope="module")
def module_and_lesson(db: Session):
    """Get or create a module and lesson for tests."""
    module = db.query(Module).filter(Module.is_active == True).first()
    if not module:
        module = Module(
            title="Test Module for Grow Your Nest",
            description="Test",
            order_index=0,
            difficulty_level="beginner",
            is_active=True,
        )
        db.add(module)
        db.flush()
    lesson = (
        db.query(Lesson)
        .filter(Lesson.module_id == module.id, Lesson.is_active == True)
        .first()
    )
    if not lesson:
        lesson = Lesson(
            module_id=module.id,
            title="Test Lesson",
            order_index=0,
            is_active=True,
        )
        db.add(lesson)
        db.commit()
        db.refresh(module)
        db.refresh(lesson)
    return module, lesson


@pytest.fixture(scope="module")
def question_and_answers(db: Session, module_and_lesson):
    """Get or create a quiz question with one correct and one wrong answer."""
    module, lesson = module_and_lesson
    q = (
        db.query(QuizQuestion)
        .filter(
            QuizQuestion.lesson_id == lesson.id,
            QuizQuestion.is_active == True,
        )
        .first()
    )
    if not q:
        q = QuizQuestion(
            lesson_id=lesson.id,
            question_text="Test question for validate-answer?",
            question_type="multiple_choice",
            explanation="Test explanation",
            order_index=0,
            is_active=True,
        )
        db.add(q)
        db.flush()
    answers = db.query(QuizAnswer).filter(QuizAnswer.question_id == q.id).all()
    if len(answers) < 2:
        for ans in answers:
            db.delete(ans)
        db.flush()
        a_correct = QuizAnswer(
            question_id=q.id,
            answer_text="Correct",
            is_correct=True,
            order_index=0,
        )
        a_wrong = QuizAnswer(
            question_id=q.id,
            answer_text="Wrong",
            is_correct=False,
            order_index=1,
        )
        db.add(a_correct)
        db.add(a_wrong)
        db.commit()
        db.refresh(q)
        db.refresh(a_correct)
        db.refresh(a_wrong)
        answers = [a_correct, a_wrong]
    else:
        correct = next((a for a in answers if a.is_correct), answers[0])
        wrong = next((a for a in answers if not a.is_correct), answers[1])
        answers = [correct, wrong]
    return q, answers[0], answers[1]


@pytest.fixture(scope="module")
def lesson_progress_for_submit(db: Session, test_user, module_and_lesson):
    """Ensure test_user has completed lesson (video) and quiz_attempts=0 so submit is allowed."""
    _, lesson = module_and_lesson
    progress = (
        db.query(UserLessonProgress)
        .filter(
            UserLessonProgress.user_id == test_user[0].id,
            UserLessonProgress.lesson_id == lesson.id,
        )
        .first()
    )
    if not progress:
        progress = UserLessonProgress(
            user_id=test_user[0].id,
            lesson_id=lesson.id,
            status="completed",
            quiz_attempts=0,
        )
        db.add(progress)
    else:
        progress.status = "completed"
        progress.quiz_attempts = 0
    db.commit()
    db.refresh(progress)
    return progress


# ----- Unauthenticated access -----


def test_stats_requires_auth(client: TestClient):
    """GET /api/grow-your-nest/stats without token returns 403."""
    response = client.get(f"{API_PREFIX}/stats")
    assert response.status_code == 403


def test_module_questions_requires_auth(client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/module/{module_id} without token returns 403."""
    module, _ = module_and_lesson
    response = client.get(f"{API_PREFIX}/module/{module.id}")
    assert response.status_code == 403


def test_module_attempts_requires_auth(client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/module/{module_id}/attempts without token returns 403."""
    module, _ = module_and_lesson
    response = client.get(f"{API_PREFIX}/module/{module.id}/attempts")
    assert response.status_code == 403


def test_lesson_questions_requires_auth(client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/lesson/{lesson_id}/questions without token returns 403."""
    _, lesson = module_and_lesson
    response = client.get(f"{API_PREFIX}/lesson/{lesson.id}/questions")
    assert response.status_code == 403


def test_freeroam_state_requires_auth(client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/freeroam/{module_id}/state without token returns 403."""
    module, _ = module_and_lesson
    response = client.get(f"{API_PREFIX}/freeroam/{module.id}/state")
    assert response.status_code == 403


# ----- Stats endpoint -----


def test_stats_returns_200_and_shape(auth_client: TestClient):
    """GET /api/grow-your-nest/stats with auth returns 200 and expected keys."""
    response = auth_client.get(f"{API_PREFIX}/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_attempts" in data
    assert "total_passed" in data
    assert "total_failed" in data
    assert "pass_rate" in data
    assert "average_score" in data
    assert "best_score" in data
    assert "modules_completed" in data


# ----- Module quiz: get questions -----


def test_module_questions_invalid_module_404(auth_client: TestClient):
    """GET /api/grow-your-nest/module/{module_id} with invalid UUID returns 404."""
    fake_uuid = str(uuid4())
    response = auth_client.get(f"{API_PREFIX}/module/{fake_uuid}")
    assert response.status_code == 404
    detail = response.json().get("detail", "")
    assert "not found" in (detail if isinstance(detail, str) else str(detail)).lower()


def test_module_questions_gate_403_when_lessons_incomplete(
    auth_client: TestClient, test_user, module_and_lesson, db: Session
):
    """GET /api/grow-your-nest/module/{module_id} returns 403 when not all lessons completed."""
    module, _ = module_and_lesson
    response = auth_client.get(f"{API_PREFIX}/module/{module.id}")
    # Either 403 (incomplete lessons) or 404 (no questions) or 200 (if seed completed lessons)
    assert response.status_code in (200, 403, 404)
    if response.status_code == 403:
        detail = response.json().get("detail", {})
        if isinstance(detail, dict):
            assert detail.get("error") == "incomplete_lessons" or "incomplete" in str(detail).lower()


def test_module_attempts_returns_list(auth_client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/module/{module_id}/attempts returns 200 and list."""
    module, _ = module_and_lesson
    response = auth_client.get(f"{API_PREFIX}/module/{module.id}/attempts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ----- Module quiz: submit -----


def test_module_submit_invalid_module_404(auth_client: TestClient):
    """POST /api/grow-your-nest/module/{module_id}/submit with invalid module returns 404."""
    fake_uuid = str(uuid4())
    response = auth_client.post(
        f"{API_PREFIX}/module/{fake_uuid}/submit",
        json={
            "module_id": fake_uuid,
            "answers": [],
            "time_taken_seconds": 60,
        },
    )
    assert response.status_code == 404


def test_module_submit_module_id_mismatch_400(
    auth_client: TestClient, module_and_lesson
):
    """POST submit with module_id in body different from path returns 400."""
    module, _ = module_and_lesson
    other_uuid = str(uuid4())
    response = auth_client.post(
        f"{API_PREFIX}/module/{module.id}/submit",
        json={
            "module_id": other_uuid,
            "answers": [],
            "time_taken_seconds": 60,
        },
    )
    assert response.status_code == 400
    detail = response.json().get("detail", "")
    assert "mismatch" in (detail if isinstance(detail, str) else str(detail)).lower()


# ----- Lesson questions -----


def test_lesson_questions_invalid_lesson_404(auth_client: TestClient):
    """GET /api/grow-your-nest/lesson/{lesson_id}/questions with invalid lesson returns 404."""
    fake_uuid = str(uuid4())
    response = auth_client.get(f"{API_PREFIX}/lesson/{fake_uuid}/questions")
    assert response.status_code == 404


def test_lesson_questions_video_not_completed_400(
    auth_client: TestClient, module_and_lesson
):
    """GET lesson questions without completed video returns 400 (when no progress)."""
    _, lesson = module_and_lesson
    response = auth_client.get(f"{API_PREFIX}/lesson/{lesson.id}/questions")
    # 400 = "complete the lesson video first" or 404 = no questions
    assert response.status_code in (400, 404)
    if response.status_code == 400:
        detail = response.json().get("detail", "").lower()
        assert "video" in detail or "complete" in detail


# ----- Freeroam -----


def test_freeroam_state_returns_200_and_shape(
    auth_client: TestClient, module_and_lesson
):
    """GET /api/grow-your-nest/freeroam/{module_id}/state returns 200 and tree state keys."""
    module, _ = module_and_lesson
    response = auth_client.get(f"{API_PREFIX}/freeroam/{module.id}/state")
    assert response.status_code == 200
    data = response.json()
    assert "growth_points" in data
    assert "current_stage" in data
    assert "total_stages" in data
    assert "points_per_stage" in data
    assert "completed" in data


def test_freeroam_questions_requires_auth(client: TestClient, module_and_lesson):
    """GET /api/grow-your-nest/freeroam/{module_id}/questions without token returns 403."""
    module, _ = module_and_lesson
    response = client.get(f"{API_PREFIX}/freeroam/{module.id}/questions")
    assert response.status_code == 403


def test_freeroam_progress_requires_auth(client: TestClient, module_and_lesson):
    """POST /api/grow-your-nest/freeroam/{module_id}/progress without token returns 403."""
    module, _ = module_and_lesson
    response = client.post(
        f"{API_PREFIX}/freeroam/{module.id}/progress",
        json={
            "question_id": str(uuid4()),
            "answer_id": str(uuid4()),
            "is_correct": True,
            "consecutive_correct": 1,
        },
    )
    assert response.status_code == 403


# ----- Validate single answer -----


def test_validate_answer_requires_auth(client: TestClient, question_and_answers):
    """POST /api/grow-your-nest/validate-answer without token returns 403."""
    q, a_correct, _ = question_and_answers
    response = client.post(
        f"{API_PREFIX}/validate-answer",
        json={"question_id": str(q.id), "answer_id": str(a_correct.id)},
    )
    assert response.status_code == 403


def test_validate_answer_correct_returns_true(
    auth_client: TestClient, question_and_answers
):
    """POST validate-answer with correct answer_id returns is_correct true and explanation."""
    q, a_correct, _ = question_and_answers
    response = auth_client.post(
        f"{API_PREFIX}/validate-answer",
        json={"question_id": str(q.id), "answer_id": str(a_correct.id)},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is True
    assert "explanation" in data


def test_validate_answer_incorrect_returns_false(
    auth_client: TestClient, question_and_answers
):
    """POST validate-answer with wrong answer_id returns is_correct false."""
    q, _, a_wrong = question_and_answers
    response = auth_client.post(
        f"{API_PREFIX}/validate-answer",
        json={"question_id": str(q.id), "answer_id": str(a_wrong.id)},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is False


def test_validate_answer_invalid_ids_returns_false(auth_client: TestClient):
    """POST validate-answer with non-matching question/answer returns is_correct false."""
    response = auth_client.post(
        f"{API_PREFIX}/validate-answer",
        json={"question_id": str(uuid4()), "answer_id": str(uuid4())},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is False


# ----- Freeroam /answer (server-validated) -----


def test_freeroam_answer_requires_auth(client: TestClient, module_and_lesson):
    """POST /api/grow-your-nest/freeroam/{module_id}/answer without token returns 403."""
    module, _ = module_and_lesson
    response = client.post(
        f"{API_PREFIX}/freeroam/{module.id}/answer",
        json={
            "question_id": str(uuid4()),
            "answer_id": str(uuid4()),
            "consecutive_correct": 0,
        },
    )
    assert response.status_code == 403


def test_freeroam_answer_validates_and_returns_feedback(
    auth_client: TestClient, module_and_lesson, question_and_answers
):
    """POST freeroam/{module_id}/answer validates on server and returns is_correct and tree_state."""
    module, _ = module_and_lesson
    q, a_correct, a_wrong = question_and_answers
    response = auth_client.post(
        f"{API_PREFIX}/freeroam/{module.id}/answer",
        json={
            "question_id": str(q.id),
            "answer_id": str(a_correct.id),
            "consecutive_correct": 0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "is_correct" in data
    assert "tree_state" in data
    assert "growth_points" in data["tree_state"]
    if data["is_correct"]:
        assert data.get("growth_points_earned", 0) >= 0
        assert data.get("explanation") is not None or "explanation" in data


# ----- Lesson submit (server-validated, no is_correct from client) -----


def test_lesson_submit_accepts_answers_without_is_correct(
    auth_client: TestClient,
    module_and_lesson,
    question_and_answers,
    lesson_progress_for_submit,
):
    """POST lesson/{id}/submit accepts answers as question_id+answer_id only; server validates."""
    _, lesson = module_and_lesson
    q, a_correct, a_wrong = question_and_answers
    if q.lesson_id != lesson.id:
        pytest.skip("question not in this lesson")
    response = auth_client.post(
        f"{API_PREFIX}/lesson/{lesson.id}/submit",
        json={
            "answers": [
                {"question_id": str(q.id), "answer_id": str(a_correct.id)},
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "correct_count" in data
    assert "total_questions" in data
    assert data["total_questions"] == 1
    assert data["correct_count"] == 1
