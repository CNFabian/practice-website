"""
Grow Your Nest router.

Single API surface for the Grow Your Nest minigame:
- Lesson mode: 3 questions per lesson, one-time play after video.
- Free roam: All module questions, progress saved per answer, tree growth.
- Module quiz: Full module quiz (all questions at once), attempts, stats.

URL path uses kebab-case: grow-your-nest. Display name: Grow Your Nest.
"""
from datetime import datetime
from typing import List, Dict, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from auth import get_current_user
from models import (
    User, Module, Lesson, UserModuleProgress, UserLessonProgress,
    QuizQuestion, QuizAnswer, UserModuleQuizAttempt,
)
from schemas import (
    SuccessResponse,
    MiniGameQuestionsResponse, MiniGameSubmission, MiniGameResult,
    MiniGameAttemptHistory,
    ValidateAnswerRequest, ValidateAnswerResponse,
    FreeroamAnswerRequest, LessonSubmitRequest,
)
from utils import CoinManager, NotificationManager, QuizManager
from analytics.event_tracker import EventTracker

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# ================================
# CONSTANTS
# ================================

# Display name (title case) for docs and user-facing strings
ROUTE_TAG_GROW_YOUR_NEST = "Grow Your Nest"
# Internal coin reason codes (snake_case)
COIN_REASON_LESSON = "grow_your_nest_lesson"
COIN_REASON_FREEROAM = "grow_your_nest_freeroam"
COIN_REASON_MODULE_PASSED = "grow_your_nest_module_passed"

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


def validate_single_answer(db: Session, question_id: UUID, answer_id: UUID) -> tuple[bool, Optional[str]]:
    """
    Validate one answer against the DB. Returns (is_correct, explanation).
    """
    answer = db.query(QuizAnswer).filter(
        and_(
            QuizAnswer.id == answer_id,
            QuizAnswer.question_id == question_id,
        )
    ).first()
    if not answer:
        return False, None
    question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    explanation = question.explanation if question else None
    return bool(answer.is_correct), explanation


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
# VALIDATE SINGLE ANSWER (all modes)
# ================================


