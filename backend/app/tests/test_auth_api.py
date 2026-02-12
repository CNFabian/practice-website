"""
API tests for auth critical paths.

Covers: send-verification-code, verify-email-code, register, login,
password-reset, password-reset/confirm, and /me.
Uses TestClient and mocks email sending (no real SES).
"""
import os
import sys
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
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
from models import User, PendingEmailVerification
from auth import AuthManager


API_PREFIX = "/api/auth"


@pytest.fixture(scope="module")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def unique_email():
    return f"auth_api_test_{uuid4().hex[:12]}@test.com"


# ----- Send verification code -----


@patch("routers.auth.send_verification_email")
def test_send_verification_code_success(mock_send, client: TestClient, db, unique_email: str):
    """POST send-verification-code returns 200 and sends email when email not registered."""
    mock_send.return_value = True
    response = client.post(
        f"{API_PREFIX}/send-verification-code",
        json={"email": unique_email},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data and "verification code" in data["message"].lower()
    mock_send.assert_called_once()
    assert mock_send.call_args[0][0] == unique_email
    assert len(mock_send.call_args[0][1]) == 6 and mock_send.call_args[0][1].isdigit()


@patch("routers.auth.send_verification_email")
def test_send_verification_code_already_registered_returns_400(
    mock_send, client: TestClient, db, unique_email: str
):
    """POST send-verification-code returns 400 when email is already registered."""
    user = User(
        email=unique_email,
        password_hash=AuthManager.get_password_hash("Pass123!"),
        first_name="Test",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    db.commit()
    try:
        response = client.post(
            f"{API_PREFIX}/send-verification-code",
            json={"email": unique_email},
        )
        assert response.status_code == 400
        assert "already registered" in (response.json().get("detail") or "").lower()
        mock_send.assert_not_called()
    finally:
        db.delete(user)
        db.commit()


# ----- Verify email code -----


@patch("routers.auth.send_verification_email")
def test_verify_email_code_success(mock_send, client: TestClient, db, unique_email: str):
    """POST verify-email-code returns 200 when code matches."""
    mock_send.return_value = True
    code = "123456"
    pending = PendingEmailVerification(
        email=unique_email,
        code=code,
        code_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(pending)
    db.commit()
    try:
        response = client.post(
            f"{API_PREFIX}/verify-email-code",
            json={"email": unique_email, "code": code},
        )
        assert response.status_code == 200
        assert "verified" in response.json().get("message", "").lower()
    finally:
        db.delete(pending)
        db.commit()


def test_verify_email_code_invalid_code_returns_400(client: TestClient, db, unique_email: str):
    """POST verify-email-code returns 400 when code is wrong."""
    pending = PendingEmailVerification(
        email=unique_email,
        code="999999",
        code_expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    db.add(pending)
    db.commit()
    try:
        response = client.post(
            f"{API_PREFIX}/verify-email-code",
            json={"email": unique_email, "code": "000000"},
        )
        assert response.status_code == 400
        assert "invalid" in (response.json().get("detail") or "").lower() or "expired" in (
            response.json().get("detail") or ""
        ).lower()
    finally:
        db.delete(pending)
        db.commit()


# ----- Register (after verify) -----


@patch("routers.auth.send_verification_email")
def test_register_requires_verified_email(mock_send, client: TestClient, db, unique_email: str):
    """POST register returns 400 when email was not verified first."""
    response = client.post(
        f"{API_PREFIX}/register",
        json={
            "email": unique_email,
            "password": "SecurePass123!",
            "first_name": "First",
            "last_name": "Last",
        },
    )
    assert response.status_code == 400
    assert "verify" in (response.json().get("detail") or "").lower()


@patch("routers.auth.send_verification_email")
def test_register_success_after_verify(mock_send, client: TestClient, db, unique_email: str):
    """Full flow: send code -> verify -> register returns 201 and tokens."""
    mock_send.return_value = True
    # 1) Send verification code
    r1 = client.post(f"{API_PREFIX}/send-verification-code", json={"email": unique_email})
    assert r1.status_code == 200
    code = mock_send.call_args[0][1]

    # 2) Verify
    r2 = client.post(
        f"{API_PREFIX}/verify-email-code",
        json={"email": unique_email, "code": code},
    )
    assert r2.status_code == 200

    # 3) Register
    r3 = client.post(
        f"{API_PREFIX}/register",
        json={
            "email": unique_email,
            "password": "SecurePass123!",
            "first_name": "First",
            "last_name": "Last",
        },
    )
    assert r3.status_code == 201
    data = r3.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data.get("token_type") == "bearer"

    # Cleanup: remove user so other tests can reuse email pattern
    user = db.query(User).filter(User.email == unique_email).first()
    if user:
        db.delete(user)
        db.commit()


# ----- Login -----


def test_login_success_returns_tokens(client: TestClient, db, unique_email: str):
    """POST login returns 200 and tokens for valid credentials."""
    user = User(
        email=unique_email,
        password_hash=AuthManager.get_password_hash("MyPass123!"),
        first_name="Login",
        last_name="Test",
        is_active=True,
    )
    db.add(user)
    db.commit()
    try:
        response = client.post(
            f"{API_PREFIX}/login",
            json={"email": unique_email, "password": "MyPass123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("token_type") == "bearer"
    finally:
        db.delete(user)
        db.commit()


def test_login_wrong_password_returns_401(client: TestClient, db, unique_email: str):
    """POST login returns 401 for wrong password."""
    user = User(
        email=unique_email,
        password_hash=AuthManager.get_password_hash("CorrectPass"),
        first_name="A",
        last_name="B",
        is_active=True,
    )
    db.add(user)
    db.commit()
    try:
        response = client.post(
            f"{API_PREFIX}/login",
            json={"email": unique_email, "password": "WrongPass"},
        )
        assert response.status_code == 401
    finally:
        db.delete(user)
        db.commit()


# ----- Password reset -----


@patch("routers.auth.send_password_reset_email")
def test_password_reset_returns_200_even_for_unknown_email(mock_send, client: TestClient):
    """POST password-reset returns 200 and same message for unknown email (no leak)."""
    mock_send.return_value = True
    response = client.post(
        f"{API_PREFIX}/password-reset",
        json={"email": "nonexistent@test.com"},
    )
    assert response.status_code == 200
    mock_send.assert_not_called()


@patch("routers.auth.send_password_reset_email")
def test_password_reset_sends_email_and_confirm_works(mock_send, client: TestClient, db, unique_email: str):
    """POST password-reset sends email; POST password-reset/confirm with token updates password."""
    mock_send.return_value = True
    user = User(
        email=unique_email,
        password_hash=AuthManager.get_password_hash("OldPass123!"),
        first_name="Reset",
        last_name="Test",
        is_active=True,
    )
    db.add(user)
    db.commit()
    try:
        r1 = client.post(
            f"{API_PREFIX}/password-reset",
            json={"email": unique_email},
        )
        assert r1.status_code == 200
        mock_send.assert_called_once()
        reset_link = mock_send.call_args[0][1]
        assert "token=" in reset_link
        token = reset_link.split("token=")[-1].split("&")[0].strip()

        r2 = client.post(
            f"{API_PREFIX}/password-reset/confirm",
            json={"token": token, "new_password": "NewSecure456!"},
        )
        assert r2.status_code == 200

        # Login with new password
        r3 = client.post(
            f"{API_PREFIX}/login",
            json={"email": unique_email, "password": "NewSecure456!"},
        )
        assert r3.status_code == 200
    finally:
        db.delete(user)
        db.commit()


def test_password_reset_confirm_invalid_token_returns_400(client: TestClient):
    """POST password-reset/confirm returns 400 for invalid token."""
    response = client.post(
        f"{API_PREFIX}/password-reset/confirm",
        json={"token": "invalid-token-xyz", "new_password": "NewPass123!"},
    )
    assert response.status_code == 400
    assert "invalid" in (response.json().get("detail") or "").lower() or "expired" in (
        response.json().get("detail") or ""
    ).lower()


# ----- Me -----


def test_me_without_token_returns_403(client: TestClient):
    """GET /me without Authorization returns 403 (HTTPBearer auto_error)."""
    response = client.get(f"{API_PREFIX}/me")
    assert response.status_code == 403


def test_me_with_valid_token_returns_user(client: TestClient, db, unique_email: str):
    """GET /me with valid token returns user info."""
    user = User(
        email=unique_email,
        password_hash=AuthManager.get_password_hash("Pass"),
        first_name="Me",
        last_name="Test",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    try:
        token = AuthManager.create_access_token(data={"sub": str(user.id)})
        response = client.get(
            f"{API_PREFIX}/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("email") == unique_email
        assert data.get("first_name") == "Me"
    finally:
        db.delete(user)
        db.commit()
