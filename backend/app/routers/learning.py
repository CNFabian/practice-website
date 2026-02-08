from datetime import datetime
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from auth import get_current_user, get_current_admin_user
from models import (
    User,
    Module,
    Lesson,
    UserModuleProgress,
    UserLessonProgress,
    QuizQuestion,
    QuizAnswer,
)
from schemas import (
    ModuleResponse,
    ModuleCreate,
    LessonResponse,
    LessonCreate,
    QuizQuestionWithAnswers,
    UserProgressUpdate,
    SuccessResponse,
    LessonMilestoneUpdate,
    LessonCompletionRequest,
    BatchProgressUpdate,
    LessonProgressResponse,
)
from utils import ProgressManager, OnboardingManager
from analytics.event_tracker import EventTracker
import traceback

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/modules", response_model=List[ModuleResponse])
def get_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not OnboardingManager.is_onboarding_complete(db, current_user.id):
            raise HTTPException(
                status_code=400, detail="Please complete onboarding first"
            )

        modules = (
            db.query(Module)
            .filter(Module.is_active.is_(True))
            .order_by(Module.order_index)
            .all()
        )

        out: list[ModuleResponse] = []
        for m in modules:
            lesson_count = (
                db.query(Lesson)
                .filter(and_(Lesson.module_id == m.id, Lesson.is_active.is_(True)))
                .count()
            )

            prog = (
                db.query(UserModuleProgress)
                .filter(
                    and_(
                        UserModuleProgress.user_id == current_user.id,
                        UserModuleProgress.module_id == m.id,
                    )
                )
                .first()
            )
            pct = (
                float(prog.completion_percentage)
                if getattr(prog, "completion_percentage", None) is not None
                else 0.0
            )

            # Calculate module completion states
            module_lessons = (
                db.query(Lesson)
                .filter(and_(Lesson.module_id == m.id, Lesson.is_active.is_(True)))
                .all()
            )
            
            lesson_ids = [lesson.id for lesson in module_lessons]
            
            if lesson_ids:
                lesson_progress_records = (
                    db.query(UserLessonProgress)
                    .filter(
                        and_(
                            UserLessonProgress.user_id == current_user.id,
                            UserLessonProgress.lesson_id.in_(lesson_ids)
                        )
                    )
                    .all()
                )
                
                # Check if all lessons are completed (video watched)
                completed_count = sum(
                    1 for lp in lesson_progress_records if lp.status == "completed"
                )
                all_lessons_completed = completed_count == lesson_count and lesson_count > 0
            else:
                all_lessons_completed = False
            
            # Free roam is available when all lessons (videos) are completed
            free_roam_available = all_lessons_completed
            
            # Get tree state from module progress
            tree_growth_points = getattr(prog, "tree_growth_points", 0) if prog else 0
            tree_current_stage = getattr(prog, "tree_current_stage", 0) if prog else 0
            tree_completed = getattr(prog, "tree_completed", False) if prog else False

            out.append(
                ModuleResponse(
                    id=m.id,
                    title=m.title,
                    description=m.description,
                    thumbnail_url=getattr(m, "thumbnail_url", None),
                    order_index=getattr(m, "order_index", 0),
                    is_active=bool(m.is_active),
                    prerequisite_module_id=getattr(m, "prerequisite_module_id", None),
                    estimated_duration_minutes=getattr(
                        m, "estimated_duration_minutes", None
                    ),
                    difficulty_level=m.difficulty_level,
                    created_at=m.created_at,
                    lesson_count=lesson_count,
                    progress_percentage=pct,
                    all_lessons_completed=all_lessons_completed,
                    free_roam_available=free_roam_available,
                    tree_growth_points=tree_growth_points,
                    tree_current_stage=tree_current_stage,
                    tree_total_stages=5,
                    tree_completed=tree_completed,
                )
            )

        return out

    except HTTPException as e:
        raise e
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"/modules failed: {type(e).__name__}: {e}"
        )


