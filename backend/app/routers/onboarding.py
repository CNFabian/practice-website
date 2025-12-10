from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
from models import User, UserOnboarding
from schemas import (
    OnboardingStep1,
    OnboardingStep2,
    OnboardingStep3,
    OnboardingStep4,
    OnboardingStep5,
    OnboardingComplete,
    OnboardingResponse,
    SuccessResponse,
    OnboardingStatusPayload,
)
from utils import OnboardingManager

router = APIRouter()


@router.get("/status", response_model=dict)
def get_onboarding_status(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get user's onboarding completion status"""
    onboarding = (
        db.query(UserOnboarding)
        .filter(UserOnboarding.user_id == current_user.id)
        .first()
    )

    if not onboarding:
        return {"completed": False, "step": 1, "total_steps": 5, "data": None}

    # Determine current step based on completed fields for new 5-step flow
    step = 1
    if onboarding.selected_avatar:
        step = 2
    if onboarding.has_realtor is not None and onboarding.has_loan_officer is not None:
        step = 3
    if onboarding.wants_expert_contact:
        step = 4
    if onboarding.homeownership_timeline_months is not None:
        step = 5
    if onboarding.zipcode:
        step = 6  # Completed

    is_completed = OnboardingManager.is_onboarding_complete(db, current_user.id)

    return {
        "completed": is_completed,
        "step": step if not is_completed else 6,
        "total_steps": 5,
        "data": {
            "selected_avatar": onboarding.selected_avatar,
            "has_realtor": onboarding.has_realtor,
            "has_loan_officer": onboarding.has_loan_officer,
            "wants_expert_contact": onboarding.wants_expert_contact,
            "homeownership_timeline_months": onboarding.homeownership_timeline_months,
            "zipcode": onboarding.zipcode,
        },
    }


@router.post("/step1", response_model=SuccessResponse)
def complete_step1_avatar(
    step_data: OnboardingStep1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 1: Avatar selection"""
    # Validate avatar selection
    valid_avatars = ["avatar_1", "avatar_2", "avatar_3", "avatar_4", "avatar_5"]
    if step_data.selected_avatar not in valid_avatars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid avatar selection"
        )

    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    onboarding.selected_avatar = step_data.selected_avatar
    onboarding.updated_at = datetime.now()

    db.commit()

    return SuccessResponse(message="Avatar selected successfully")


@router.post("/step2", response_model=SuccessResponse)
def complete_step2_professionals(
    step_data: OnboardingStep2,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 2: Realtor and loan officer status"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if not onboarding.selected_avatar:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete step 1 first",
        )

    onboarding.has_realtor = step_data.has_realtor
    onboarding.has_loan_officer = step_data.has_loan_officer
    onboarding.updated_at = datetime.now()

    db.commit()

    return SuccessResponse(message="Professional status updated successfully")


@router.post("/step3", response_model=SuccessResponse)
def complete_step3_expert_contact(
    step_data: OnboardingStep3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 3: Expert contact preference"""
    # Validate expert contact preference
    valid_options = ["Yes", "Maybe later"]
    if step_data.wants_expert_contact not in valid_options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid expert contact preference",
        )

    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if (
        not onboarding.selected_avatar
        or onboarding.has_realtor is None
        or onboarding.has_loan_officer is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete previous steps first",
        )

    onboarding.wants_expert_contact = step_data.wants_expert_contact
    onboarding.updated_at = datetime.now()

    db.commit()

    return SuccessResponse(message="Expert contact preference set successfully")


@router.post("/step4", response_model=SuccessResponse)
def complete_step4_timeline(
    step_data: OnboardingStep4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 4: Homeownership timeline"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if (
        not onboarding.selected_avatar
        or onboarding.has_realtor is None
        or onboarding.has_loan_officer is None
        or not onboarding.wants_expert_contact
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete previous steps first",
        )

    onboarding.homeownership_timeline_months = step_data.homeownership_timeline_months
    onboarding.updated_at = datetime.now()

    db.commit()

    return SuccessResponse(message="Homeownership timeline set successfully")


@router.post("/step5", response_model=SuccessResponse)
def complete_step5_zipcode(
    step_data: OnboardingStep5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 5: Future home location (zipcode)"""
    # Additional zipcode validation for security
    import re

    zipcode_pattern = re.compile(r"^[0-9]{5}(-[0-9]{4})?$")
    if not zipcode_pattern.match(step_data.zipcode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid zipcode format. Please use 5-digit or 5+4 format.",
        )

    # Sanitize zipcode (remove any potential harmful characters)
    sanitized_zipcode = re.sub(r"[^0-9-]", "", step_data.zipcode)

    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if (
        not onboarding.selected_avatar
        or onboarding.has_realtor is None
        or onboarding.has_loan_officer is None
        or not onboarding.wants_expert_contact
        or onboarding.homeownership_timeline_months is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete previous steps first",
        )

    onboarding.zipcode = sanitized_zipcode
    onboarding.updated_at = datetime.now()

    # Mark onboarding as complete and award welcome bonus
    completed_onboarding = OnboardingManager.complete_onboarding(db, current_user.id)
    is_completed = bool(completed_onboarding.completed_at)
    step = 6 if is_completed else 5

    payload = OnboardingStatusPayload(
        user_id=current_user.id,
        completed=is_completed,
        step=step,
        selected_avatar=onboarding.selected_avatar,
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        zipcode=onboarding.zipcode,
        completed_at=completed_onboarding.completed_at,
    )

    return SuccessResponse(
        message=(
            "Onboarding completed successfully! Welcome bonus awarded."
            if is_completed
            else "Step 5 saved."
        ),
        data=payload.model_dump(mode="json"),
    )


@router.post("/complete", response_model=SuccessResponse)
def complete_onboarding_all_at_once(
    onboarding_data: OnboardingComplete,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete all onboarding steps at once"""
    # Validate all inputs for security
    valid_avatars = ["avatar_1", "avatar_2", "avatar_3", "avatar_4", "avatar_5"]
    if onboarding_data.selected_avatar not in valid_avatars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid avatar selection"
        )

    valid_expert_options = ["Yes", "Maybe later"]
    if onboarding_data.wants_expert_contact not in valid_expert_options:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid expert contact preference",
        )

    # Validate zipcode
    import re

    zipcode_pattern = re.compile(r"^[0-9]{5}(-[0-9]{4})?$")
    if not zipcode_pattern.match(onboarding_data.zipcode):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid zipcode format. Please use 5-digit or 5+4 format.",
        )

    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    # Update all fields for new 5-step flow
    onboarding.selected_avatar = onboarding_data.selected_avatar
    onboarding.has_realtor = onboarding_data.has_realtor
    onboarding.has_loan_officer = onboarding_data.has_loan_officer
    onboarding.wants_expert_contact = onboarding_data.wants_expert_contact
    onboarding.homeownership_timeline_months = (
        onboarding_data.homeownership_timeline_months
    )
    onboarding.zipcode = re.sub(r"[^0-9-]", "", onboarding_data.zipcode)  # Sanitize
    onboarding.updated_at = datetime.now()
    
    # Commit the field updates first
    db.commit()

    # Mark as complete and award welcome bonus
    completed_onboarding = OnboardingManager.complete_onboarding(db, current_user.id)
    is_completed = bool(completed_onboarding.completed_at)
    step = 6 if is_completed else 5

    payload = OnboardingStatusPayload(
        user_id=current_user.id,
        completed=is_completed,
        step=step,
        selected_avatar=onboarding.selected_avatar,
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        zipcode=onboarding.zipcode,
        completed_at=completed_onboarding.completed_at,
    )

    return SuccessResponse(
        message="Onboarding completed successfully! Welcome bonus awarded.",
        data=payload.model_dump(mode="json"),
    )


