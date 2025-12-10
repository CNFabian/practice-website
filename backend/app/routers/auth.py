from datetime import datetime, date, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import AuthManager, create_tokens_for_user, refresh_access_token, get_current_user
from models import User, UserCoinBalance
from schemas import (
    UserRegistration, UserLogin, UserResponse, TokenResponse,
    PasswordReset, PasswordResetConfirm, ProfileUpdate, SuccessResponse
)
from utils import NotificationManager

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = AuthManager.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
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
    
    # Create user
    user = AuthManager.create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        date_of_birth=date_of_birth
    )
    
    # Create initial coin balance
    coin_balance = UserCoinBalance(user_id=user.id)
    db.add(coin_balance)
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
    
    # Create tokens
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
    user.last_login_at = datetime.now()
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
    
    current_user.updated_at = datetime.now()
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
    user.password_reset_expires_at = datetime.now() + timedelta(hours=1)  # 1 hour expiry
    db.commit()
    
    # TODO: Send email with reset token
    # For now, we'll just return success
    
    return SuccessResponse(message="If the email exists, a password reset link has been sent")


@router.post("/password-reset/confirm", response_model=SuccessResponse)
def confirm_password_reset(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Confirm password reset with token"""
    user = db.query(User).filter(
        User.password_reset_token == request.token,
        User.password_reset_expires_at > datetime.now()
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
    user.updated_at = datetime.now()
    db.commit()
    
    return SuccessResponse(message="Password reset successfully")


@router.post("/verify-email", response_model=SuccessResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify user email with token"""
    user = db.query(User).filter(User.email_verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    user.is_verified = True
    user.email_verification_token = None
    user.updated_at = datetime.now()
    db.commit()
    
    return SuccessResponse(message="Email verified successfully")


@router.post("/resend-verification", response_model=SuccessResponse)
def resend_verification_email(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resend email verification"""
    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new verification token
    verification_token = AuthManager.generate_verification_token()
    current_user.email_verification_token = verification_token
    current_user.updated_at = datetime.now()
    db.commit()
    
    # TODO: Send verification email
    
    return SuccessResponse(message="Verification email sent")
