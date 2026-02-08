from datetime import datetime
from typing import List, Dict
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from database import get_db
from auth import get_current_user, get_current_admin_user
from models import (
    User, Lesson, UserLessonProgress, QuizQuestion, QuizAnswer,
    UserQuizAttempt, UserQuizAnswer, UserCoinTransaction
)
from schemas import (
    QuizSubmission, QuizResult, SuccessResponse, QuizQuestionCreate,
    QuizAnswerCreate, QuizQuestionResponse, QuizAnswerResponse
)
from utils import (
    QuizManager, CoinManager, BadgeManager, ProgressManager, NotificationManager
)
from analytics.event_tracker import EventTracker

router = APIRouter()


@router.post("/submit", response_model=QuizResult)
def submit_quiz(
    quiz_data: QuizSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit quiz answers and get results"""
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == quiz_data.lesson_id, Lesson.is_active == True)
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # NOTE: Gate removed - users can take quiz anytime
    # This endpoint is kept for backward compatibility
    # New flow uses mini-game endpoint for module-level quiz
    
    # Get or create lesson progress
    lesson_progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == quiz_data.lesson_id
        )
    ).first()
    
    if not lesson_progress:
        # Create progress record if it doesn't exist
        lesson_progress = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=quiz_data.lesson_id,
            status="in_progress"
        )
        db.add(lesson_progress)
        db.commit()
        db.refresh(lesson_progress)
    
    # Get quiz questions
    questions = db.query(QuizQuestion).filter(
        and_(QuizQuestion.lesson_id == quiz_data.lesson_id, QuizQuestion.is_active == True)
    ).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz questions found for this lesson"
        )
    
    # Validate submitted answers
    question_ids = {q.id for q in questions}
    submitted_question_ids = set()
    
    for answer_data in quiz_data.answers:
        if len(answer_data) != 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Each answer must contain exactly one question-answer pair"
            )
        
        question_id = list(answer_data.keys())[0]
        try:
            question_uuid = UUID(question_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question ID format: {question_id}"
            )
        
        if question_uuid not in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question_id} not found in this lesson"
            )
        
        if question_uuid in submitted_question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate answer for question {question_id}"
            )
        
        submitted_question_ids.add(question_uuid)
    
    if len(submitted_question_ids) != len(questions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All questions must be answered"
        )
    
    # Calculate attempt number
    attempt_number = db.query(UserQuizAttempt).filter(
        and_(
            UserQuizAttempt.user_id == current_user.id,
            UserQuizAttempt.lesson_id == quiz_data.lesson_id
        )
    ).count() + 1
    
    # Process answers and calculate score
    correct_answers = 0
    total_questions = len(questions)
    quiz_answers = []
    
    for answer_data in quiz_data.answers:
        question_id = UUID(list(answer_data.keys())[0])
        selected_answer_id = UUID(list(answer_data.values())[0])
        
        # Get the correct answer
        correct_answer = db.query(QuizAnswer).filter(
            and_(
                QuizAnswer.question_id == question_id,
                QuizAnswer.is_correct == True
            )
        ).first()
        
        # Check if selected answer is correct
        selected_answer = db.query(QuizAnswer).filter(
            QuizAnswer.id == selected_answer_id
        ).first()
        
        if not selected_answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selected answer {selected_answer_id} not found"
            )
        
        is_correct = selected_answer.is_correct
        if is_correct:
            correct_answers += 1
        
        quiz_answers.append({
            "question_id": question_id,
            "selected_answer_id": selected_answer_id,
            "is_correct": is_correct
        })
    
    # Calculate score
    score = QuizManager.calculate_quiz_score(correct_answers, total_questions)
    passed = QuizManager.determine_quiz_pass(score)
    
    # Create quiz attempt record
    quiz_attempt = UserQuizAttempt(
        user_id=current_user.id,
        lesson_id=quiz_data.lesson_id,
        attempt_number=attempt_number,
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        time_taken_seconds=quiz_data.time_taken_seconds,
        passed=passed,
        started_at=datetime.now(),
        completed_at=datetime.now()
    )
    
    db.add(quiz_attempt)
    db.commit()
    db.refresh(quiz_attempt)
    
    # Track quiz attempt event
    EventTracker.track_quiz_attempted(db, current_user.id, quiz_data.lesson_id, attempt_number)
    
    # Track quiz result event
    EventTracker.track_quiz_result(
        db, current_user.id, quiz_data.lesson_id, float(score), passed, attempt_number
    )
    
    # Save individual answers
    for answer_data in quiz_answers:
        user_quiz_answer = UserQuizAnswer(
            quiz_attempt_id=quiz_attempt.id,
            question_id=answer_data["question_id"],
            selected_answer_id=answer_data["selected_answer_id"],
            is_correct=answer_data["is_correct"]
        )
        db.add(user_quiz_answer)
    
    db.commit()
    
    # Update lesson progress quiz information
    lesson_progress.quiz_attempts = attempt_number
    if not lesson_progress.quiz_best_score or score > lesson_progress.quiz_best_score:
        lesson_progress.quiz_best_score = score
    
    # Award coins and badges if passed
    coins_earned = 0
    badges_earned = []
    
    if passed:
        # Calculate coin reward
        coins_earned = QuizManager.calculate_coin_reward(lesson.nest_coins_reward, score)
        
        if coins_earned > 0:
            CoinManager.award_coins(
                db,
                current_user.id,
                coins_earned,
                "quiz_passed",
                quiz_attempt.id,
                f"Passed quiz for lesson: {lesson.title}"
            )
        
        # Check and award badges
        awarded_badges = BadgeManager.check_and_award_lesson_badges(
            db, current_user.id, quiz_data.lesson_id
        )
        badges_earned = [badge.badge.name for badge in awarded_badges]
        
        # Send achievement notification
        achievement_message = f"Congratulations! You scored {score}% on the quiz"
        if badges_earned:
            achievement_message += f" and earned {len(badges_earned)} badge(s)"
        if coins_earned > 0:
            achievement_message += f" and {coins_earned} coins"
        achievement_message += "!"
        
        NotificationManager.create_notification(
            db,
            current_user.id,
            "quiz_passed",
            "Quiz Passed!",
            achievement_message,
            "high"
        )
    
    db.commit()
    
    return QuizResult(
        attempt_id=quiz_attempt.id,
        score=score,
        total_questions=total_questions,
        correct_answers=correct_answers,
        passed=passed,
        coins_earned=coins_earned,
        badges_earned=badges_earned,
        time_taken_seconds=quiz_data.time_taken_seconds
    )


@router.get("/attempts/{lesson_id}")
def get_quiz_attempts(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's quiz attempts for a specific lesson"""
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == lesson_id, Lesson.is_active == True)
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    attempts = db.query(UserQuizAttempt).filter(
        and_(
            UserQuizAttempt.user_id == current_user.id,
            UserQuizAttempt.lesson_id == lesson_id
        )
    ).order_by(desc(UserQuizAttempt.attempt_number)).all()
    
    return [
        {
            "id": attempt.id,
            "attempt_number": attempt.attempt_number,
            "score": float(attempt.score),
            "total_questions": attempt.total_questions,
            "correct_answers": attempt.correct_answers,
            "passed": attempt.passed,
            "time_taken_seconds": attempt.time_taken_seconds,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at
        }
        for attempt in attempts
    ]