@router.post("/modules", response_model=ModuleResponse, status_code=status.HTTP_201_CREATED)
def create_module(
    module_data: ModuleCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new module (admin only)"""
    try:
        # Validate prerequisite module if provided
        if module_data.prerequisite_module_id:
            prerequisite = (
                db.query(Module)
                .filter(Module.id == module_data.prerequisite_module_id)
                .first()
            )
            if not prerequisite:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Prerequisite module not found"
                )
        
        # Create module
        module = Module(
            title=module_data.title,
            description=module_data.description,
            thumbnail_url=module_data.thumbnail_url,
            order_index=module_data.order_index,
            is_active=module_data.is_active,
            prerequisite_module_id=module_data.prerequisite_module_id,
            estimated_duration_minutes=module_data.estimated_duration_minutes,
            difficulty_level=module_data.difficulty_level,
        )
        
        db.add(module)
        db.commit()
        db.refresh(module)
        
        # Get lesson count (will be 0 for new module)
        lesson_count = (
            db.query(Lesson)
            .filter(and_(Lesson.module_id == module.id, Lesson.is_active == True))
            .count()
        )
        
        return ModuleResponse(
            id=module.id,
            title=module.title,
            description=module.description,
            thumbnail_url=module.thumbnail_url,
            order_index=module.order_index,
            is_active=module.is_active,
            prerequisite_module_id=module.prerequisite_module_id,
            estimated_duration_minutes=module.estimated_duration_minutes,
            difficulty_level=module.difficulty_level,
            created_at=module.created_at,
            lesson_count=lesson_count,
            progress_percentage=0.0,
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create module: {type(e).__name__}: {e}"
        )


@router.get("/modules/{module_id}", response_model=ModuleResponse)
def get_module(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific module by ID"""
    module = (
        db.query(Module)
        .filter(and_(Module.id == module_id, Module.is_active == True))
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
        )

    # Get lesson count
    lesson_count = (
        db.query(Lesson)
        .filter(and_(Lesson.module_id == module.id, Lesson.is_active == True))
        .count()
    )

    # Get user progress
    user_progress = (
        db.query(UserModuleProgress)
        .filter(
            and_(
                UserModuleProgress.user_id == current_user.id,
                UserModuleProgress.module_id == module.id,
            )
        )
        .first()
    )

    progress_percentage = user_progress.completion_percentage if user_progress else 0.0

    # Calculate module completion states
    module_lessons = (
        db.query(Lesson)
        .filter(and_(Lesson.module_id == module.id, Lesson.is_active.is_(True)))
        .all()
    )

    lesson_ids = [lesson.id for lesson in module_lessons]

    if lesson_ids:
        lesson_progress_records = (
            db.query(UserLessonProgress)
            .filter(
                and_(
                    UserLessonProgress.user_id == current_user.id,
                    UserLessonProgress.lesson_id.in_(lesson_ids)
                )
            )
            .all()
        )
        
        # Check if all lessons are completed (video watched)
        completed_count = sum(
            1 for lp in lesson_progress_records if lp.status == "completed"
        )
        all_lessons_completed = completed_count == lesson_count and lesson_count > 0
    else:
        all_lessons_completed = False

    # Free roam is available when all lessons (videos) are completed
    free_roam_available = all_lessons_completed

    # Get module progress for tree state
    module_prog = (
        db.query(UserModuleProgress)
        .filter(
            and_(
                UserModuleProgress.user_id == current_user.id,
                UserModuleProgress.module_id == module.id,
            )
        )
        .first()
    )

    tree_growth_points = getattr(module_prog, "tree_growth_points", 0) if module_prog else 0
    tree_current_stage = getattr(module_prog, "tree_current_stage", 0) if module_prog else 0
    tree_completed = getattr(module_prog, "tree_completed", False) if module_prog else False

    return ModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        thumbnail_url=getattr(module, "thumbnail_url", None),
        order_index=getattr(module, "order_index", 0),
        is_active=bool(module.is_active),
        prerequisite_module_id=getattr(module, "prerequisite_module_id", None),
        estimated_duration_minutes=getattr(module, "estimated_duration_minutes", None),
        difficulty_level=module.difficulty_level,
        created_at=module.created_at,
        lesson_count=lesson_count,
        progress_percentage=progress_percentage,
        all_lessons_completed=all_lessons_completed,
        free_roam_available=free_roam_available,
        tree_growth_points=tree_growth_points,
        tree_current_stage=tree_current_stage,
        tree_total_stages=5,
        tree_completed=tree_completed,
    )


