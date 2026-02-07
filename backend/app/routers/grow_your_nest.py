from datetime import datetime
from typing import List, Dict, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from auth import get_current_user
from models import (
    User, Module, Lesson, UserModuleProgress, UserLessonProgress,
    QuizQuestion, QuizAnswer
)
from schemas import SuccessResponse
from utils import CoinManager, NotificationManager

router = APIRouter()

# ================================
# CONSTANTS
# ================================

TREE_TOTAL_STAGES = 5
POINTS_PER_STAGE = 50
WATER_POINTS = 10
FERTILIZER_POINTS = 20
MAX_COINS_PER_TREE = 250


# ================================
# HELPER FUNCTIONS
# ================================

def calculate_tree_stage(growth_points: int) -> int:
    """Calculate current tree stage based on growth points"""
    stage = growth_points // POINTS_PER_STAGE
    return min(stage, TREE_TOTAL_STAGES)


def is_tree_complete(growth_points: int) -> bool:
    """Check if tree is fully grown"""
    return growth_points >= (TREE_TOTAL_STAGES * POINTS_PER_STAGE)


def get_or_create_module_progress(db: Session, user_id: UUID, module_id: UUID) -> UserModuleProgress:
    """Get or create module progress record"""
    progress = db.query(UserModuleProgress).filter(
        and_(
            UserModuleProgress.user_id == user_id,
            UserModuleProgress.module_id == module_id
        )
    ).first()
    
    if not progress:
        # Count total lessons in module
        total_lessons = db.query(Lesson).filter(
            and_(Lesson.module_id == module_id, Lesson.is_active == True)
        ).count()
        
        progress = UserModuleProgress(
            user_id=user_id,
            module_id=module_id,
            total_lessons=total_lessons,
            first_started_at=datetime.now()
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return progress


# ================================
# LESSON MODE ENDPOINTS
# ================================

@router.get("/lesson/{lesson_id}/questions")
def get_lesson_questions(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Grow Your Nest questions for a specific lesson (3 questions).
    Only available once per lesson, after video is completed.
    """
    
    # Verify lesson exists
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == lesson_id, Lesson.is_active == True)
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if lesson video is completed
    lesson_progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id,
            UserLessonProgress.status == "completed"
        )
    ).first()
    
    if not lesson_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete the lesson video first"
        )
    
    # Check if Grow Your Nest was already played for this lesson
    if lesson_progress.quiz_attempts > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Grow Your Nest has already been played for this lesson. Complete all lessons to unlock free roam mode."
        )
    
    # Get 3 questions for this lesson
    questions = db.query(QuizQuestion).filter(
        and_(
            QuizQuestion.lesson_id == lesson_id,
            QuizQuestion.is_active == True
        )
    ).order_by(QuizQuestion.order_index).limit(3).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions available for this lesson"
        )
    
    # Get current tree state for this module
    module_progress = get_or_create_module_progress(db, current_user.id, lesson.module_id)
    
    # Build response
    question_list = []
    for question in questions:
        answers = db.query(QuizAnswer).filter(
            QuizAnswer.question_id == question.id
        ).order_by(QuizAnswer.order_index).all()
        
        question_list.append({
            "id": str(question.id),
            "lesson_id": str(question.lesson_id),
            "question_text": question.question_text,
            "question_type": question.question_type,
            "explanation": question.explanation,
            "order_index": question.order_index,
            "answers": [
                {
                    "id": str(answer.id),
                    "question_id": str(answer.question_id),
                    "answer_text": answer.answer_text,
                    "order_index": answer.order_index
                }
                for answer in answers
            ]
        })
    
    return {
        "questions": question_list,
        "tree_state": {
            "growth_points": module_progress.tree_growth_points,
            "current_stage": module_progress.tree_current_stage,
            "total_stages": TREE_TOTAL_STAGES,
            "points_per_stage": POINTS_PER_STAGE,
            "completed": module_progress.tree_completed
        }
    }


@router.post("/lesson/{lesson_id}/submit")
def submit_lesson_game(
    lesson_id: UUID,
    submission: Dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit Grow Your Nest lesson results (all 3 questions at once).
    
    Expected submission format:
    {
        "answers": [
            {"question_id": "uuid", "answer_id": "uuid", "is_correct": true},
            {"question_id": "uuid", "answer_id": "uuid", "is_correct": false},
            {"question_id": "uuid", "answer_id": "uuid", "is_correct": true}
        ],
        "consecutive_correct": 2
    }
    """
    
    # Verify lesson exists
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == lesson_id, Lesson.is_active == True)
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Check if lesson video is completed
    lesson_progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id,
            UserLessonProgress.status == "completed"
        )
    ).first()
    
    if not lesson_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete the lesson video first"
        )
    
    # Check if already played
    if lesson_progress.quiz_attempts > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Grow Your Nest has already been played for this lesson"
        )
    
    # Process answers
    answers = submission.get("answers", [])
    correct_count = sum(1 for a in answers if a.get("is_correct", False))
    total_questions = len(answers)
    
    # Calculate growth points
    # Each correct answer = 1 Water = 10 points
    growth_points_earned = correct_count * WATER_POINTS
    
    # Fertilizer bonus for 3 consecutive correct
    consecutive_correct = submission.get("consecutive_correct", 0)
    fertilizer_bonus = (consecutive_correct // 3) * FERTILIZER_POINTS
    growth_points_earned += fertilizer_bonus
    
    # Cap at 50 points per lesson session (3 correct + 1 fertilizer = 50 max)
    growth_points_earned = min(growth_points_earned, 50)
    
    # Update module progress (tree state)
    module_progress = get_or_create_module_progress(db, current_user.id, lesson.module_id)
    
    old_stage = module_progress.tree_current_stage
    module_progress.tree_growth_points += growth_points_earned
    module_progress.tree_current_stage = calculate_tree_stage(module_progress.tree_growth_points)
    new_stage = module_progress.tree_current_stage
    
    # Check if tree is now complete
    tree_just_completed = False
    if is_tree_complete(module_progress.tree_growth_points) and not module_progress.tree_completed:
        module_progress.tree_completed = True
        module_progress.tree_completed_at = datetime.now()
        tree_just_completed = True
    
    # Mark lesson game as played
    lesson_progress.quiz_attempts = 1
    lesson_progress.quiz_best_score = Decimal((correct_count / total_questions) * 100) if total_questions > 0 else Decimal(0)
    
    db.commit()
    
    # Calculate coins earned (proportional to growth points)
    coins_earned = 0
    if growth_points_earned > 0:
        # Proportional coins based on max 250 for full tree
        coins_earned = int((growth_points_earned / (TREE_TOTAL_STAGES * POINTS_PER_STAGE)) * MAX_COINS_PER_TREE)
        if coins_earned > 0:
            CoinManager.award_coins(
                db,
                current_user.id,
                coins_earned,
                "grow_your_nest_lesson",
                lesson_id,
                f"Grow Your Nest - Lesson: {lesson.title}"
            )
    
    return {
        "success": True,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "growth_points_earned": growth_points_earned,
        "fertilizer_bonus": fertilizer_bonus > 0,
        "tree_state": {
            "growth_points": module_progress.tree_growth_points,
            "current_stage": module_progress.tree_current_stage,
            "previous_stage": old_stage,
            "stage_increased": new_stage > old_stage,
            "total_stages": TREE_TOTAL_STAGES,
            "completed": module_progress.tree_completed,
            "just_completed": tree_just_completed
        },
        "coins_earned": coins_earned
    }


# ================================
# FREE ROAM MODE ENDPOINTS
# ================================

@router.get("/freeroam/{module_id}/questions")
def get_freeroam_questions(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get Grow Your Nest questions for free roam mode (all lessons in module).
    Only available after all lessons are completed.
    """
    
    # Verify module exists
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    
    # Get all lessons in module
    module_lessons = db.query(Lesson).filter(
        and_(Lesson.module_id == module_id, Lesson.is_active == True)
    ).all()
    
    lesson_ids = [lesson.id for lesson in module_lessons]
    
    if not lesson_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No lessons found in this module"
        )
    
    # Check all lessons are completed (videos watched)
    completed_count = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id.in_(lesson_ids),
            UserLessonProgress.status == "completed"
        )
    ).count()
    
    if completed_count < len(lesson_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete all lessons in this module first"
        )
    
    # Get current tree state
    module_progress = get_or_create_module_progress(db, current_user.id, module_id)
    
    # Check if tree is already complete
    if module_progress.tree_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tree is already fully grown for this module"
        )
    
    # Get questions from ALL lessons in the module
    questions = db.query(QuizQuestion).filter(
        and_(
            QuizQuestion.lesson_id.in_(lesson_ids),
            QuizQuestion.is_active == True
        )
    ).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions available for this module"
        )
    
    # Build response with lesson info for each question
    question_list = []
    for question in questions:
        answers = db.query(QuizAnswer).filter(
            QuizAnswer.question_id == question.id
        ).order_by(QuizAnswer.order_index).all()
        
        # Get lesson title for reference
        lesson = db.query(Lesson).filter(Lesson.id == question.lesson_id).first()
        
        question_list.append({
            "id": str(question.id),
            "lesson_id": str(question.lesson_id),
            "lesson_title": lesson.title if lesson else None,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "explanation": question.explanation,
            "order_index": question.order_index,
            "answers": [
                {
                    "id": str(answer.id),
                    "question_id": str(answer.question_id),
                    "answer_text": answer.answer_text,
                    "order_index": answer.order_index
                }
                for answer in answers
            ]
        })
    
    return {
        "questions": question_list,
        "tree_state": {
            "growth_points": module_progress.tree_growth_points,
            "current_stage": module_progress.tree_current_stage,
            "total_stages": TREE_TOTAL_STAGES,
            "points_per_stage": POINTS_PER_STAGE,
            "points_to_next_stage": POINTS_PER_STAGE - (module_progress.tree_growth_points % POINTS_PER_STAGE),
            "points_to_complete": (TREE_TOTAL_STAGES * POINTS_PER_STAGE) - module_progress.tree_growth_points,
            "completed": module_progress.tree_completed
        }
    }


@router.post("/freeroam/{module_id}/progress")
def save_freeroam_progress(
    module_id: UUID,
    submission: Dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save progress after EACH question in free roam mode.
    This endpoint is called after every single question answer to persist state.
    
    Expected submission format:
    {
        "question_id": "uuid",
        "answer_id": "uuid",
        "is_correct": true,
        "consecutive_correct": 3
    }
    """
    
    # Verify module exists
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    
    # Get module progress
    module_progress = get_or_create_module_progress(db, current_user.id, module_id)
    
    # Check if tree is already complete
    if module_progress.tree_completed:
        return {
            "success": True,
            "message": "Tree is already fully grown",
            "tree_state": {
                "growth_points": module_progress.tree_growth_points,
                "current_stage": module_progress.tree_current_stage,
                "total_stages": TREE_TOTAL_STAGES,
                "completed": True
            },
            "growth_points_earned": 0,
            "coins_earned": 0
        }
    
    # Process the single question answer
    is_correct = submission.get("is_correct", False)
    consecutive_correct = submission.get("consecutive_correct", 0)
    
    growth_points_earned = 0
    fertilizer_bonus = False
    
    if is_correct:
        # Correct answer = Water = 10 points
        growth_points_earned = WATER_POINTS
        
        # Check for fertilizer bonus (every 3 consecutive correct)
        if consecutive_correct > 0 and consecutive_correct % 3 == 0:
            growth_points_earned += FERTILIZER_POINTS
            fertilizer_bonus = True
    
    # Update tree state
    old_stage = module_progress.tree_current_stage
    old_points = module_progress.tree_growth_points
    
    module_progress.tree_growth_points += growth_points_earned
    module_progress.tree_current_stage = calculate_tree_stage(module_progress.tree_growth_points)
    module_progress.last_accessed_at = datetime.now()
    
    new_stage = module_progress.tree_current_stage
    stage_increased = new_stage > old_stage
    
    # Check if tree is now complete
    tree_just_completed = False
    if is_tree_complete(module_progress.tree_growth_points) and not module_progress.tree_completed:
        module_progress.tree_completed = True
        module_progress.tree_completed_at = datetime.now()
        tree_just_completed = True
    
    # IMPORTANT: Commit immediately to persist state
    db.commit()
    
    # Calculate coins for this question (proportional)
    coins_earned = 0
    if growth_points_earned > 0:
        coins_earned = int((growth_points_earned / (TREE_TOTAL_STAGES * POINTS_PER_STAGE)) * MAX_COINS_PER_TREE)
        if coins_earned > 0:
            CoinManager.award_coins(
                db,
                current_user.id,
                coins_earned,
                "grow_your_nest_freeroam",
                module_id,
                f"Grow Your Nest - Free Roam: {module.title}"
            )
    
    return {
        "success": True,
        "is_correct": is_correct,
        "growth_points_earned": growth_points_earned,
        "fertilizer_bonus": fertilizer_bonus,
        "tree_state": {
            "growth_points": module_progress.tree_growth_points,
            "current_stage": module_progress.tree_current_stage,
            "previous_stage": old_stage,
            "stage_increased": stage_increased,
            "total_stages": TREE_TOTAL_STAGES,
            "points_per_stage": POINTS_PER_STAGE,
            "points_to_next_stage": POINTS_PER_STAGE - (module_progress.tree_growth_points % POINTS_PER_STAGE) if not module_progress.tree_completed else 0,
            "points_to_complete": max(0, (TREE_TOTAL_STAGES * POINTS_PER_STAGE) - module_progress.tree_growth_points),
            "completed": module_progress.tree_completed,
            "just_completed": tree_just_completed
        },
        "coins_earned": coins_earned
    }


@router.get("/freeroam/{module_id}/state")
def get_tree_state(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current tree state for a module.
    Use this to restore state when user returns to free roam.
    """
    
    module_progress = db.query(UserModuleProgress).filter(
        and_(
            UserModuleProgress.user_id == current_user.id,
            UserModuleProgress.module_id == module_id
        )
    ).first()
    
    if not module_progress:
        return {
            "growth_points": 0,
            "current_stage": 0,
            "total_stages": TREE_TOTAL_STAGES,
            "points_per_stage": POINTS_PER_STAGE,
            "points_to_next_stage": POINTS_PER_STAGE,
            "points_to_complete": TREE_TOTAL_STAGES * POINTS_PER_STAGE,
            "completed": False,
            "completed_at": None
        }
    
    return {
        "growth_points": module_progress.tree_growth_points,
        "current_stage": module_progress.tree_current_stage,
        "total_stages": TREE_TOTAL_STAGES,
        "points_per_stage": POINTS_PER_STAGE,
        "points_to_next_stage": POINTS_PER_STAGE - (module_progress.tree_growth_points % POINTS_PER_STAGE) if not module_progress.tree_completed else 0,
        "points_to_complete": max(0, (TREE_TOTAL_STAGES * POINTS_PER_STAGE) - module_progress.tree_growth_points),
        "completed": module_progress.tree_completed,
        "completed_at": module_progress.tree_completed_at
    }