@router.post("/validate-answer", response_model=ValidateAnswerResponse)
def validate_answer(
    body: ValidateAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate one minigame answer. Call after each question for immediate feedback.
    Returns is_correct and explanation (if any). No side effects.
    """
    is_correct, explanation = validate_single_answer(db, body.question_id, body.answer_id)
    return ValidateAnswerResponse(is_correct=is_correct, explanation=explanation)


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
    submission: LessonSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit Grow Your Nest lesson results (all 3 questions at once).
    Server validates each answer; do not send is_correct from client.
    
    Body: { "answers": [ {"question_id": "uuid", "answer_id": "uuid"}, ... ] }
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
    
    # Validate each answer on server and compute correct_count + consecutive_correct
    results = []
    for item in submission.answers:
        is_correct, _ = validate_single_answer(db, item.question_id, item.answer_id)
        results.append(is_correct)
    correct_count = sum(1 for r in results if r)
    total_questions = len(results)
    consecutive_correct = 0
    for r in results:
        if r:
            consecutive_correct += 1
        else:
            consecutive_correct = 0
    
    # Calculate growth points
    # Each correct answer = 1 Water = 10 points
    growth_points_earned = correct_count * WATER_POINTS
    # Fertilizer bonus for every 3 consecutive correct (count streaks)
    streak = 0
    for r in results:
        if r:
            streak += 1
            if streak >= 3:
                growth_points_earned += FERTILIZER_POINTS
                streak = 0
        else:
            streak = 0
    
    # Cap at 50 points per lesson session (3 correct + 1 fertilizer = 50 max)
    growth_points_earned = min(growth_points_earned, 50)
    fertilizer_bonus = growth_points_earned > (correct_count * WATER_POINTS)
    
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
                COIN_REASON_LESSON,
                lesson_id,
                f"{ROUTE_TAG_GROW_YOUR_NEST} - Lesson: {lesson.title}"
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


@router.post("/freeroam/{module_id}/answer")
def submit_freeroam_answer(
    module_id: UUID,
    body: FreeroamAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit one answer in freeroam; server validates and updates tree.
    Call after each question for immediate feedback and progress.
    Body: { "question_id": "uuid", "answer_id": "uuid", "consecutive_correct": 0 }
    """
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    module_progress = get_or_create_module_progress(db, current_user.id, module_id)
    if module_progress.tree_completed:
        return {
            "success": True,
            "message": "Tree is already fully grown",
            "is_correct": False,
            "explanation": None,
            "tree_state": {
                "growth_points": module_progress.tree_growth_points,
                "current_stage": module_progress.tree_current_stage,
                "total_stages": TREE_TOTAL_STAGES,
                "completed": True,
            },
            "growth_points_earned": 0,
            "coins_earned": 0,
        }

    is_correct, explanation = validate_single_answer(db, body.question_id, body.answer_id)
    consecutive_correct = body.consecutive_correct or 0

    growth_points_earned = 0
    fertilizer_bonus = False
    if is_correct:
        growth_points_earned = WATER_POINTS
        if consecutive_correct > 0 and consecutive_correct % 3 == 0:
            growth_points_earned += FERTILIZER_POINTS
            fertilizer_bonus = True

    old_stage = module_progress.tree_current_stage
    module_progress.tree_growth_points += growth_points_earned
    module_progress.tree_current_stage = calculate_tree_stage(module_progress.tree_growth_points)
    module_progress.last_accessed_at = datetime.now()
    new_stage = module_progress.tree_current_stage
    stage_increased = new_stage > old_stage

    tree_just_completed = False
    if is_tree_complete(module_progress.tree_growth_points) and not module_progress.tree_completed:
        module_progress.tree_completed = True
        module_progress.tree_completed_at = datetime.now()
        tree_just_completed = True

    db.commit()

    coins_earned = 0
    if growth_points_earned > 0:
        coins_earned = int(
            (growth_points_earned / (TREE_TOTAL_STAGES * POINTS_PER_STAGE)) * MAX_COINS_PER_TREE
        )
        if coins_earned > 0:
            CoinManager.award_coins(
                db,
                current_user.id,
                coins_earned,
                COIN_REASON_FREEROAM,
                module_id,
                f"{ROUTE_TAG_GROW_YOUR_NEST} - Free Roam: {module.title}",
            )

    return {
        "success": True,
        "is_correct": is_correct,
        "explanation": explanation,
        "growth_points_earned": growth_points_earned,
        "fertilizer_bonus": fertilizer_bonus,
        "tree_state": {
            "growth_points": module_progress.tree_growth_points,
            "current_stage": module_progress.tree_current_stage,
            "previous_stage": old_stage,
            "stage_increased": stage_increased,
            "total_stages": TREE_TOTAL_STAGES,
            "points_per_stage": POINTS_PER_STAGE,
            "points_to_next_stage": (
                POINTS_PER_STAGE - (module_progress.tree_growth_points % POINTS_PER_STAGE)
                if not module_progress.tree_completed
                else 0
            ),
            "points_to_complete": max(
                0,
                (TREE_TOTAL_STAGES * POINTS_PER_STAGE) - module_progress.tree_growth_points,
            ),
            "completed": module_progress.tree_completed,
            "just_completed": tree_just_completed,
        },
        "coins_earned": coins_earned,
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
                COIN_REASON_FREEROAM,
                module_id,
                f"{ROUTE_TAG_GROW_YOUR_NEST} - Free Roam: {module.title}"
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


# ================================
# MODULE QUIZ ENDPOINTS (Grow Your Nest)
# ================================

@router.get("/module/{module_id}", response_model=MiniGameQuestionsResponse)
def get_module_questions(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all quiz questions for Grow Your Nest module quiz.
    Returns consolidated questions from all lessons in the module.
    Requires all lessons in the module to be completed first.
    """
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")

    lessons = db.query(Lesson).filter(
        and_(Lesson.module_id == module_id, Lesson.is_active == True)
    ).order_by(Lesson.order_index).all()
    if not lessons:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No lessons found in this module")

    lesson_ids = [lesson.id for lesson in lessons]
    completed_lessons = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id.in_(lesson_ids),
            UserLessonProgress.status == "completed"
        )
    ).all()
    completed_lesson_ids = {p.lesson_id for p in completed_lessons}
    incomplete_lessons = [l for l in lessons if l.id not in completed_lesson_ids]
    if incomplete_lessons:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "incomplete_lessons",
                "message": f"Please complete all lessons before playing {ROUTE_TAG_GROW_YOUR_NEST}",
                "incomplete_lessons": [
                    {"id": str(l.id), "title": l.title, "order_index": l.order_index}
                    for l in incomplete_lessons
                ],
                "progress": {
                    "completed": len(completed_lesson_ids),
                    "total": len(lessons),
                    "percentage": round((len(completed_lesson_ids) / len(lessons)) * 100, 2) if lessons else 0
                }
            }
        )

    all_questions = []
    for lesson in lessons:
        questions = db.query(QuizQuestion).filter(
            and_(QuizQuestion.lesson_id == lesson.id, QuizQuestion.is_active == True)
        ).order_by(QuizQuestion.order_index).all()
        for question in questions:
            answers = db.query(QuizAnswer).filter(QuizAnswer.question_id == question.id).order_by(QuizAnswer.order_index).all()
            all_questions.append({
                "id": str(question.id),
                "lesson_id": str(lesson.id),
                "lesson_title": lesson.title,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "order_index": question.order_index,
                "answers": [
                    {"id": str(a.id), "answer_text": a.answer_text, "order_index": a.order_index}
                    for a in answers
                ]
            })
    if not all_questions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No questions found for this module")

    previous_attempts = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).order_by(desc(UserModuleQuizAttempt.attempt_number)).all()
    best_score = max(float(a.score) for a in previous_attempts) if previous_attempts else None

    return {
        "module": {
            "id": str(module.id),
            "title": module.title,
            "description": module.description,
            "difficulty_level": module.difficulty_level
        },
        "total_lessons": len(lessons),
        "completed_lessons": len(completed_lesson_ids),
        "total_questions": len(all_questions),
        "questions": all_questions,
        "user_status": {
            "all_lessons_completed": True,
            "completed_lessons": len(completed_lesson_ids),
            "total_lessons": len(lessons),
            "completion_percentage": 100.0 if lessons else 0,
            "total_attempts": len(previous_attempts),
            "best_score": best_score,
            "can_play": True
        }
    }


@router.post("/module/{module_id}/submit", response_model=MiniGameResult)
@limiter.limit("10/minute")
def submit_module_quiz(
    request: Request,
    module_id: UUID,
    submission: MiniGameSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit Grow Your Nest module quiz results.
    Rate limited: 10 requests per minute per user.
    """
    if submission.module_id != module_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Module ID mismatch")

    module = db.query(Module).filter(and_(Module.id == module_id, Module.is_active == True)).first()
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    lessons = db.query(Lesson).filter(and_(Lesson.module_id == module_id, Lesson.is_active == True)).all()
    lesson_ids = [l.id for l in lessons]
    all_questions = db.query(QuizQuestion).filter(
        and_(QuizQuestion.lesson_id.in_(lesson_ids), QuizQuestion.is_active == True)
    ).all()
    question_ids = {q.id for q in all_questions}

    if len(submission.answers) != len(all_questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {len(all_questions)} answers, got {len(submission.answers)}"
        )

    correct_answers = 0
    for answer_data in submission.answers:
        qid = UUID(list(answer_data.keys())[0])
        aid = UUID(list(answer_data.values())[0])
        if qid not in question_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID")
        ans = db.query(QuizAnswer).filter(
            and_(QuizAnswer.id == aid, QuizAnswer.question_id == qid)
        ).first()
        if ans and ans.is_correct:
            correct_answers += 1

    attempt_number = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).count() + 1
    score = QuizManager.calculate_quiz_score(correct_answers, len(all_questions))
    passed = QuizManager.determine_quiz_pass(score)

    attempt = UserModuleQuizAttempt(
        user_id=current_user.id,
        module_id=module_id,
        attempt_number=attempt_number,
        score=score,
        total_questions=len(all_questions),
        correct_answers=correct_answers,
        time_taken_seconds=submission.time_taken_seconds,
        passed=passed,
        game_data=submission.game_data
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    EventTracker.track_minigame_attempted(db, current_user.id, module_id, attempt_number)
    EventTracker.track_minigame_result(db, current_user.id, module_id, float(score), passed)

    coins_earned = 0
    badges_earned = []
    module_completed = False
    if passed:
        total_lesson_coins = sum(l.nest_coins_reward for l in lessons)
        coins_earned = QuizManager.calculate_coin_reward(total_lesson_coins, score)
        if coins_earned > 0:
            CoinManager.award_coins(
                db, current_user.id, coins_earned,
                COIN_REASON_MODULE_PASSED, attempt.id,
                f"{ROUTE_TAG_GROW_YOUR_NEST} - {module.title}"
            )
        module_progress = db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == current_user.id,
                UserModuleProgress.module_id == module_id
            )
        ).first()
        if not module_progress:
            module_progress = UserModuleProgress(
                user_id=current_user.id,
                module_id=module_id,
                total_lessons=len(lessons),
                first_started_at=datetime.now()
            )
            db.add(module_progress)
            db.flush()
        was_already_completed = module_progress.minigame_completed
        module_progress.minigame_completed = True
        module_progress.minigame_attempts = attempt_number
        module_progress.minigame_best_score = max(
            score, module_progress.minigame_best_score or Decimal("0.00")
        )
        if not was_already_completed:
            module_progress.status = "completed"
            module_progress.completed_at = datetime.now()
            module_progress.completion_percentage = Decimal("100.00")
            module_completed = True
            EventTracker.track_module_completed(db, current_user.id, module_id, module.title)
    db.commit()

    return MiniGameResult(
        attempt_id=attempt.id,
        module_id=module_id,
        module_title=module.title,
        score=score,
        total_questions=len(all_questions),
        correct_answers=correct_answers,
        passed=passed,
        coins_earned=coins_earned,
        badges_earned=badges_earned,
        time_taken_seconds=submission.time_taken_seconds,
        attempt_number=attempt_number,
        module_completed=module_completed
    )


@router.get("/module/{module_id}/attempts", response_model=List[MiniGameAttemptHistory])
def get_module_attempts(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's previous Grow Your Nest module quiz attempts for a module."""
    attempts = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).order_by(desc(UserModuleQuizAttempt.completed_at)).all()
    return [
        MiniGameAttemptHistory(
            id=a.id,
            attempt_number=a.attempt_number,
            score=a.score,
            passed=a.passed,
            completed_at=a.completed_at
        )
        for a in attempts
    ]


@router.get("/stats")
def get_module_quiz_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's overall Grow Your Nest module quiz statistics."""
    attempts = db.query(UserModuleQuizAttempt).filter(
        UserModuleQuizAttempt.user_id == current_user.id
    ).all()
    if not attempts:
        return {
            "total_attempts": 0,
            "total_passed": 0,
            "total_failed": 0,
            "pass_rate": 0.0,
            "average_score": 0.0,
            "best_score": 0.0,
            "modules_completed": 0
        }
    total_attempts = len(attempts)
    passed_attempts = [a for a in attempts if a.passed]
    total_passed = len(passed_attempts)
    total_failed = total_attempts - total_passed
    pass_rate = (total_passed / total_attempts * 100) if total_attempts > 0 else 0
    average_score = sum(float(a.score) for a in attempts) / len(attempts)
    best_score = max(float(a.score) for a in attempts)
    modules_completed = len(set(a.module_id for a in passed_attempts))
    return {
        "total_attempts": total_attempts,
        "total_passed": total_passed,
        "total_failed": total_failed,
        "pass_rate": round(pass_rate, 2),
        "average_score": round(average_score, 2),
        "best_score": round(best_score, 2),
        "modules_completed": modules_completed
    }
    
# ================================
# TEMPORARY DEV RESET ENDPOINT — Remove before production
# ================================

@router.post("/lesson/{lesson_id}/reset-dev")
def reset_lesson_gyn_dev(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    DEV ONLY: Full reset of a lesson and its module's tree progress.
    Resets lesson progress (status, video, milestones, completion) so it appears
    as if the user never started the lesson. Also resets quiz_attempts for all
    lessons in the module and resets the module's tree state.
    Remove this endpoint before production launch.
    """
    # Get the lesson to find the module_id
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Reset the target lesson's full progress
    lesson_progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not lesson_progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No progress found for this lesson"
        )
    
    # Full lesson progress reset — make it look like the lesson was never touched
    lesson_progress.status = "not_started"
    lesson_progress.video_progress_seconds = 0
    lesson_progress.quiz_attempts = 0
    lesson_progress.quiz_best_score = None
    lesson_progress.content_type_consumed = None
    lesson_progress.transcript_progress_percentage = None
    lesson_progress.time_spent_seconds = 0
    lesson_progress.completion_method = None
    lesson_progress.milestones_reached = None
    lesson_progress.completed_at = None
    lesson_progress.last_accessed_at = datetime.now()
    
    # Reset quiz_attempts for ALL other lessons in the same module
    module_lessons = db.query(Lesson).filter(
        and_(Lesson.module_id == lesson.module_id, Lesson.is_active == True)
    ).all()
    
    reset_lesson_count = 1  # counting the target lesson
    for mod_lesson in module_lessons:
        if mod_lesson.id == lesson_id:
            continue  # already reset above
        lp = db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                UserLessonProgress.lesson_id == mod_lesson.id
            )
        ).first()
        if lp and lp.quiz_attempts > 0:
            lp.quiz_attempts = 0
            lp.quiz_best_score = None
            reset_lesson_count += 1
    
    # Reset tree progress on the module
    module_progress = db.query(UserModuleProgress).filter(
        and_(
            UserModuleProgress.user_id == current_user.id,
            UserModuleProgress.module_id == lesson.module_id
        )
    ).first()
    
    tree_was_reset = False
    if module_progress:
        module_progress.tree_growth_points = 0
        module_progress.tree_current_stage = 0
        module_progress.tree_completed = False
        module_progress.tree_completed_at = None
        # Recalculate module completion status since we reset a lesson
        completed_lessons = db.query(UserLessonProgress).join(Lesson).filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                Lesson.module_id == lesson.module_id,
                UserLessonProgress.status == "completed",
                Lesson.is_active == True
            )
        ).count()
        module_progress.lessons_completed = completed_lessons
        total_lessons = module_progress.total_lessons or 1
        module_progress.completion_percentage = Decimal(
            (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0
        )
        if completed_lessons == 0:
            module_progress.status = "not_started"
        elif completed_lessons < total_lessons:
            module_progress.status = "in_progress"
        tree_was_reset = True
    
    db.commit()
    
    return {
        "success": True,
        "message": (
            f"Full reset for lesson '{lesson.title}' in module {lesson.module_id}. "
            f"Lesson progress cleared (status → not_started, video → 0). "
            f"{reset_lesson_count} lesson(s) quiz_attempts reset. "
            f"Tree progress {'reset to stage 0' if tree_was_reset else 'no module progress found'}."
        )
    }