@router.get("/modules/{module_id}/lessons", response_model=List[LessonResponse])
def get_module_lessons(
    module_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all lessons in a module"""
    # Check if module exists and user has access
    module = (
        db.query(Module)
        .filter(and_(Module.id == module_id, Module.is_active == True))
        .first()
    )

    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Module not found"
        )

    # Check prerequisites
    # if module.prerequisite_module_id:
    #     prerequisite_progress = (
    #         db.query(UserModuleProgress)
    #         .filter(
    #             and_(
    #                 UserModuleProgress.user_id == current_user.id,
    #                 UserModuleProgress.module_id == module.prerequisite_module_id,
    #                 UserModuleProgress.status == "completed",
    #             )
    #         )
    #         .first()
    #     )

    #     if not prerequisite_progress:
    #         raise HTTPException(
    #             status_code=status.HTTP_403_FORBIDDEN,
    #             detail="Please complete the prerequisite module first",
    #         )

    # Get lessons
    lessons = (
        db.query(Lesson)
        .filter(and_(Lesson.module_id == module_id, Lesson.is_active == True))
        .order_by(Lesson.order_index)
        .all()
    )

    lesson_responses = []
    for lesson in lessons:
        # Get user progress for this lesson
        user_progress = (
            db.query(UserLessonProgress)
            .filter(
                and_(
                    UserLessonProgress.user_id == current_user.id,
                    UserLessonProgress.lesson_id == lesson.id,
                )
            )
            .first()
        )

        is_completed = user_progress.status == "completed" if user_progress else False
        progress_seconds = user_progress.video_progress_seconds if user_progress else 0
        # Check if Grow Your Nest has been played for this lesson (quiz_attempts > 0 means it was played)
        grow_your_nest_played = user_progress.quiz_attempts > 0 if user_progress else False

        lesson_responses.append(
            LessonResponse(
                id=lesson.id,
                module_id=lesson.module_id,
                title=lesson.title,
                description=lesson.description,
                image_url=lesson.image_url,
                video_url=lesson.video_url,
                video_transcription=lesson.video_transcription,
                order_index=lesson.order_index,
                is_active=lesson.is_active,
                estimated_duration_minutes=lesson.estimated_duration_minutes,
                nest_coins_reward=lesson.nest_coins_reward,
                created_at=lesson.created_at,
                is_completed=is_completed,
                progress_seconds=progress_seconds,
                grow_your_nest_played=grow_your_nest_played,
            )
        )

    return lesson_responses


@router.post("/modules/{module_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    module_id: UUID,
    lesson_data: LessonCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new lesson for a module (admin only)"""
    try:
        # Validate module exists
        module = (
            db.query(Module)
            .filter(and_(Module.id == module_id, Module.is_active == True))
            .first()
        )
        
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        # Create lesson
        lesson = Lesson(
            module_id=module_id,
            title=lesson_data.title,
            description=lesson_data.description,
            image_url=lesson_data.image_url,
            video_url=lesson_data.video_url,
            video_transcription=lesson_data.video_transcription,
            order_index=lesson_data.order_index,
            is_active=lesson_data.is_active,
            estimated_duration_minutes=lesson_data.estimated_duration_minutes,
            nest_coins_reward=lesson_data.nest_coins_reward,
        )
        
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
        
        return LessonResponse(
            id=lesson.id,
            module_id=lesson.module_id,
            title=lesson.title,
            description=lesson.description,
            image_url=lesson.image_url,
            video_url=lesson.video_url,
            video_transcription=lesson.video_transcription,
            order_index=lesson.order_index,
            is_active=lesson.is_active,
            estimated_duration_minutes=lesson.estimated_duration_minutes,
            nest_coins_reward=lesson.nest_coins_reward,
            created_at=lesson.created_at,
            is_completed=False,
            progress_seconds=0,
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create lesson: {type(e).__name__}: {e}"
        )


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific lesson by ID"""
    lesson = (
        db.query(Lesson)
        .filter(and_(Lesson.id == lesson_id, Lesson.is_active == True))
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    # Check module prerequisites
    # module = db.query(Module).filter(Module.id == lesson.module_id).first()
    # if module and module.prerequisite_module_id:
    #     prerequisite_progress = (
    #         db.query(UserModuleProgress)
    #         .filter(
    #             and_(
    #                 UserModuleProgress.user_id == current_user.id,
    #                 UserModuleProgress.module_id == module.prerequisite_module_id,
    #                 UserModuleProgress.status == "completed",
    #             )
    #         )
    #         .first()
    #     )

    #     if not prerequisite_progress:
    #         raise HTTPException(
    #             status_code=status.HTTP_403_FORBIDDEN,
    #             detail="Please complete the prerequisite module first",
    #         )

    # Get user progress for this lesson
    user_progress = (
        db.query(UserLessonProgress)
        .filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                UserLessonProgress.lesson_id == lesson.id,
            )
        )
        .first()
    )

    is_completed = user_progress.status == "completed" if user_progress else False
    progress_seconds = user_progress.video_progress_seconds if user_progress else 0
    
    # Check if Grow Your Nest has been played for this lesson
    grow_your_nest_played = user_progress.quiz_attempts > 0 if user_progress else False


    # Mark lesson as started if not already
    if not user_progress:
        ProgressManager.update_lesson_progress(
            db, current_user.id, lesson_id, status="in_progress"
        )
        # Track lesson started event
        EventTracker.track_lesson_started(db, current_user.id, lesson_id, lesson.title)
    elif user_progress.status == "not_started":
        ProgressManager.update_lesson_progress(
            db, current_user.id, lesson_id, status="in_progress"
        )
        # Track lesson started event
        EventTracker.track_lesson_started(db, current_user.id, lesson_id, lesson.title)

    return LessonResponse(
    id=lesson.id,
    module_id=lesson.module_id,
    title=lesson.title,
    description=lesson.description,
    image_url=lesson.image_url,
    video_url=lesson.video_url,
    video_transcription=lesson.video_transcription,
    order_index=lesson.order_index,
    is_active=lesson.is_active,
    estimated_duration_minutes=lesson.estimated_duration_minutes,
    nest_coins_reward=lesson.nest_coins_reward,
    created_at=lesson.created_at,
    is_completed=is_completed,
    progress_seconds=progress_seconds,
    grow_your_nest_played=grow_your_nest_played,
)


@router.post("/lessons/{lesson_id}/progress", response_model=SuccessResponse)
def update_lesson_progress(
    lesson_id: UUID,
    progress_data: UserProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user's progress on a lesson"""
    if progress_data.lesson_id != lesson_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Lesson ID mismatch"
        )

    lesson = (
        db.query(Lesson)
        .filter(and_(Lesson.id == lesson_id, Lesson.is_active == True))
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    # Update progress
    ProgressManager.update_lesson_progress(
        db,
        current_user.id,
        lesson_id,
        video_progress_seconds=progress_data.video_progress_seconds,
        status="in_progress",
    )
    
    # Track lesson progress event
    EventTracker.track_lesson_progress(db, current_user.id, lesson_id, progress_data.video_progress_seconds)

    return SuccessResponse(message="Progress updated successfully")


@router.post("/lessons/{lesson_id}/milestone", response_model=LessonProgressResponse)
@limiter.limit("30/minute")  # Max 30 milestone calls per user per minute
def track_lesson_milestone(
    request: Request,
    lesson_id: UUID,
    milestone_data: LessonMilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Track lesson milestone reached (25%, 50%, 75%, 90%).
    Optimized endpoint - only called at key progress points.
    Auto-completes lesson at 90% milestone.
    
    Rate Limited: 30 requests per minute per user (prevents spam/abuse).
    """
    if milestone_data.lesson_id != lesson_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson ID mismatch"
        )
    
    # Validate lesson
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == lesson_id, Lesson.is_active == True)
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found"
        )
    
    # Get or create progress
    progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not progress:
        progress = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            first_started_at=datetime.now(),
            status="in_progress"
        )
        db.add(progress)
    
    # Update progress data
    progress.content_type_consumed = milestone_data.content_type
    progress.time_spent_seconds = milestone_data.time_spent_seconds
    progress.last_accessed_at = datetime.now()
    
    if milestone_data.video_progress_seconds is not None:
        progress.video_progress_seconds = milestone_data.video_progress_seconds
    
    if milestone_data.transcript_progress_percentage is not None:
        progress.transcript_progress_percentage = milestone_data.transcript_progress_percentage
    
    # Track milestone
    milestones = set(progress.milestones_reached.split(',') if progress.milestones_reached else [])
    is_new_milestone = str(milestone_data.milestone) not in milestones
    milestones.add(str(milestone_data.milestone))
    progress.milestones_reached = ','.join(sorted(milestones, key=int))
    
    # Track milestone event (only if new)
    if is_new_milestone:
        _, created = EventTracker.track_lesson_milestone(
            db=db,
            user_id=current_user.id,
            lesson_id=lesson_id,
            lesson_title=lesson.title,
            milestone=milestone_data.milestone,
            content_type=milestone_data.content_type
        )
    
    # Auto-complete at 90% milestone
    auto_completed = False
    if milestone_data.milestone >= 90 and progress.status != "completed":
        progress.status = "completed"
        progress.completed_at = datetime.now()
        progress.completion_method = "auto"
        auto_completed = True
        
        # Track event
        _, created = EventTracker.track_lesson_completed(db, current_user.id, lesson_id, lesson.title)
        
        # Update module progress
        ProgressManager.update_module_progress(db, current_user.id, lesson_id)
    
    db.commit()
    db.refresh(progress)
    
    # Calculate completion percentage
    milestone_list = [int(m) for m in progress.milestones_reached.split(',') if m]
    completion_pct = max(milestone_list) if milestone_list else 0
    
    return LessonProgressResponse(
        lesson_id=lesson_id,
        status=progress.status,
        milestones_reached=milestone_list,
        completion_percentage=Decimal(str(completion_pct)),
        auto_completed=auto_completed,
        message="Milestone tracked successfully"
    )


@router.post("/lessons/{lesson_id}/complete", response_model=SuccessResponse)
def complete_lesson(
    lesson_id: UUID,
    completion_data: Optional[LessonCompletionRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually mark a lesson as completed.
    Can be called by user clicking "Mark Complete" button.
    """
    lesson = db.query(Lesson).filter(
        and_(Lesson.id == lesson_id, Lesson.is_active == True)
    ).first()

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )
    
    # Get or create progress
    progress = db.query(UserLessonProgress).filter(
        and_(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id
        )
    ).first()
    
    if not progress:
        progress = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            first_started_at=datetime.now()
        )
        db.add(progress)
    
    # Update with completion data if provided
    if completion_data:
        if completion_data.video_progress_seconds is not None:
            progress.video_progress_seconds = completion_data.video_progress_seconds
        if completion_data.transcript_progress_percentage is not None:
            progress.transcript_progress_percentage = completion_data.transcript_progress_percentage
        if completion_data.time_spent_seconds:
            progress.time_spent_seconds = completion_data.time_spent_seconds
        if completion_data.content_type:
            progress.content_type_consumed = completion_data.content_type
        progress.completion_method = completion_data.completion_method
    else:
        progress.completion_method = "manual"
    
    # Mark as completed
    if progress.status != "completed":
        progress.status = "completed"
        progress.completed_at = datetime.now()
        progress.last_accessed_at = datetime.now()
        
        # Track event
        _, created = EventTracker.track_lesson_completed(db, current_user.id, lesson_id, lesson.title)
        
        # Update module progress
        ProgressManager.update_module_progress(db, current_user.id, lesson_id)
    
    db.commit()

    return SuccessResponse(message="Lesson completed successfully")


