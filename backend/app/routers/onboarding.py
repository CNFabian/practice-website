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
    OnboardingComplete,
    OnboardingResponse,
    SuccessResponse,
    OnboardingStatusPayload,
)
from utils import OnboardingManager
from analytics.event_tracker import EventTracker

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
        return {"completed": False, "step": 1, "total_steps": 4, "data": None}

    # Determine current step based on completed fields
    step = 1
    if onboarding.has_realtor is not None and onboarding.has_loan_officer is not None:
        step = 2
    if onboarding.wants_expert_contact:
        step = 3
    if onboarding.homeownership_timeline_months is not None:
        step = 4
    if onboarding.target_cities and len(onboarding.target_cities) > 0:
        step = 5  # Completed

    is_completed = OnboardingManager.is_onboarding_complete(db, current_user.id)

    return {
        "completed": is_completed,
        "step": step if not is_completed else 5,
        "total_steps": 4,
        "data": {
            "has_realtor": onboarding.has_realtor,
            "has_loan_officer": onboarding.has_loan_officer,
            "wants_expert_contact": onboarding.wants_expert_contact,
            "homeownership_timeline_months": onboarding.homeownership_timeline_months,
            "target_cities": onboarding.target_cities,
        },
    }


@router.post("/step1", response_model=SuccessResponse)
def complete_step1_professionals(
    step_data: OnboardingStep1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 1: Realtor and loan officer status"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    # Convert string responses to boolean
    onboarding.has_realtor = (step_data.has_realtor == "Yes, I am")
    onboarding.has_loan_officer = (step_data.has_loan_officer == "Yes, I am")
    onboarding.updated_at = datetime.now()

    db.commit()
    
    # Track professional status update
    EventTracker.track_professional_status_updated(
        db, current_user.id, onboarding.has_realtor, onboarding.has_loan_officer
    )

    return SuccessResponse(message="Professional status updated successfully")


@router.post("/step2", response_model=SuccessResponse)
def complete_step2_expert_contact(
    step_data: OnboardingStep2,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 2: Expert contact preference"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if onboarding.has_realtor is None or onboarding.has_loan_officer is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete step 1 first",
        )

    onboarding.wants_expert_contact = step_data.wants_expert_contact
    onboarding.updated_at = datetime.now()

    db.commit()
    
    # Track expert contact request
    if step_data.wants_expert_contact == "Yes, I'd love to":
        EventTracker.track_expert_contact_requested(db, current_user.id, "onboarding")

    return SuccessResponse(message="Expert contact preference set successfully")


@router.post("/step3", response_model=SuccessResponse)
def complete_step3_timeline(
    step_data: OnboardingStep3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 3: Homeownership timeline"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if (
        onboarding.has_realtor is None
        or onboarding.has_loan_officer is None
        or not onboarding.wants_expert_contact
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete previous steps first",
        )

    old_timeline = onboarding.homeownership_timeline_months
    onboarding.homeownership_timeline_months = step_data.homeownership_timeline_months
    onboarding.updated_at = datetime.now()

    db.commit()
    
    # Track timeline update
    EventTracker.track_timeline_updated(db, current_user.id, old_timeline, step_data.homeownership_timeline_months)

    return SuccessResponse(message="Homeownership timeline set successfully")


@router.post("/step4", response_model=SuccessResponse)
def complete_step4_cities(
    step_data: OnboardingStep4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Complete step 4: Target cities for future home"""
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    if (
        onboarding.has_realtor is None
        or onboarding.has_loan_officer is None
        or not onboarding.wants_expert_contact
        or onboarding.homeownership_timeline_months is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete previous steps first",
        )

    onboarding.target_cities = step_data.target_cities
    onboarding.updated_at = datetime.now()
    
    # Track location provided
    EventTracker.track_location_provided(db, current_user.id, ", ".join(step_data.target_cities))

    # Mark onboarding as complete and award welcome bonus
    completed_onboarding = OnboardingManager.complete_onboarding(db, current_user.id)
    is_completed = bool(completed_onboarding.completed_at)
    step = 5 if is_completed else 4
    
    # Track onboarding completion
    if is_completed:
        EventTracker.track_onboarding_completed(db, current_user.id)

    payload = OnboardingStatusPayload(
        user_id=current_user.id,
        completed=is_completed,
        step=step,
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        target_cities=onboarding.target_cities,
        completed_at=completed_onboarding.completed_at,
    )

    return SuccessResponse(
        message=(
            "Onboarding completed successfully! Welcome bonus awarded."
            if is_completed
            else "Step 4 saved."
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
    onboarding = OnboardingManager.get_or_create_onboarding(db, current_user.id)

    # Update all fields
    onboarding.has_realtor = (onboarding_data.has_realtor == "Yes, I am")
    onboarding.has_loan_officer = (onboarding_data.has_loan_officer == "Yes, I am")
    onboarding.wants_expert_contact = onboarding_data.wants_expert_contact
    onboarding.homeownership_timeline_months = onboarding_data.homeownership_timeline_months
    onboarding.target_cities = onboarding_data.target_cities
    onboarding.updated_at = datetime.now()
    
    # Commit the field updates first
    db.commit()

    # Mark as complete and award welcome bonus
    completed_onboarding = OnboardingManager.complete_onboarding(db, current_user.id)
    is_completed = bool(completed_onboarding.completed_at)
    step = 5 if is_completed else 4

    payload = OnboardingStatusPayload(
        user_id=current_user.id,
        completed=is_completed,
        step=step,
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        target_cities=onboarding.target_cities,
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
        has_realtor=onboarding.has_realtor,
        has_loan_officer=onboarding.has_loan_officer,
        wants_expert_contact=onboarding.wants_expert_contact,
        homeownership_timeline_months=onboarding.homeownership_timeline_months,
        target_cities=onboarding.target_cities,
        completed_at=onboarding.completed_at,
        updated_at=onboarding.updated_at,
    )


@router.get("/options")
def get_onboarding_options():
    """Get available options for onboarding steps"""
    return {
        "professional_status_options": [
            {"id": "Yes, I am", "label": "Yes, I am"},
            {"id": "Not yet", "label": "Not yet"},
        ],
        "expert_contact_options": [
            {"id": "Yes, I'd love to", "label": "Yes, I'd love to"},
            {"id": "Maybe later", "label": "Maybe later"},
        ],
        "timeline_options": [
            {"months": 3, "label": "0-3 months"},
            {"months": 6, "label": "3-6 months"},
            {"months": 12, "label": "6-12 months"},
            {"months": 24, "label": "1-2 years"},
            {"months": 36, "label": "2+ years"},
            {"months": 120, "label": "Just learning for now"},
        ],
        "cities_info": {
            "min_cities": 1,
            "max_cities": 10,
            "description": "Select cities you're interested in for your future home",
        },
    }
