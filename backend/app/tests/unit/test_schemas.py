"""
Unit tests for Pydantic schemas.

Tests validation, defaults, and serialization for key request/response schemas.
"""
import sys
import os
from uuid import uuid4

import pytest
from pydantic import ValidationError

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from schemas import (
    UserRegistration,
    UserLogin,
    TokenResponse,
    PasswordReset,
    PasswordResetConfirm,
    SuccessResponse,
)


# ----- UserRegistration -----


def test_user_registration_valid():
    data = {
        "email": "user@example.com",
        "password": "SecurePass123!",
        "first_name": "Jane",
        "last_name": "Doe",
    }
    obj = UserRegistration(**data)
    assert obj.email == "user@example.com"
    assert obj.password == "SecurePass123!"
    assert obj.first_name == "Jane"
    assert obj.last_name == "Doe"
    assert obj.phone is None
    assert obj.date_of_birth is None


def test_user_registration_invalid_email():
    with pytest.raises(ValidationError):
        UserRegistration(
            email="not-an-email",
            password="SecurePass123!",
            first_name="A",
            last_name="B",
        )


def test_user_registration_short_password():
    with pytest.raises(ValidationError):
        UserRegistration(
            email="a@b.com",
            password="short",
            first_name="A",
            last_name="B",
        )


def test_user_registration_optional_fields():
    obj = UserRegistration(
        email="a@b.com",
        password="LongEnough1!",
        first_name="A",
        last_name="B",
        phone="1234567890",
        date_of_birth="1990-01-01",
    )
    assert obj.phone == "1234567890"
    assert obj.date_of_birth == "1990-01-01"


# ----- UserLogin -----


def test_user_login_valid():
    obj = UserLogin(email="user@example.com", password="any")
    assert obj.email == "user@example.com"
    assert obj.password == "any"


def test_user_login_invalid_email():
    with pytest.raises(ValidationError):
        UserLogin(email="invalid", password="x")


# ----- TokenResponse -----


def test_token_response_defaults():
    obj = TokenResponse(
        access_token="abc",
        refresh_token="def",
        expires_in=3600,
    )
    assert obj.access_token == "abc"
    assert obj.refresh_token == "def"
    assert obj.token_type == "bearer"
    assert obj.expires_in == 3600


def test_token_response_explicit_type():
    obj = TokenResponse(
        access_token="a",
        refresh_token="b",
        token_type="bearer",
        expires_in=3600,
    )
    assert obj.token_type == "bearer"
    assert obj.expires_in == 3600


# ----- PasswordReset -----


def test_password_reset_valid():
    obj = PasswordReset(email="user@example.com")
    assert obj.email == "user@example.com"


# ----- PasswordResetConfirm -----


def test_password_reset_confirm_valid():
    obj = PasswordResetConfirm(token="reset-token-here", new_password="NewSecure123!")
    assert obj.token == "reset-token-here"
    assert obj.new_password == "NewSecure123!"


def test_password_reset_confirm_short_password():
    with pytest.raises(ValidationError):
        PasswordResetConfirm(token="t", new_password="short")


# MiniGame* schemas: add tests when those schemas exist (e.g. after module-quiz merge)


# ----- SuccessResponse -----


def test_success_response_defaults():
    obj = SuccessResponse(message="Done")
    assert obj.success is True
    assert obj.message == "Done"