@router.post("/progress/batch", response_model=SuccessResponse)
@limiter.limit("20/minute")  # Max 20 batch updates per user per minute
def update_progress_batch(
    request: Request,
    batch_data: BatchProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch update progress for multiple lessons in a single request.
    Highly optimized - reduces API calls by up to 90%.
    Used when syncing multiple lessons or on page unload.
    
    Rate Limited: 20 requests per minute per user (prevents spam/abuse).
    """
    results = []
    completed_lessons = []
    
    for item in batch_data.items:
        # Validate lesson exists
        lesson = db.query(Lesson).filter(
            and_(Lesson.id == item.lesson_id, Lesson.is_active == True)
        ).first()
        
        if not lesson:
            results.append({
                "lesson_id": str(item.lesson_id),
                "status": "not_found"
            })
            continue
        
        # Get or create progress
        progress = db.query(UserLessonProgress).filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                UserLessonProgress.lesson_id == item.lesson_id
            )
        ).first()
        
        if not progress:
            progress = UserLessonProgress(
                user_id=current_user.id,
                lesson_id=item.lesson_id,
                first_started_at=datetime.now(),
                status="in_progress"
            )
            db.add(progress)
        
        # Update fields
        if item.content_type:
            progress.content_type_consumed = item.content_type
        if item.video_progress_seconds is not None:
            progress.video_progress_seconds = item.video_progress_seconds
        if item.transcript_progress_percentage is not None:
            progress.transcript_progress_percentage = item.transcript_progress_percentage
        if item.time_spent_seconds:
            progress.time_spent_seconds = item.time_spent_seconds
        
        # Track milestone if provided
        if item.milestone:
            milestones = set(progress.milestones_reached.split(',') if progress.milestones_reached else [])
            milestones.add(str(item.milestone))
            progress.milestones_reached = ','.join(sorted(milestones, key=int))
        
        progress.last_accessed_at = datetime.now()
        
        # Handle completion
        if item.completed and progress.status != "completed":
            progress.status = "completed"
            progress.completed_at = datetime.now()
            progress.completion_method = "auto"
            completed_lessons.append((item.lesson_id, lesson.title))
        
        results.append({
            "lesson_id": str(item.lesson_id),
            "status": "updated"
        })
    
    db.commit()
    
    # Track completion events (after commit)
    for lesson_id, lesson_title in completed_lessons:
        _, created = EventTracker.track_lesson_completed(db, current_user.id, lesson_id, lesson_title)
        ProgressManager.update_module_progress(db, current_user.id, lesson_id)
    
    return SuccessResponse(
        message=f"Batch updated {len(results)} lessons",
        data={
            "results": results,
            "completed_count": len(completed_lessons)
        }
    )


@router.get("/lessons/{lesson_id}/quiz", response_model=List[QuizQuestionWithAnswers])
def get_lesson_quiz(
    lesson_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get quiz questions for a lesson"""
    lesson = (
        db.query(Lesson)
        .filter(and_(Lesson.id == lesson_id, Lesson.is_active == True))
        .first()
    )

    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found"
        )

    # NOTE: Gate removed - users can access quiz anytime
    # This endpoint is kept for backward compatibility but quiz is now part of mini-game
    
    # Get quiz questions with answers
    questions = (
        db.query(QuizQuestion)
        .filter(
            and_(QuizQuestion.lesson_id == lesson_id, QuizQuestion.is_active == True)
        )
        .order_by(QuizQuestion.order_index)
        .all()
    )

    quiz_questions = []
    for question in questions:
        answers = (
            db.query(QuizAnswer)
            .filter(QuizAnswer.question_id == question.id)
            .order_by(QuizAnswer.order_index)
            .all()
        )

        # Don't include is_correct in the response for security
        answer_responses = [
            {
                "id": answer.id,
                "question_id": answer.question_id,
                "answer_text": answer.answer_text,
                "order_index": answer.order_index,
            }
            for answer in answers
        ]

        quiz_questions.append(
            QuizQuestionWithAnswers(
                id=question.id,
                lesson_id=question.lesson_id,
                question_text=question.question_text,
                question_type=question.question_type,
                explanation=question.explanation,
                order_index=question.order_index,
                answers=answer_responses,
            )
        )

    return quiz_questions