@router.get("/attempt/{attempt_id}/details")
def get_quiz_attempt_details(
    attempt_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed results for a specific quiz attempt"""
    attempt = db.query(UserQuizAttempt).filter(
        and_(
            UserQuizAttempt.id == attempt_id,
            UserQuizAttempt.user_id == current_user.id
        )
    ).first()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz attempt not found"
        )
    
    # Get detailed answers
    quiz_answers = db.query(UserQuizAnswer).join(QuizQuestion).join(QuizAnswer).filter(
        UserQuizAnswer.quiz_attempt_id == attempt_id
    ).all()
    
    detailed_answers = []
    for user_answer in quiz_answers:
        question = user_answer.question
        selected_answer = user_answer.selected_answer
        
        # Get all possible answers for this question
        all_answers = db.query(QuizAnswer).filter(
            QuizAnswer.question_id == question.id
        ).order_by(QuizAnswer.order_index).all()
        
        # Find the correct answer
        correct_answer = next((a for a in all_answers if a.is_correct), None)
        
        detailed_answers.append({
            "question": {
                "id": question.id,
                "text": question.question_text,
                "explanation": question.explanation,
                "order_index": question.order_index
            },
            "selected_answer": {
                "id": selected_answer.id,
                "text": selected_answer.answer_text
            } if selected_answer else None,
            "correct_answer": {
                "id": correct_answer.id,
                "text": correct_answer.answer_text
            } if correct_answer else None,
            "is_correct": user_answer.is_correct,
            "all_answers": [
                {
                    "id": answer.id,
                    "text": answer.answer_text,
                    "is_correct": answer.is_correct
                }
                for answer in all_answers
            ]
        })
    
    return {
        "attempt": {
            "id": attempt.id,
            "attempt_number": attempt.attempt_number,
            "score": float(attempt.score),
            "total_questions": attempt.total_questions,
            "correct_answers": attempt.correct_answers,
            "passed": attempt.passed,
            "time_taken_seconds": attempt.time_taken_seconds,
            "started_at": attempt.started_at,
            "completed_at": attempt.completed_at
        },
        "lesson": {
            "id": attempt.lesson.id,
            "title": attempt.lesson.title
        },
        "answers": detailed_answers
    }


@router.get("/statistics")
def get_quiz_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's overall quiz statistics"""
    # Total attempts and scores
    attempts = db.query(UserQuizAttempt).filter(
        UserQuizAttempt.user_id == current_user.id
    ).all()
    
    if not attempts:
        return {
            "total_attempts": 0,
            "total_passed": 0,
            "total_failed": 0,
            "pass_rate": 0.0,
            "average_score": 0.0,
            "best_score": 0.0,
            "total_coins_earned": 0,
            "recent_attempts": []
        }
    
    total_attempts = len(attempts)
    passed_attempts = [a for a in attempts if a.passed]
    total_passed = len(passed_attempts)
    total_failed = total_attempts - total_passed
    pass_rate = (total_passed / total_attempts * 100) if total_attempts > 0 else 0
    
    average_score = sum(float(a.score) for a in attempts) / len(attempts)
    best_score = max(float(a.score) for a in attempts)
    
    # Calculate coins earned from quizzes
    quiz_coins = db.query(UserCoinTransaction).filter(
        and_(
            UserCoinTransaction.user_id == current_user.id,
            UserCoinTransaction.source_type == "quiz_passed"
        )
    ).all()
    total_coins_earned = sum(t.amount for t in quiz_coins)
    
    # Recent attempts (last 10)
    recent_attempts = sorted(attempts, key=lambda x: x.completed_at, reverse=True)[:10]
    
    return {
        "total_attempts": total_attempts,
        "total_passed": total_passed,
        "total_failed": total_failed,
        "pass_rate": round(pass_rate, 2),
        "average_score": round(average_score, 2),
        "best_score": round(best_score, 2),
        "total_coins_earned": total_coins_earned,
        "recent_attempts": [
            {
                "id": attempt.id,
                "lesson_title": attempt.lesson.title,
                "score": float(attempt.score),
                "passed": attempt.passed,
                "completed_at": attempt.completed_at
            }
            for attempt in recent_attempts
        ]
    }


@router.get("/leaderboard")
def get_quiz_leaderboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get quiz leaderboard based on average scores"""
    # This is a simplified leaderboard - you might want to implement more sophisticated ranking
    # Calculate average scores for all users who have taken quizzes
    from sqlalchemy import func
    
    leaderboard = db.query(
        User.id,
        User.first_name,
        User.last_name,
        func.avg(UserQuizAttempt.score).label('average_score'),
        func.count(UserQuizAttempt.id).label('total_attempts'),
        func.sum(UserQuizAttempt.passed.cast(db.Integer)).label('total_passed')
    ).join(UserQuizAttempt).group_by(
        User.id, User.first_name, User.last_name
    ).order_by(
        desc('average_score')
    ).limit(limit).all()
    
    # Find current user's rank
    user_rank = None
    for i, entry in enumerate(leaderboard, 1):
        if entry.id == current_user.id:
            user_rank = i
            break
    
    return {
        "leaderboard": [
            {
                "rank": i + 1,
                "user_id": entry.id,
                "name": f"{entry.first_name} {entry.last_name}",
                "average_score": round(float(entry.average_score), 2),
                "total_attempts": entry.total_attempts,
                "total_passed": entry.total_passed,
                "is_current_user": entry.id == current_user.id
            }
            for i, entry in enumerate(leaderboard)
        ],
        "current_user_rank": user_rank
    }


@router.post("/questions", response_model=QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_question(
    question_data: QuizQuestionCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new quiz question (admin only)"""
    try:
        # Validate lesson exists
        lesson = db.query(Lesson).filter(
            and_(Lesson.id == question_data.lesson_id, Lesson.is_active == True)
        ).first()
        
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson not found"
            )
        
        # Create question
        question = QuizQuestion(
            lesson_id=question_data.lesson_id,
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            explanation=question_data.explanation,
            order_index=question_data.order_index,
            is_active=question_data.is_active,
        )
        
        db.add(question)
        db.commit()
        db.refresh(question)
        
        return QuizQuestionResponse(
            id=question.id,
            lesson_id=question.lesson_id,
            question_text=question.question_text,
            question_type=question.question_type,
            explanation=question.explanation,
            order_index=question.order_index,
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create quiz question: {type(e).__name__}: {e}"
        )


@router.post("/questions/{question_id}/answers", response_model=List[QuizAnswerResponse], status_code=status.HTTP_201_CREATED)
def create_quiz_answer(
    question_id: UUID,
    answer_data: QuizAnswerCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new answer for a quiz question (admin only)"""
    try:
        # Validate question exists
        question = db.query(QuizQuestion).filter(
            and_(QuizQuestion.id == question_id, QuizQuestion.is_active == True)
        ).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz question not found"
            )
        
        # Create answer
        answer = QuizAnswer(
            question_id=question_id,
            answer_text=answer_data.answer_text,
            is_correct=answer_data.is_correct,
            order_index=answer_data.order_index,
        )
        
        db.add(answer)
        db.commit()
        db.refresh(answer)
        
        return [QuizAnswerResponse(
            id=answer.id,
            question_id=answer.question_id,
            answer_text=answer.answer_text,
            order_index=answer.order_index,
        )]
        
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create quiz answer: {type(e).__name__}: {e}"
        )
