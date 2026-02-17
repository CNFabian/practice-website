"""
Mini-Game Router (Grow Your Nest)

Handles the consolidated module-level quiz presented as a trivia mini-game.
Users complete all lessons in a module, then play this game to test their knowledge.
"""
from datetime import datetime
from typing import List
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
    User, Module, Lesson, QuizQuestion, QuizAnswer,
    UserModuleProgress, UserLessonProgress, UserModuleQuizAttempt
)
from schemas import (
    MiniGameQuestionsResponse, MiniGameSubmission, MiniGameResult,
    MiniGameAttemptHistory
)
from utils import QuizManager, CoinManager, ProgressManager
from analytics.event_tracker import EventTracker

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/module/{module_id}", response_model=MiniGameQuestionsResponse)
def get_module_minigame(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all quiz questions for 'Grow Your Nest' mini-game.
    Returns consolidated questions from all lessons in the module as a flat list.
    
    The client receives all questions and handles:
    - Randomization/shuffling
    - Game presentation/flow
    - Score tracking within the game
    """
    # Validate module
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    
    # Get all lessons in module (ordered)
    lessons = db.query(Lesson).filter(
        and_(
            Lesson.module_id == module_id,
            Lesson.is_active == True
        )
    ).order_by(Lesson.order_index).all()
    
    if not lessons:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No lessons found in this module"
        )
    
    # Check user's lesson completion status
    lesson_ids = [lesson.id for lesson in lessons]
    completed_lessons = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id.in_(lesson_ids),
            UserLessonProgress.status == "completed"
        )
    ).all()
    
    completed_lesson_ids = {progress.lesson_id for progress in completed_lessons}
    
    # GATE: Check if all lessons are completed
    incomplete_lessons = [
        lesson for lesson in lessons 
        if lesson.id not in completed_lesson_ids
    ]
    
    # Enforce completion requirement (can be disabled with query param for testing)
    if incomplete_lessons:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "incomplete_lessons",
                "message": "Please complete all lessons before playing the mini-game",
                "incomplete_lessons": [
                    {
                        "id": str(lesson.id),
                        "title": lesson.title,
                        "order_index": lesson.order_index
                    }
                    for lesson in incomplete_lessons
                ],
                "progress": {
                    "completed": len(completed_lesson_ids),
                    "total": len(lessons),
                    "percentage": round((len(completed_lesson_ids) / len(lessons)) * 100, 2) if lessons else 0
                }
            }
        )
    
    # Collect ALL questions from ALL lessons (flat list)
    all_questions = []
    
    for lesson in lessons:
        questions = db.query(QuizQuestion).filter(
            and_(
                QuizQuestion.lesson_id == lesson.id,
                QuizQuestion.is_active == True
            )
        ).order_by(QuizQuestion.order_index).all()
        
        for question in questions:
            answers = db.query(QuizAnswer).filter(
                QuizAnswer.question_id == question.id
            ).order_by(QuizAnswer.order_index).all()
            
            all_questions.append({
                "id": str(question.id),
                "lesson_id": str(lesson.id),
                "lesson_title": lesson.title,
                "question_text": question.question_text,
                "question_type": question.question_type,
                "order_index": question.order_index,
                "answers": [
                    {
                        "id": str(answer.id),
                        "answer_text": answer.answer_text,
                        "order_index": answer.order_index
                        # Note: is_correct is NOT included for security
                    }
                    for answer in answers
                ]
            })
    
    if not all_questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found for this module"
        )
    
    # Get previous attempts
    previous_attempts = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).order_by(desc(UserModuleQuizAttempt.attempt_number)).all()
    
    best_score = max([float(attempt.score) for attempt in previous_attempts]) if previous_attempts else None
    
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
        "questions": all_questions,  # FLAT LIST - client handles presentation
        "user_status": {
            "all_lessons_completed": len(completed_lesson_ids) == len(lessons),
            "completed_lessons": len(completed_lesson_ids),
            "total_lessons": len(lessons),
            "completion_percentage": round((len(completed_lesson_ids) / len(lessons)) * 100, 2) if lessons else 0,
            "total_attempts": len(previous_attempts),
            "best_score": best_score,
            "can_play": True  # Will only reach here if all lessons completed (gate passed)
        }
    }


@router.post("/module/{module_id}/submit", response_model=MiniGameResult)
@limiter.limit("10/minute")  # Max 10 mini-game submissions per user per minute
def submit_minigame(
    request: Request,
    module_id: UUID,
    submission: MiniGameSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit 'Grow Your Nest' mini-game results.
    Validates answers, calculates score, awards coins/badges, and marks module completion.
    
    Rate Limited: 10 requests per minute per user (prevents spam/abuse).
    """
    
    if submission.module_id != module_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module ID mismatch"
        )
    
    # Validate module
    module = db.query(Module).filter(
        and_(Module.id == module_id, Module.is_active == True)
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found"
        )
    
    # Get all questions for this module
    lessons = db.query(Lesson).filter(
        and_(Lesson.module_id == module_id, Lesson.is_active == True)
    ).all()
    
    lesson_ids = [lesson.id for lesson in lessons]
    all_questions = db.query(QuizQuestion).filter(
        and_(
            QuizQuestion.lesson_id.in_(lesson_ids),
            QuizQuestion.is_active == True
        )
    ).all()
    
    question_ids = {q.id for q in all_questions}
    
    # Validate answers
    if len(submission.answers) != len(all_questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Expected {len(all_questions)} answers, got {len(submission.answers)}"
        )
    
    # Calculate score
    correct_answers = 0
    for answer_data in submission.answers:
        question_id = UUID(list(answer_data.keys())[0])
        selected_answer_id = UUID(list(answer_data.values())[0])
        
        if question_id not in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question ID: {question_id}"
            )
        
        # Check if correct
        selected_answer = db.query(QuizAnswer).filter(
            and_(
                QuizAnswer.id == selected_answer_id,
                QuizAnswer.question_id == question_id
            )
        ).first()
        
        if selected_answer and selected_answer.is_correct:
            correct_answers += 1
    
    # Calculate attempt number
    attempt_number = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).count() + 1
    
    # Calculate score percentage
    score = QuizManager.calculate_quiz_score(correct_answers, len(all_questions))
    passed = QuizManager.determine_quiz_pass(score)
    
    # Create attempt record
    attempt = UserModuleQuizAttempt(
        user_id=current_user.id,
        module_id=module_id,
        attempt_number=attempt_number,
        score=score,
        total_questions=len(all_questions),
        correct_answers=correct_answers,
        time_taken_seconds=submission.time_taken_seconds,
        passed=passed,
        game_data=submission.game_data  # Store any game-specific data
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Track events
    EventTracker.track_minigame_attempted(db, current_user.id, module_id, attempt_number)
    EventTracker.track_minigame_result(db, current_user.id, module_id, float(score), passed)
    
    # Award badges if passed (coins come from tree stages + module completion, not quiz)
    coins_earned = 0
    badges_earned = []
    module_completed = False
    
    if passed:
        # NOTE: Module quiz no longer awards coins directly.
        # Coins come from tree stage growth and module completion.
        
        # Get or CREATE module progress
        module_progress = db.query(UserModuleProgress).filter(
            and_(
                UserModuleProgress.user_id == current_user.id,
                UserModuleProgress.module_id == module_id
            )
        ).first()
        
        if not module_progress:
            # Create if doesn't exist (edge case: user plays mini-game before tracking lessons)
            module_progress = UserModuleProgress(
                user_id=current_user.id,
                module_id=module_id,
                total_lessons=len(lessons),
                first_started_at=datetime.now()
            )
            db.add(module_progress)
            db.flush()
        
        # Track if this is the FIRST time passing mini-game (prevent duplicate events)
        was_already_completed = module_progress.minigame_completed
        
        # Update mini-game tracking fields
        module_progress.minigame_completed = True
        module_progress.minigame_attempts = attempt_number
        module_progress.minigame_best_score = max(
            score,
            module_progress.minigame_best_score or Decimal("0.00")
        )
        
        # Mark module as completed (only if not already completed)
        if not was_already_completed:
            module_progress.status = "completed"
            module_progress.completed_at = datetime.now()
            module_progress.completion_percentage = Decimal("100.00")
            module_completed = True
            
            # Track module completion event ONLY on first completion (prevents duplicates)
            _, created = EventTracker.track_module_completed(db, current_user.id, module_id, module.title)
            
            # Award 250 coins for first module completion (coin economy alignment)
            coins_earned = 250  # Scales with module difficulty in future
            CoinManager.award_coins(
                db, current_user.id, coins_earned,
                "module_completion", module_id,
                f"Completed module: {module.title}"
            )
    
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
def get_minigame_attempts(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's previous mini-game attempts for a module"""
    
    attempts = db.query(UserModuleQuizAttempt).filter(
        and_(
            UserModuleQuizAttempt.user_id == current_user.id,
            UserModuleQuizAttempt.module_id == module_id
        )
    ).order_by(desc(UserModuleQuizAttempt.completed_at)).all()
    
    return [
        MiniGameAttemptHistory(
            id=attempt.id,
            attempt_number=attempt.attempt_number,
            score=attempt.score,
            passed=attempt.passed,
            completed_at=attempt.completed_at
        )
        for attempt in attempts
    ]


@router.get("/stats")
def get_minigame_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's overall mini-game statistics across all modules"""
    
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
    
    # Count unique modules completed (passed)
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