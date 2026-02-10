"""Email sending via Amazon SES."""
import logging
import os

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

SES_FROM_EMAIL = os.getenv("SES_FROM_EMAIL")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# Lazy client so env/credentials can be set after import
_ses_client = None


def _get_ses_client():
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client("ses", region_name=AWS_REGION)
    return _ses_client


def send_verification_email(to_email: str, code: str) -> bool:
    """
    Send a 6-digit verification code email via SES.
    Returns True on success, False on failure (logs exception).
    """
    if not SES_FROM_EMAIL:
        logger.warning("SES_FROM_EMAIL not set; skipping verification email")
        return False

    subject = "Your verification code"
    body_text = f"Your verification code is: {code}\n\nIt expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email."
    body_html = (
        f"<p>Your verification code is: <strong>{code}</strong></p>"
        f"<p>It expires in 15 minutes.</p>"
        "<p>If you didn't request this, you can ignore this email.</p>"
    )

    try:
        client = _get_ses_client()
        client.send_email(
            Source=SES_FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": body_text, "Charset": "UTF-8"},
                    "Html": {"Data": body_html, "Charset": "UTF-8"},
                },
            },
        )
        logger.info("Verification email sent to %s", to_email)
        return True
    except ClientError as e:
        logger.exception("SES send_email failed for %s: %s", to_email, e)
        return False
