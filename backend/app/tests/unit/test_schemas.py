"""
Unit tests for Pydantic schemas.

Tests validation, defaults, and serialization for key request/response schemas.
"""
import sys
import os
from datetime import datetime
from decimal import Decimal
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
    SendVerificationCodeRequest,
    VerifyEmailRequest,
    OnboardingStep1,
    OnboardingStep2,
    OnboardingStep3,
    OnboardingStep4,
    OnboardingComplete,
    LessonResponse,
    CitySearchRequest,
    CityData,
    CitySearchResponse,
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


# ----- SendVerificationCodeRequest -----


def test_send_verification_code_request_valid():
    obj = SendVerificationCodeRequest(email="user@example.com")
    assert obj.email == "user@example.com"


def test_send_verification_code_request_invalid_email():
    with pytest.raises(ValidationError):
        SendVerificationCodeRequest(email="not-an-email")


# ----- VerifyEmailRequest -----


def test_verify_email_request_valid():
    obj = VerifyEmailRequest(email="user@example.com", code="123456")
    assert obj.email == "user@example.com"
    assert obj.code == "123456"


def test_verify_email_request_code_too_short():
    with pytest.raises(ValidationError):
        VerifyEmailRequest(email="user@example.com", code="12345")


def test_verify_email_request_code_non_digit():
    with pytest.raises(ValidationError):
        VerifyEmailRequest(email="user@example.com", code="12345a")


# ----- OnboardingStep1 -----


def test_onboarding_step1_valid():
    obj = OnboardingStep1(has_realtor="Yes, I am", has_loan_officer="Not yet")
    assert obj.has_realtor == "Yes, I am"
    assert obj.has_loan_officer == "Not yet"


def test_onboarding_step1_invalid_option():
    with pytest.raises(ValidationError):
        OnboardingStep1(has_realtor="Maybe", has_loan_officer="Not yet")


# ----- OnboardingStep2 -----


def test_onboarding_step2_valid():
    obj = OnboardingStep2(wants_expert_contact="Maybe later")
    assert obj.wants_expert_contact == "Maybe later"


# ----- OnboardingStep3 -----


def test_onboarding_step3_valid():
    obj = OnboardingStep3(homeownership_timeline_months=12)
    assert obj.homeownership_timeline_months == 12


def test_onboarding_step3_out_of_range():
    with pytest.raises(ValidationError):
        OnboardingStep3(homeownership_timeline_months=0)
    with pytest.raises(ValidationError):
        OnboardingStep3(homeownership_timeline_months=121)


# ----- OnboardingStep4 -----


def test_onboarding_step4_valid():
    obj = OnboardingStep4(target_cities=["New York", "Los Angeles"])
    assert obj.target_cities == ["New York", "Los Angeles"]


def test_onboarding_step4_empty_cities_rejected():
    with pytest.raises(ValidationError):
        OnboardingStep4(target_cities=[])


def test_onboarding_step4_sanitizes_whitespace():
    obj = OnboardingStep4(target_cities=["  Chicago  ", " Boston "])
    assert obj.target_cities == ["Chicago", "Boston"]


# ----- OnboardingComplete -----


def test_onboarding_complete_valid():
    obj = OnboardingComplete(
        has_realtor="Yes, I am",
        has_loan_officer="Not yet",
        wants_expert_contact="Maybe later",
        homeownership_timeline_months=6,
        target_cities=["Austin"],
    )
    assert obj.target_cities == ["Austin"]


# ----- LessonResponse (optional fields) -----


def test_lesson_response_accepts_optional_none():
    """LessonResponse allows lesson_summary and other optional fields to be None."""
    uid = uuid4()
    mid = uuid4()
    now = datetime.utcnow()
    obj = LessonResponse(
        id=uid,
        module_id=mid,
        title="Test Lesson",
        order_index=0,
        is_active=True,
        nest_coins_reward=10,
        created_at=now,
        description=None,
        lesson_summary=None,
        image_url=None,
        video_url=None,
        video_transcription=None,
        estimated_duration_minutes=None,
    )
    assert obj.lesson_summary is None
    assert obj.description is None


# ----- CitySearchRequest / CityData / CitySearchResponse -----


def test_city_search_request_valid():
    obj = CitySearchRequest(query="san fran")
    assert obj.query == "san fran"


def test_city_search_request_too_short():
    with pytest.raises(ValidationError):
        CitySearchRequest(query="s")


def test_city_data_valid():
    obj = CityData(city="Los Angeles", state="CA", zipcode="90001")
    assert obj.city == "Los Angeles"
    assert obj.state == "CA"
    assert obj.zipcode == "90001"


def test_city_search_response_valid():
    obj = CitySearchResponse(cities=[CityData(city="LA", state="CA", zipcode="90001")])
    assert len(obj.cities) == 1
    assert obj.cities[0].city == "LA"


# ----- SuccessResponse -----


def test_success_response_defaults():
    obj = SuccessResponse(message="Done")
    assert obj.success is True
    assert obj.message == "Done"


def test_success_response_with_data():
    obj = SuccessResponse(message="OK", data={"id": "123"})
    assert obj.data == {"id": "123"}