@router.get("/data", response_model=OnboardingResponse)
def get_onboarding_data(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get user's onboarding data"""
    onboarding = (
        db.query(UserOnboarding)
        .filter(UserOnboarding.user_id == current_user.id)
        .first()
    )

    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding data not found"
        )

    return OnboardingResponse(
        id=onboarding.id,
        user_id=onboarding.user_id,
        selected_avatar=onboarding.selected_avatar,
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        zipcode=onboarding.zipcode,
        completed_at=onboarding.completed_at,
        updated_at=onboarding.updated_at,
    )


@router.get("/options")
def get_onboarding_options():
    """Get available options for onboarding steps"""
    return {
        "avatars": [
            {
                "id": "avatar_1",
                "name": "Professional",
                "image_url": "/avatars/professional.png",
            },
            {"id": "avatar_2", "name": "Student", "image_url": "/avatars/student.png"},
            {"id": "avatar_3", "name": "Family", "image_url": "/avatars/family.png"},
            {
                "id": "avatar_4",
                "name": "Young Professional",
                "image_url": "/avatars/young-professional.png",
            },
            {
                "id": "avatar_5",
                "name": "Entrepreneur",
                "image_url": "/avatars/entrepreneur.png",
            },
        ],
        "expert_contact_options": [
            {
                "id": "Yes",
                "name": "Yes",
                "description": "I would like to get in contact with an expert",
            },
            {
                "id": "Maybe later",
                "name": "Maybe later",
                "description": "I might be interested in expert contact later",
            },
        ],
        "timeline_options": [
            {"months": 3, "label": "0-3 months"},
            {"months": 6, "label": "3-6 months"},
            {"months": 12, "label": "6-12 months"},
            {"months": 24, "label": "1-2 years"},
            {"months": 36, "label": "2+ years"},
            {"months": 120, "label": "Just learning for now"},
        ],
        "zipcode_validation": {
            "pattern": "^[0-9]{5}(-[0-9]{4})?$",
            "description": "Enter a valid US zipcode (5 digits or 5+4 format)",
        },
    }