@router.get("/progress/summary")
def get_learning_progress_summary(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get a summary of user's learning progress"""
    # Overall module progress
    module_progress = (
        db.query(UserModuleProgress)
        .filter(UserModuleProgress.user_id == current_user.id)
        .all()
    )

    total_modules = db.query(Module).filter(Module.is_active == True).count()
    completed_modules = len([p for p in module_progress if p.status == "completed"])
    in_progress_modules = len([p for p in module_progress if p.status == "in_progress"])

    # Overall lesson progress
    lesson_progress = (
        db.query(UserLessonProgress)
        .join(Lesson)
        .join(Module)
        .filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                Lesson.is_active == True,
                Module.is_active == True,
            )
        )
        .all()
    )

    total_lessons = (
        db.query(Lesson)
        .join(Module)
        .filter(and_(Lesson.is_active == True, Module.is_active == True))
        .count()
    )
    completed_lessons = len([p for p in lesson_progress if p.status == "completed"])
    in_progress_lessons = len([p for p in lesson_progress if p.status == "in_progress"])

    # Recent activity
    recent_completions = (
        db.query(UserLessonProgress)
        .join(Lesson)
        .filter(
            and_(
                UserLessonProgress.user_id == current_user.id,
                UserLessonProgress.status == "completed",
                UserLessonProgress.completed_at.isnot(None),
            )
        )
        .order_by(desc(UserLessonProgress.completed_at))
        .limit(5)
        .all()
    )

    return {
        "modules": {
            "total": total_modules,
            "completed": completed_modules,
            "in_progress": in_progress_modules,
            "not_started": total_modules - completed_modules - in_progress_modules,
            "completion_rate": (completed_modules / total_modules * 100)
            if total_modules > 0
            else 0,
        },
        "lessons": {
            "total": total_lessons,
            "completed": completed_lessons,
            "in_progress": in_progress_lessons,
            "not_started": total_lessons - completed_lessons - in_progress_lessons,
            "completion_rate": (completed_lessons / total_lessons * 100)
            if total_lessons > 0
            else 0,
        },
        "recent_completions": [
            {
                "lesson_id": p.lesson_id,
                "lesson_title": p.lesson.title,
                "completed_at": p.completed_at,
            }
            for p in recent_completions
        ],
    }
