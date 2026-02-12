import os
from datetime import datetime, date, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import AuthManager, create_tokens_for_user, refresh_access_token, get_current_user
from models import User, UserCoinBalance, PendingEmailVerification
from schemas import (
    UserRegistration, UserLogin, UserResponse, TokenResponse,
    PasswordReset, PasswordResetConfirm, ProfileUpdate, SuccessResponse,
    SendVerificationCodeRequest, VerifyEmailRequest,
)
from utils import NotificationManager
from services.email import send_verification_email, send_password_reset_email

router = APIRouter()

# How long after verify-email-code the user can complete register
VERIFIED_EMAIL_VALID_MINUTES = 10


@router.post("/send-verification-code", response_model=SuccessResponse)
def send_verification_code(body: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """Send a 6-digit verification code to the email (before sign-up). No user created yet."""
    email = body.email.lower().strip()
    existing_user = AuthManager.get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    code = AuthManager.generate_verification_code()
    now = datetime.now(timezone.utc)
    code_expires_at = now + timedelta(minutes=15)

    pending = db.query(PendingEmailVerification).filter(PendingEmailVerification.email == email).first()
    if pending:
        pending.code = code
        pending.code_expires_at = code_expires_at
        pending.verified_at = None
        pending.updated_at = now
    else:
        pending = PendingEmailVerification(
            email=email,
            code=code,
            code_expires_at=code_expires_at,
        )
        db.add(pending)
    db.commit()

    send_verification_email(email, code)
    return SuccessResponse(message="Verification code sent")


@router.post("/verify-email-code", response_model=SuccessResponse)
def verify_email_code(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verify the 6-digit code for an email (before sign-up). Must call register within a short window."""
    email = body.email.lower().strip()
    pending = db.query(PendingEmailVerification).filter(PendingEmailVerification.email == email).first()
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )
    now = datetime.now(timezone.utc)
    if pending.code != body.code or pending.code_expires_at <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code",
        )

    pending.verified_at = now
    pending.updated_at = now
    db.commit()

    return SuccessResponse(message="Email verified. You can now complete sign-up.")


@router.post("/resend-verification-code", response_model=SuccessResponse)
def resend_verification_code(body: SendVerificationCodeRequest, db: Session = Depends(get_db)):
    """Resend a 6-digit verification code (before sign-up). Use when the first code wasn't received or expired."""
    email = body.email.lower().strip()
    existing_user = AuthManager.get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    pending = db.query(PendingEmailVerification).filter(PendingEmailVerification.email == email).first()
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification in progress for this email. Request a code first.",
        )

    code = AuthManager.generate_verification_code()
    now = datetime.now(timezone.utc)
    code_expires_at = now + timedelta(minutes=15)
    pending.code = code
    pending.code_expires_at = code_expires_at
    pending.verified_at = None
    pending.updated_at = now
    db.commit()

    send_verification_email(email, code)
    return SuccessResponse(message="Verification code sent")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register a new user. Email must have been verified first via send-verification-code + verify-email-code."""
    email = user_data.email.lower().strip()

    # Require recent email verification (verify-before-sign-up)
    pending = db.query(PendingEmailVerification).filter(PendingEmailVerification.email == email).first()
    if not pending or pending.verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email first. Request a code, then enter it before signing up.",
        )
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=VERIFIED_EMAIL_VALID_MINUTES)
    if pending.verified_at < cutoff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email verification expired. Please request a new code and verify again.",
        )

    # Check if user already exists (e.g. they verified then someone else registered first)
    existing_user = AuthManager.get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Parse date of birth if provided
    date_of_birth = None
    if user_data.date_of_birth:
        try:
            date_of_birth = datetime.strptime(user_data.date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )

    # Create user (already verified)
    user = AuthManager.create_user(
        db=db,
        email=email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        date_of_birth=date_of_birth,
        is_verified=True,
    )

    # Create initial coin balance
    coin_balance = UserCoinBalance(user_id=user.id)
    db.add(coin_balance)

    # Consume pending verification so it can't be reused
    db.delete(pending)
    db.commit()

    # Send welcome notification
    NotificationManager.create_notification(
        db,
        user.id,
        "welcome",
        "Welcome to the Learning Platform!",
        f"Hi {user.first_name}! Welcome to your gamified learning journey. Complete your onboarding to get started.",
        "high"
    )

    tokens = create_tokens_for_user(user)
    return tokens


@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password"""
    user = AuthManager.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()
    
    # Create tokens
    tokens = create_tokens_for_user(user)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    return refresh_access_token(refresh_token, db)


@router.post("/logout", response_model=SuccessResponse)
def logout_user():
    """Logout user (client should discard tokens)"""
    return SuccessResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        date_of_birth=current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        profile_picture_url=current_user.profile_picture_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at
    )


@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information"""
    # Update fields if provided
    if profile_data.first_name is not None:
        current_user.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        current_user.last_name = profile_data.last_name
    if profile_data.phone is not None:
        current_user.phone = profile_data.phone
    if profile_data.profile_picture_url is not None:
        current_user.profile_picture_url = profile_data.profile_picture_url
    
    if profile_data.date_of_birth is not None:
        try:
            current_user.date_of_birth = datetime.strptime(profile_data.date_of_birth, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        date_of_birth=current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,
        profile_picture_url=current_user.profile_picture_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        last_login_at=current_user.last_login_at,
        created_at=current_user.created_at
    )


@router.post("/password-reset", response_model=SuccessResponse)
def request_password_reset(request: PasswordReset, db: Session = Depends(get_db)):
    """Request password reset"""
    user = AuthManager.get_user_by_email(db, request.email)
    if not user:
        # Don't reveal if email exists or not
        return SuccessResponse(message="If the email exists, a password reset link has been sent")
    
    # Generate reset token
    reset_token = AuthManager.generate_password_reset_token()
    user.password_reset_token = reset_token
    now = datetime.now(timezone.utc)
    user.password_reset_expires_at = now + timedelta(hours=1)  # 1 hour expiry
    db.commit()

    # Send password reset email (same SES as verification; don't reveal outcome)
    frontend_url = os.getenv("FRONTEND_URL", "https://app.nestnavigate.com").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    send_password_reset_email(user.email, reset_link)

    return SuccessResponse(message="If the email exists, a password reset link has been sent")


@router.post("/password-reset/confirm", response_model=SuccessResponse)
def confirm_password_reset(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirm password reset with token"""
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(
        User.password_reset_token == request.token,
        User.password_reset_expires_at > now
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Update password
    user.password_hash = AuthManager.get_password_hash(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    user.updated_at = now
    db.commit()
    
    return SuccessResponse(message="Password reset successfully")
