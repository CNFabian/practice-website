"""
Unit tests for auth module (AuthManager).

Tests password hashing/verification, JWT creation/verification, and token helpers
without database (except where noted).
"""
import sys
import os
from uuid import uuid4
from datetime import timedelta

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi import HTTPException
from auth import AuthManager


# ----- Password -----


def test_get_password_hash_returns_non_empty_string():
    h = AuthManager.get_password_hash("mypassword123")
    assert isinstance(h, str)
    assert len(h) > 0
    assert h != "mypassword123"


def test_verify_password_success():
    plain = "SecurePass123!"
    hashed = AuthManager.get_password_hash(plain)
    assert AuthManager.verify_password(plain, hashed) is True


def test_verify_password_failure_wrong_password():
    hashed = AuthManager.get_password_hash("correct")
    assert AuthManager.verify_password("wrong", hashed) is False


def test_verify_password_failure_empty():
    hashed = AuthManager.get_password_hash("something")
    assert AuthManager.verify_password("", hashed) is False


# ----- Access token -----


def test_create_access_token_returns_string():
    token = AuthManager.create_access_token(data={"sub": str(uuid4())})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_contains_sub_and_token_type():
    user_id = uuid4()
    token = AuthManager.create_access_token(data={"sub": str(user_id)})
    payload = AuthManager.verify_token(token)
    assert payload.get("sub") == str(user_id)
    assert payload.get("token_type") == "access"
    assert "exp" in payload


def test_verify_token_valid_token():
    user_id = uuid4()
    token = AuthManager.create_access_token(data={"sub": str(user_id)})
    payload = AuthManager.verify_token(token)
    assert payload["sub"] == str(user_id)


def test_verify_token_invalid_raises():
    with pytest.raises(HTTPException) as exc_info:
        AuthManager.verify_token("invalid.jwt.token")
    assert exc_info.value.status_code == 401
    assert "credentials" in (exc_info.value.detail or "").lower()


def test_verify_token_empty_raises():
    with pytest.raises(HTTPException):
        AuthManager.verify_token("")


# ----- Refresh token -----


def test_create_refresh_token_returns_string():
    token = AuthManager.create_refresh_token(data={"sub": str(uuid4())})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_refresh_token_has_refresh_type():
    token = AuthManager.create_refresh_token(data={"sub": str(uuid4())})
    payload = AuthManager.verify_token(token)
    assert payload.get("token_type") == "refresh"


# ----- Token helpers -----


def test_generate_verification_token_length():
    t = AuthManager.generate_verification_token()
    assert isinstance(t, str)
    assert len(t) == 32
    assert t.isalnum()


def test_generate_verification_code_six_digits():
    """Verification code for email is 6 numeric digits."""
    code = AuthManager.generate_verification_code()
    assert isinstance(code, str)
    assert len(code) == 6
    assert code.isdigit()


def test_generate_password_reset_token_length():
    t = AuthManager.generate_password_reset_token()
    assert isinstance(t, str)
    assert len(t) == 32
    assert t.isalnum()


def test_create_access_token_with_expires_delta():
    user_id = uuid4()
    token = AuthManager.create_access_token(
        data={"sub": str(user_id)},
        expires_delta=timedelta(minutes=5),
    )
    payload = AuthManager.verify_token(token)
    assert payload.get("sub") == str(user_id)
