"""
Unit tests for email service (SES).

Tests send_verification_email and send_password_reset_email with mocked boto3.
No real AWS/SES calls.
"""
import sys
import os
from unittest.mock import MagicMock

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Import after path setup; we will patch attributes on this module
import services.email as email_module


# ----- send_verification_email -----


def test_send_verification_email_returns_false_when_ses_from_email_unset(monkeypatch):
    """When SES_FROM_EMAIL is not set, send_verification_email returns False."""
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", None)
    assert email_module.send_verification_email("user@example.com", "123456") is False


def test_send_verification_email_calls_ses_when_configured(monkeypatch):
    """When SES_FROM_EMAIL is set, send_verification_email calls SES send_email."""
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", "noreply@test.com")
    mock_send = MagicMock()
    mock_client = MagicMock()
    mock_client.send_email = mock_send
    monkeypatch.setattr(email_module, "_get_ses_client", lambda: mock_client)
    result = email_module.send_verification_email("user@example.com", "123456")
    assert result is True
    assert mock_send.called
    call_kw = mock_send.call_args[1]
    assert call_kw["Source"] == "noreply@test.com"
    assert call_kw["Destination"]["ToAddresses"] == ["user@example.com"]
    assert "123456" in call_kw["Message"]["Body"]["Text"]["Data"]


def test_send_verification_email_returns_false_on_ses_error(monkeypatch):
    """When SES raises ClientError, send_verification_email returns False."""
    from botocore.exceptions import ClientError
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", "noreply@test.com")
    mock_client = MagicMock()
    mock_client.send_email.side_effect = ClientError(
        {"Error": {"Code": "MessageRejected"}}, "SendEmail"
    )
    monkeypatch.setattr(email_module, "_get_ses_client", lambda: mock_client)
    result = email_module.send_verification_email("user@example.com", "123456")
    assert result is False


# ----- send_password_reset_email -----


def test_send_password_reset_email_returns_false_when_ses_from_email_unset(monkeypatch):
    """When SES_FROM_EMAIL is not set, send_password_reset_email returns False."""
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", None)
    assert email_module.send_password_reset_email(
        "user@example.com", "https://app.test/reset?token=abc"
    ) is False


def test_send_password_reset_email_calls_ses_with_reset_link(monkeypatch):
    """When configured, send_password_reset_email sends email containing the reset link."""
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", "noreply@test.com")
    mock_send = MagicMock()
    mock_client = MagicMock()
    mock_client.send_email = mock_send
    monkeypatch.setattr(email_module, "_get_ses_client", lambda: mock_client)
    reset_link = "https://app.nestnavigate.com/reset-password?token=abc123"
    result = email_module.send_password_reset_email("user@example.com", reset_link)
    assert result is True
    assert mock_send.called
    call_kw = mock_send.call_args[1]
    assert call_kw["Source"] == "noreply@test.com"
    assert call_kw["Destination"]["ToAddresses"] == ["user@example.com"]
    assert "Reset your NestNavigate password" in call_kw["Message"]["Subject"]["Data"]
    assert reset_link in call_kw["Message"]["Body"]["Text"]["Data"]
    assert reset_link in call_kw["Message"]["Body"]["Html"]["Data"]


def test_send_password_reset_email_returns_false_on_ses_error(monkeypatch):
    """When SES raises ClientError, send_password_reset_email returns False."""
    from botocore.exceptions import ClientError
    monkeypatch.setattr(email_module, "SES_FROM_EMAIL", "noreply@test.com")
    mock_client = MagicMock()
    mock_client.send_email.side_effect = ClientError(
        {"Error": {"Code": "MessageRejected"}}, "SendEmail"
    )
    monkeypatch.setattr(email_module, "_get_ses_client", lambda: mock_client)
    result = email_module.send_password_reset_email(
        "user@example.com", "https://app.test/reset?token=x"
    )
    assert result is False
