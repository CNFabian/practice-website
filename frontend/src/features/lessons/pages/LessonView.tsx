/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Module, Lesson } from '../../../types/modules';
import { useLesson, useLessonQuiz } from '../hooks/useLearningQueries';
import { useCompleteLesson } from '../hooks/useCompleteLesson';
import { useUncompleteLesson } from '../hooks/useUncompleteLesson';
import { useUpdateLessonProgress } from '../hooks/useUpdateLessonProgress';
import { PublicBackground, VideoProgressIcon, DocumentProgressIcon, BackArrow, BackArrowHover } from '../../../assets';
import { buildLessonModeInitData } from '../hooks/useGrowYourNest';
import type { GYNMinigameInitData } from '../../../types/growYourNest.types';
import { useTrackLessonMilestone } from '../hooks/useTrackLessonMilestone';
import type { BatchProgressItem } from '../../../services/learningAPI';
import GYNLessonButton from '../components/GYNLessonButton';
import GYNUnlockModal from '../components/GYNUnlockModal';
import LessonCoinCounter from '../components/LessonCoinCounter';
import { getLessonQuestions } from '../../../services/growYourNestAPI';
import gameManager from '../../../game/managers/GameManager';
import { mockGYNPlayedLessons, mockAwardedQuestionIds } from '../../../services/mockLearningData';

// YouTube Player Type Definitions
interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  getVideoUrl(): string;
  destroy(): void;
}

interface YouTubePlayerEvent {
  target: YouTubePlayer;
  data: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YT_PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
};

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
  onLaunchMinigame?: () => void;
  onNextLesson?: (lessonId: number, moduleBackendId: string) => void;
  addProgressItem?: (item: BatchProgressItem) => void;
  flushProgress?: () => Promise<boolean>;
}

interface BackendQuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  order_index: number;
  is_correct?: boolean;
}

interface BackendQuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: string;
  explanation: string;
  order_index: number;
  answers: BackendQuizAnswer[];
}

// ═══════════════════════════════════════════════════════════
// MOCK COMPLETION TRACKER — TODO: REMOVE BEFORE PRODUCTION
// Persists mock lesson completions across component remounts
// so the GYN button stays Active after navigating away and back.
// Clears on full page refresh (not stored in localStorage).
// ═══════════════════════════════════════════════════════════
const mockCompletedLessons = new Set<string>();

const MOCK_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "What is the minimum down payment required for a conventional loan?",
    options: [
      { id: "a", text: "3%", isCorrect: true },
      { id: "b", text: "5%", isCorrect: false },
      { id: "c", text: "10%", isCorrect: false },
      { id: "d", text: "20%", isCorrect: false }
    ],
    explanation: {
      correct: "Correct! Conventional loans can require as little as 3% down payment.",
      incorrect: {
        "b": { 
          why_wrong: "While 5% is a common down payment amount, conventional loans can go as low as 3%.",
          confusion_reason: "Many people think 5% is the minimum because it's often quoted by lenders."
        },
        "c": { 
          why_wrong: "10% is higher than the minimum required for conventional loans.",
          confusion_reason: "This might be confused with other loan types that require higher down payments."
        },
        "d": { 
          why_wrong: "20% is the amount needed to avoid PMI, but not the minimum down payment.",
          confusion_reason: "This is often mentioned because it eliminates private mortgage insurance."
        }
      }
    }
  }
];

const transformQuizQuestions = (backendQuestions: BackendQuizQuestion[]) => {
  if (!backendQuestions || !Array.isArray(backendQuestions)) {
    console.warn('⚠️ Invalid quiz questions data');
    return [];
  }

  return backendQuestions.map((q: BackendQuizQuestion, index: number) => {
    const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);
    
    let correctAnswerIndex = sortedAnswers.findIndex(ans => ans.is_correct === true);
    
    // Backend intentionally omits is_correct for security (server-side validation only).
    // Fallback to 0 — this only affects the quiz info display count, not answer validation.
    if (correctAnswerIndex === -1) {
      correctAnswerIndex = 0;
    }
    
    return {
      id: index + 1, 
      question: q.question_text,
      options: sortedAnswers.map((answer, answerIndex) => ({
        id: String.fromCharCode(97 + answerIndex),
        text: answer.answer_text,
        isCorrect: answer.is_correct !== undefined ? answer.is_correct : answerIndex === 0
      })),
      explanation: {
        correct: q.explanation || "Correct! Well done.",
        incorrect: {
          ...Object.fromEntries(
            sortedAnswers
              .map((answer, idx) => ({
                id: String.fromCharCode(97 + idx),
                answer
              }))
              .filter(item => !item.answer.is_correct && item.id !== String.fromCharCode(97 + correctAnswerIndex))
              .map(item => [
                item.id,
                { 
                  why_wrong: "This is not the correct answer. Please review the lesson content.",
                  confusion_reason: "This option may seem correct but lacks the key elements of the right answer."
                }
              ])
          )
        }
      }
    };
  });
};

// Extract YouTube video ID from URL
const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  console.log('🔍 [YouTube] Extracting video ID from URL:', url);
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      console.log('✅ [YouTube] Extracted video ID:', match[1]);
      return match[1];
    }
  }
  
  console.warn('⚠️ [YouTube] Could not extract video ID from URL:', url);
  return null;
};

// Helper function to get player state name
const getPlayerStateName = (state: number): string => {
  const stateNames: { [key: number]: string } = {
    [-1]: 'UNSTARTED',
    [0]: 'ENDED',
    [1]: 'PLAYING',
    [2]: 'PAUSED',
    [3]: 'BUFFERING',
    [5]: 'CUED'
  };
  return stateNames[state] || 'UNKNOWN';
};

// Milestone thresholds for progress tracking
const MILESTONE_THRESHOLDS = [25, 50, 75, 90];

const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  module,
  onBack,
  onLaunchMinigame,
  onNextLesson,
  addProgressItem,
  flushProgress
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'reading'>('video');
  const [isBackHovered, setIsBackHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // YouTube Player state and refs
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isYouTubeAPIReady, setIsYouTubeAPIReady] = useState(false);
  const [_isPlayerReady, setIsPlayerReady] = useState(false);
  const [_currentVideoTime, setCurrentVideoTime] = useState(0);
  const [_videoDuration, setVideoDuration] = useState(0);
  const [_playerState, setPlayerState] = useState<number>(YT_PLAYER_STATES.UNSTARTED);
  const [_playbackRate, setPlaybackRate] = useState(1);
  const [videoCompleted, setVideoCompleted] = useState(false); // Track if video is complete
  const [readingCompleted, setReadingCompleted] = useState(false); // Track if reading is marked complete

  // Milestone tracking refs
  const milestonesReachedRef = useRef<Set<number>>(new Set());
  const lessonStartTimeRef = useRef<number>(Date.now());
  const lastProgressSyncRef = useRef<number>(0);

  // Auto-completion guard — prevents concurrent /progress requests from
  // racing with /complete and causing backend transaction conflicts.
  const autoCompletedRef = useRef<boolean>(false);

  // GYN "just unlocked" notification state
  const [showGYNUnlockedNotification, setShowGYNUnlockedNotification] = useState(false);
  const [showGYNUnlockModal, setShowGYNUnlockModal] = useState(false);
  const [gynAlreadyPlayed, setGynAlreadyPlayed] = useState(false);
  const prevIsCompletedRef = useRef<boolean | undefined>(undefined);


  // Uncomplete confirmation modal state
  const [showUncompleteModal, setShowUncompleteModal] = useState(false);
  const gynNotificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload the background image on mount so it's in the browser cache
  // before any background-setting logic runs. This prevents the brief white
  // flash that occurs when the image URL is set but the image hasn't loaded yet.
  useEffect(() => {
    const img = new Image();
    img.src = PublicBackground;
  }, []);

  useEffect(() => {
    const bgElement = document.getElementById('section-background');

    // Apply the LessonView background to the shared DOM element.
    // Uses interval-based enforcement for 3s to survive any late Phaser
    // setBackgroundImage()/clearBackgroundImage() calls.
    //
    // IMPORTANT: This cleanup must NOT clear the background. LessonView can
    // unmount/remount during Phaser game recreation (stale canvas detection)
    // while navState is still 'lesson'. If cleanup cleared the background,
    // the user would see white during the remount gap. Background clearing
    // is handled by ModulesPage's useEffect when navState changes away from 'lesson'.
    const backgroundValue = `url(${PublicBackground}) center / cover no-repeat`;
    const applyBackground = () => {
      if (!bgElement) return;
      bgElement.style.setProperty('background', backgroundValue, 'important');
    };

    applyBackground();
    const intervalId = setInterval(applyBackground, 100);
    const stopId = setTimeout(() => clearInterval(intervalId), 3000);

    // MutationObserver: re-apply background if anything clears/changes it
    // after the enforcement window. This catches late Phaser scene shutdowns
    // or any other code that modifies #section-background unexpectedly.
    let observer: MutationObserver | null = null;
    if (bgElement) {
      observer = new MutationObserver(() => {
        const current = bgElement.style.getPropertyValue('background');
        if (!current || !current.includes(PublicBackground)) {
          bgElement.style.setProperty('background', backgroundValue, 'important');
        }
      });
      observer.observe(bgElement, { attributes: true, attributeFilter: ['style'] });
    }

    // Reset all per-lesson state when lesson changes
    setVideoCompleted(false);
    setReadingCompleted(false);
    setGynAlreadyPlayed(false);
    milestonesReachedRef.current.clear();
    lessonStartTimeRef.current = Date.now();
    lastProgressSyncRef.current = 0;
    autoCompletedRef.current = false;
    setShowGYNUnlockedNotification(false);
    setShowGYNUnlockModal(false);
    prevIsCompletedRef.current = undefined;
    if (gynNotificationTimerRef.current) {
      clearTimeout(gynNotificationTimerRef.current);
      gynNotificationTimerRef.current = null;
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(stopId);
      if (observer) observer.disconnect();
      // Do NOT clear #section-background here — see comment above
    };
  }, [lesson.id]);

  // Load YouTube IFrame API
  useEffect(() => {
    console.log('🎬 [YouTube API] Initializing YouTube IFrame API...');
    
    if (window.YT && window.YT.Player) {
      console.log('✅ [YouTube API] API already loaded');
      setIsYouTubeAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    
    tag.onload = () => {
      console.log('📦 [YouTube API] Script loaded successfully');
    };
    
    tag.onerror = () => {
      console.error('❌ [YouTube API] Failed to load script');
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('✅ [YouTube API] API is ready!');
      setIsYouTubeAPIReady(true);
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  if (!lesson || !module) {
    console.error('❌ LessonView: Missing required props!');
    return <div className="p-8 text-center text-status-red">Missing lesson or module data</div>;
  }

  const isValidBackendId = useMemo(() => {
    const id = lesson?.backendId;
    if (!id) {
      console.warn('⚠️ No backendId found for lesson:', lesson?.id, lesson?.title);
      return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(String(id));
    
    if (!isValidUUID) {
      console.warn('⚠️ Backend ID is not a valid UUID format:', id);
      return false;
    }
    
    console.log('✅ Valid backend UUID for lesson:', id);
    return true;
  }, [lesson?.backendId, lesson?.id, lesson?.title]);

  const { 
    data: backendLessonData, 
    isLoading: isLoadingLesson, 
    error: _lessonError,
  } = useLesson(isValidBackendId ? lesson.backendId! : '');

  // Derive completion state from backend data
  // ═══════════════════════════════════════════════════════════
  // MOCK LESSON OVERRIDE — TODO: REMOVE BEFORE PRODUCTION
  // Mock endpoints skip mutations, so is_completed never flips
  // in backendLessonData. We use local video/reading completion
  // state to drive the GYN button for mock lessons only.
  // ═══════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════
  // MOCK LESSON OVERRIDE — TODO: REMOVE BEFORE PRODUCTION
  // Mock endpoints skip mutations, so is_completed never flips
  // in backendLessonData. We use a module-level Set to persist
  // mock completions across component remounts, plus local
  // video/reading state for the initial completion trigger.
  // ═══════════════════════════════════════════════════════════
  const isMockLesson = useMemo(() => {
    const id = lesson?.backendId || '';
    return /^0{8}-0{4}-4000-b000-0{11}[0-9a-f]$/i.test(id);
  }, [lesson?.backendId]);

  // Derive completion state from backend data + local completion signals.
  // For real lessons, we also check videoCompleted/readingCompleted because
  // the backend may take several seconds to commit the completion after the
  // /complete API returns 200. Without these local signals, a stale refetch
  // can overwrite the optimistic update and briefly revert the UI.
  const isCompleted = isMockLesson
    ? (videoCompleted || readingCompleted || mockCompletedLessons.has(lesson.backendId || '') || !!backendLessonData?.is_completed)
    : (!!backendLessonData?.is_completed || videoCompleted || readingCompleted);

  // Persist mock completion so it survives remounts — TODO: REMOVE BEFORE PRODUCTION
  useEffect(() => {
    if (isMockLesson && isCompleted && lesson.backendId) {
      mockCompletedLessons.add(lesson.backendId);
    }
  }, [isMockLesson, isCompleted, lesson.backendId]);
  // ═══════════════════════════════════════════════════════════
  // GYN "JUST UNLOCKED" modal — detects is_completed
  // transitioning from falsy → true while GYN not yet played.
  // Also triggered explicitly by handleMarkComplete's onSuccess
  // to cover cases where isCompleted was already true.
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const gynPlayed = !!backendLessonData?.grow_your_nest_played;
    const wasCompleted = prevIsCompletedRef.current;
    const modalKey = lesson.backendId ? `nestnav_gyn_modal_shown_${lesson.backendId}` : null;
    const alreadyShown = modalKey ? localStorage.getItem(modalKey) === 'true' : false;

    console.log('🔍 [GYN Modal Effect] wasCompleted:', wasCompleted, '| isCompleted:', isCompleted, '| gynPlayed:', gynPlayed, '| alreadyShown:', alreadyShown);

    if (!wasCompleted && isCompleted && !gynPlayed && !alreadyShown) {
      console.log('🎮 [GYN Modal Effect] Showing GYN unlock modal!');
      setShowGYNUnlockModal(true);

      if (modalKey) {
        localStorage.setItem(modalKey, 'true');
      }
    }

    // Track current value for next render
    prevIsCompletedRef.current = isCompleted;

    return () => {
      if (gynNotificationTimerRef.current) {
        clearTimeout(gynNotificationTimerRef.current);
        gynNotificationTimerRef.current = null;
      }
    };
  }, [isCompleted, backendLessonData?.grow_your_nest_played, lesson.backendId]);

  // ═══════════════════════════════════════════════════════════
  // GYN QUESTIONS — Fetched on-demand in handleGYNPlay when the user
  // clicks the GYN button. Pre-fetching via useGYNLessonQuestions was
  // removed because the optimistic update in useCompleteLesson sets
  // is_completed=true before the backend has committed, causing the
  // /questions endpoint to return 400 ("Please complete the lesson
  // video first") in a race condition.
  // ═══════════════════════════════════════════════════════════

  const { 
    data: quizData,
    isLoading: _isLoadingQuiz,
    error: _quizError
  } = useLessonQuiz(isValidBackendId ? lesson.backendId! : '');
  
  const { mutate: completeLessonMutation } = useCompleteLesson(
    isValidBackendId ? lesson.backendId! : '',
    module?.backendId || ''
  );

  const { mutate: uncompleteLessonMutation } = useUncompleteLesson(
    isValidBackendId ? lesson.backendId! : '',
    module?.backendId || ''
  );

  const { mutate: updateLessonProgressMutation } = useUpdateLessonProgress(
    isValidBackendId ? lesson.backendId! : '', 
    module?.backendId || ''
  );

  // Milestone tracking mutation hook (Step 5) — handles cache invalidation on auto-complete
  const { mutate: trackMilestoneMutation } = useTrackLessonMilestone(
    isValidBackendId ? lesson.backendId! : '',
    module?.backendId || ''
  );

  // Milestone-based progress tracking — fires at 25%, 50%, 75%, 90% instead of every second
  const checkAndTrackMilestones = useCallback((currentTime: number, duration: number) => {
    if (!isValidBackendId || !lesson.backendId || duration <= 0) return;
    
    const progressPercent = (currentTime / duration) * 100;
    const timeSpentSeconds = Math.floor((Date.now() - lessonStartTimeRef.current) / 1000);
    
    for (const milestone of MILESTONE_THRESHOLDS) {
      if (progressPercent >= milestone && !milestonesReachedRef.current.has(milestone)) {
        milestonesReachedRef.current.add(milestone);
        
        console.log(`🏁 [Milestone] Reached ${milestone}% at ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
        
        trackMilestoneMutation(
          {
            lessonId: lesson.backendId!,
            milestone,
            contentType: 'video',
            videoProgressSeconds: Math.floor(currentTime),
            transcriptProgressPercentage: null,
            timeSpentSeconds,
          },
          {
            onSuccess: (response) => {
              console.log(`✅ [Milestone] ${milestone}% tracked successfully`, response);
              
              if (response.auto_completed) {
                console.log('🎉 [Milestone] Lesson auto-completed at 90%!');
              }
            },
            onError: (error) => {
              console.error(`❌ [Milestone] Failed to track ${milestone}%:`, error);
              milestonesReachedRef.current.delete(milestone);
            },
          }
        );
      }
    }
  }, [isValidBackendId, lesson.backendId, trackMilestoneMutation]);

  // @ts-expect-error Quiz questions computed for GYN minigame use
  const _transformedQuizQuestions = useMemo(() => {
    if (quizData && Array.isArray(quizData) && quizData.length > 0) {
      console.log('🔄 Using backend quiz questions:', quizData.length);
      return transformQuizQuestions(quizData);
    } else {
      console.log('🔄 Using mock quiz questions for instant access:', MOCK_QUIZ_QUESTIONS.length);
      return MOCK_QUIZ_QUESTIONS;
    }
  }, [quizData]);

  const currentLessonIndex = useMemo(() => {
    if (!module.lessons || module.lessons.length === 0) {
      return -1;
    }
    
    if (lesson.backendId) {
      const idx = module.lessons.findIndex(l => l.backendId === lesson.backendId);
      if (idx !== -1) return idx;
    }
    
    let idx = module.lessons.findIndex(l => l.id === lesson.id);
    if (idx === -1) {
      idx = module.lessons.findIndex(l => String(l.id) === String(lesson.id));
    }
    
    return idx;
  }, [module.lessons, lesson.id, lesson.backendId]);

  // Extract YouTube video ID
  const videoUrl = backendLessonData?.video_url || lesson.videoUrl;
  const youtubeVideoId = useMemo(() => {
    return extractYouTubeVideoId(videoUrl || '');
  }, [videoUrl]);

  const handleVideoProgress = useCallback((seconds: number) => {
    if (!isValidBackendId || !module?.backendId) {
      console.warn('⚠️ Cannot update progress - invalid backend IDs');
      return;
    }
    
    console.log('📈 [Progress Update] Updating backend with progress:', seconds, 'seconds');
    
    updateLessonProgressMutation({ 
      lessonId: lesson.backendId!, 
      videoProgressSeconds: seconds 
    }, {
      onSuccess: () => {
        console.log('✅ [Progress Update] Backend updated successfully');
      },
      onError: (error: Error) => {
        console.error('❌ [Progress Update] Failed to update backend:', error);
      }
    });
  }, [isValidBackendId, module?.backendId, updateLessonProgressMutation, lesson?.backendId]);

  // YouTube Player Event Handlers
  const onPlayerReady = useCallback((event: YouTubePlayerEvent) => {
    console.log('🎉 [YouTube Player] Player is ready!');
    
    const player = event.target;
    const duration = player.getDuration();
    const videoUrl = player.getVideoUrl();
    
    console.log('⏱️ [YouTube Player] Video duration:', duration, 'seconds');
    console.log('🔗 [YouTube Player] Video URL:', videoUrl);
    
    setVideoDuration(duration);
    setIsPlayerReady(true);
    setVideoCompleted(false);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (player && player.getCurrentTime) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const state = player.getPlayerState();
        
        // Stop video 3 seconds before end to prevent recommendations, then hide player
        if (duration > 0 && currentTime >= duration - 3 && state === YT_PLAYER_STATES.PLAYING) {
          console.log('🛑 [YouTube Player] Stopping video at', currentTime.toFixed(2), 'to prevent recommendations');
          player.pauseVideo();

          setVideoCompleted(true);
          autoCompletedRef.current = true;
          console.log('✅ [YouTube Player] VIDEO COMPLETED - Player hidden!');

          // NOTE: Do NOT call handleVideoProgress here. Sending a concurrent
          // POST /progress alongside POST /complete causes a transaction
          // conflict on the backend that prevents the completion from persisting.
          // The completion mutation alone is sufficient — it tells the backend
          // the lesson is done. This is why manual "Mark Complete" works
          // (it only sends /complete) but auto-complete was failing.

          if (isValidBackendId && module?.backendId) {
            console.log('📝 [YouTube Player] Marking lesson as complete on backend');
            completeLessonMutation({ lessonId: lesson.backendId! }, {
              onSuccess: () => {
                console.log('✅ [YouTube Player] Lesson marked complete successfully');
              },
              onError: (error: Error) => {
                console.error('❌ [YouTube Player] Failed to mark lesson complete:', error);
              }
            });
          }

          return;
        }
        
        if (state === YT_PLAYER_STATES.PLAYING) {
          console.log('⏯️ [YouTube Player] Progress - Time:', currentTime.toFixed(2), 'State:', getPlayerStateName(state));
          
          checkAndTrackMilestones(currentTime, duration);
          
          const now = Date.now();
          if (now - lastProgressSyncRef.current >= 30000) {
            handleVideoProgress(Math.floor(currentTime));
            lastProgressSyncRef.current = now;
          }

          if (addProgressItem && lesson.backendId) {
            addProgressItem({
              lesson_id: lesson.backendId,
              content_type: 'video',
              video_progress_seconds: Math.floor(currentTime),
              time_spent_seconds: Math.floor((Date.now() - lessonStartTimeRef.current) / 1000),
            });
          }
        }
        
        setCurrentVideoTime(currentTime);
      }
    }, 1000);

  }, [handleVideoProgress, checkAndTrackMilestones, isValidBackendId, module?.backendId, completeLessonMutation, lesson?.backendId, addProgressItem]);

  const onPlayerStateChange = useCallback((event: YouTubePlayerEvent) => {
    const state = event.data;
    const stateName = getPlayerStateName(state);
    
    console.log('🔄 [YouTube Player] State changed to:', stateName, '(', state, ')');
    setPlayerState(state);

    const player = event.target;
    const currentTime = player?.getCurrentTime() || 0;
    const duration = player?.getDuration() || 0;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    console.log('📊 [YouTube Player] Current position:', currentTime.toFixed(2), '/', duration.toFixed(2), 'seconds (', progressPercent.toFixed(1), '%)');

    switch (state) {
      case YT_PLAYER_STATES.UNSTARTED:
        console.log('⚪ [YouTube Player] Video has not started yet');
        break;
        
      case YT_PLAYER_STATES.ENDED:
        console.log('✅ [YouTube Player] VIDEO COMPLETED!');
        setVideoCompleted(true);
        // Only fire completion if we haven't already handled it in the
        // progress interval (duration-3 check). Firing duplicate /complete
        // requests can cause backend transaction conflicts.
        if (!autoCompletedRef.current) {
          autoCompletedRef.current = true;
          // Don't call handleVideoProgress — same concurrent request issue
          if (isValidBackendId && module?.backendId) {
            console.log('📝 [YouTube Player] Marking lesson as complete on backend');
            completeLessonMutation({ lessonId: lesson.backendId! }, {
              onSuccess: () => {
                console.log('✅ [YouTube Player] Lesson marked complete successfully');
              },
              onError: (error: Error) => {
                console.error('❌ [YouTube Player] Failed to mark lesson complete:', error);
              }
            });
          }
        } else {
          console.log('ℹ️ [YouTube Player] ENDED fired but completion already handled');
        }
        break;
        
      case YT_PLAYER_STATES.PLAYING:
        console.log('▶️ [YouTube Player] Video is playing');
        console.log('🎵 [YouTube Player] Playback rate:', player.getPlaybackRate(), 'x');
        setPlaybackRate(player.getPlaybackRate());
        break;
        
      case YT_PLAYER_STATES.PAUSED:
        console.log('⏸️ [YouTube Player] Video is paused at', currentTime.toFixed(2), 'seconds');
        // Skip the progress update if we just auto-completed. The pauseVideo()
        // call in the auto-complete flow triggers this PAUSED event, and
        // sending POST /progress here would race with POST /complete.
        if (!autoCompletedRef.current) {
          handleVideoProgress(Math.floor(currentTime));
        } else {
          console.log('ℹ️ [YouTube Player] Skipping progress update — auto-complete in progress');
        }
        break;
        
      case YT_PLAYER_STATES.BUFFERING:
        console.log('⏳ [YouTube Player] Video is buffering...');
        break;
        
      case YT_PLAYER_STATES.CUED:
        console.log('📋 [YouTube Player] Video is cued');
        break;
    }
  }, [handleVideoProgress, isValidBackendId, module?.backendId, completeLessonMutation, lesson?.backendId]);

  const onPlayerError = useCallback((event: any) => {
    const errorCode = event.data;
    console.error('❌ [YouTube Player] Error occurred!');
    console.error('🔢 [YouTube Player] Error code:', errorCode);
    
    switch (errorCode) {
      case 2:
        console.error('🚫 [YouTube Player] Invalid parameter value');
        break;
      case 5:
        console.error('🚫 [YouTube Player] HTML5 player error');
        break;
      case 100:
        console.error('🚫 [YouTube Player] Video not found');
        break;
      case 101:
      case 150:
        console.error('🚫 [YouTube Player] Video cannot be embedded');
        break;
      default:
        console.error('🚫 [YouTube Player] Unknown error');
    }
  }, []);

  const onPlaybackRateChange = useCallback((event: any) => {
    const rate = event.data;
    console.log('⚡ [YouTube Player] Playback rate changed to:', rate, 'x');
    setPlaybackRate(rate);
  }, []);

  const onPlaybackQualityChange = useCallback((event: any) => {
    const quality = event.data;
    console.log('🎥 [YouTube Player] Playback quality changed to:', quality);
  }, []);

  // Initialize YouTube Player
  useEffect(() => {
    if (!isYouTubeAPIReady || !youtubeVideoId || !playerContainerRef.current) {
      if (!youtubeVideoId) {
        console.warn('⚠️ [YouTube Player] No video ID available, skipping player initialization');
      }
      return;
    }

    console.log('🎬 [YouTube Player] Initializing player for video ID:', youtubeVideoId);

    try {
      if (playerRef.current) {
        console.log('🗑️ [YouTube Player] Destroying existing player...');
        playerRef.current.destroy();
        playerRef.current = null;
      }

      console.log('🆕 [YouTube Player] Creating new player instance...');
      
      const player = new window.YT.Player(playerContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0,
          disablekb: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          widget_referrer: window.location.origin
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
          onPlaybackRateChange: onPlaybackRateChange,
          onPlaybackQualityChange: onPlaybackQualityChange
        }
      });

      playerRef.current = player;
      console.log('✅ [YouTube Player] Player instance created successfully');

    } catch (error) {
      console.error('❌ [YouTube Player] Failed to create player:', error);
    }

    return () => {
      if (playerRef.current) {
        console.log('🧹 [YouTube Player] Cleaning up player on unmount...');
        playerRef.current.destroy();
        playerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isYouTubeAPIReady, youtubeVideoId, onPlayerReady, onPlayerStateChange, onPlayerError, onPlaybackRateChange, onPlaybackQualityChange]);

  // ═══════════════════════════════════════════════════════════
  // MARK AS COMPLETED TOGGLE
  // ═══════════════════════════════════════════════════════════
  const handleMarkComplete = useCallback(() => {
    console.log('🖱️ [Mark Complete] clicked | isCompleted:', isCompleted, '| isValidBackendId:', isValidBackendId, '| lessonId:', lesson.backendId);

    if (isCompleted) {
      // Show confirmation modal before uncompleting
      setShowUncompleteModal(true);
      return;
    }
    // Mark as complete
    if (isValidBackendId && module?.backendId && lesson.backendId) {
      // Capture lessonId before the async callback (lesson ref may change)
      const lessonId = lesson.backendId;

      completeLessonMutation({ lessonId }, {
        onSuccess: () => {
          console.log('✅ Lesson manually marked as complete');

          // Explicitly trigger GYN unlock modal on manual completion.
          // The useEffect that detects is_completed transitioning false→true
          // can miss this if isCompleted was already true (e.g. video/reading
          // completed the lesson before the button was clicked) or if the
          // optimistic update and ref tracking race each other.
          const gynPlayed = !!backendLessonData?.grow_your_nest_played;
          const modalKey = lessonId ? `nestnav_gyn_modal_shown_${lessonId}` : null;
          const alreadyShown = modalKey ? localStorage.getItem(modalKey) === 'true' : false;

          console.log('🔍 [Mark Complete onSuccess] gynPlayed:', gynPlayed, '| alreadyShown:', alreadyShown);

          if (!gynPlayed && !alreadyShown) {
            console.log('🎮 [Mark Complete] Showing GYN unlock modal!');
            setShowGYNUnlockModal(true);
            if (modalKey) {
              localStorage.setItem(modalKey, 'true');
            }
          }
        },
        onError: (error: Error) => {
          console.error('❌ Failed to mark lesson complete:', error);
        }
      });
    } else {
      console.warn('⚠️ [Mark Complete] Skipped mutation — isValidBackendId:', isValidBackendId, '| module?.backendId:', module?.backendId, '| lesson.backendId:', lesson.backendId);
    }
  }, [isCompleted, isValidBackendId, module?.backendId, lesson.backendId, completeLessonMutation, backendLessonData?.grow_your_nest_played]);

  const handleConfirmUncomplete = useCallback(() => {
    setShowUncompleteModal(false);
    if (isValidBackendId && lesson.backendId) {
      // Clear the GYN modal "already shown" flag so the unlock modal
      // can re-appear when the lesson is completed again.
      const modalKey = `nestnav_gyn_modal_shown_${lesson.backendId}`;
      localStorage.removeItem(modalKey);

      // Reset the completion ref so the useEffect can detect the
      // false → true transition on the next completion.
      prevIsCompletedRef.current = false;

      uncompleteLessonMutation({ lessonId: lesson.backendId }, {
        onSuccess: () => {
          console.log('🔄 Lesson marked as incomplete');
        },
        onError: (error: Error) => {
          console.error('❌ Failed to uncomplete lesson:', error);
        }
      });
    }
  }, [isValidBackendId, lesson.backendId, uncompleteLessonMutation]);

  // ═══════════════════════════════════════════════════════════
  // GYN PLAY HANDLER — Launches lesson-mode minigame
  // Called by GYNLessonButton when in Active state
  // ═══════════════════════════════════════════════════════════

  // Core minigame launch logic — fetches questions and transitions to Phaser
  const launchGYNMinigame = useCallback(async () => {
    if (!lesson.backendId) {
      console.warn('🌳 [GYN Play] No lesson backendId, cannot launch');
      return;
    }

    console.log('🌳 [GYN Play] Fetching GYN questions for lesson:', lesson.backendId);
    try {
      const gynData = await getLessonQuestions(lesson.backendId);

      if (gynData && gynData.questions && gynData.questions.length > 0) {
        console.log('🌳 [GYN Play] Fetched', gynData.questions.length, 'questions');

        const initData: GYNMinigameInitData = buildLessonModeInitData(
          lesson.backendId,
          (module.orderIndex ?? 0) + 1,
          gynData,
          module.backendId
        );

        // Pass already-awarded question IDs so the Phaser scene
        // doesn't show inflated local points for repeat correct answers
        // TODO: REMOVE BEFORE PRODUCTION — real backend handles this server-side
        if (isMockLesson) {
          initData.awardedQuestionIds = Array.from(mockAwardedQuestionIds);
        }
        // Ensure Tier 3 (GYN) assets are loaded before launching minigame
        // Normal flow goes through ModulesPage navState='minigame' which triggers this,
        // but the GYN Lesson Button bypasses that path via direct HouseScene launch.
        gameManager.loadDeferredAssets();

        // Use onLaunchMinigame if available — this sets navState to 'minigame'
        // which just pauses scenes without restarting HouseScene.
        // Falling back to onBack for backwards compatibility, but onBack sets
        // navState to 'house' which causes a full HouseScene restart and creates
        // a race condition with the minigame launch.
        const dismissLesson = onLaunchMinigame || onBack;
        dismissLesson();

        // Short delay — just enough for React to flush the unmount.
        // The old 500ms was overly conservative and caused a visible pause.
        setTimeout(() => {
          const phaserGame = gameManager.getGame();
          if (!phaserGame) {
            console.error('🌳 [GYN Play] Phaser game instance not found');
            return;
          }

          const launchMinigame = () => {
            // Wake HouseScene if sleeping — when using onLaunchMinigame the scene
            // stays sleeping instead of being restarted. We wake it right before
            // launching so the scene is active and can run slide-out tweens.
            if (phaserGame.scene.isSleeping('HouseScene')) {
              phaserGame.scene.wake('HouseScene');
            }

            const houseScene = phaserGame.scene.getScene('HouseScene') as any;
            if (houseScene && houseScene.launchLessonMinigame) {
              houseScene.launchLessonMinigame(initData);
              console.log('🌳 [GYN Play] Lesson minigame launch triggered with slide transition!');
            } else {
              console.error('🌳 [GYN Play] HouseScene or launchLessonMinigame not found');
            }
          };

          // Wait for Tier 3 assets if not yet loaded
          if (phaserGame.registry.get('deferredAssetsLoaded')) {
            launchMinigame();
          } else {
            console.log('🌳 [GYN Play] Waiting for Tier 3 assets before launching...');
            const onLoaded = () => {
              phaserGame.registry.events.off('changedata-deferredAssetsLoaded', onLoaded);
              launchMinigame();
            };
            phaserGame.registry.events.on('changedata-deferredAssetsLoaded', onLoaded);

            // Safety timeout — launch anyway after 3s to avoid infinite wait
            setTimeout(() => {
              phaserGame.registry.events.off('changedata-deferredAssetsLoaded', onLoaded);
              if (!phaserGame.registry.get('deferredAssetsLoaded')) {
                console.warn('🌳 [GYN Play] Tier 3 asset timeout — launching anyway');
              }
              launchMinigame();
            }, 3000);
          }
        }, 50);
      } else {
        console.warn('🌳 [GYN Play] No GYN questions available');
      }
    } catch (error) {
      console.error('🌳 [GYN Play] Failed to fetch GYN questions:', error);
      // If backend says "already been played", update local state so
      // the button transitions to Completed without waiting for cache refresh
      const msg = (error as Error)?.message || '';
      if (msg.includes('status: 400')) {
        setGynAlreadyPlayed(true);
      }
    }
  }, [lesson.backendId, module.orderIndex, onBack, onLaunchMinigame]);

  // Entry point — dismisses notifications and launches the minigame.
  // The GYN Welcome modal (shown once on first play) is handled by
  // ModulesPage after the Phaser scene transition completes.
  const handleGYNPlay = useCallback(() => {
    setShowGYNUnlockedNotification(false);
    setShowGYNUnlockModal(false);
    if (gynNotificationTimerRef.current) {
      clearTimeout(gynNotificationTimerRef.current);
      gynNotificationTimerRef.current = null;
    }

    launchGYNMinigame();
  }, [launchGYNMinigame]);

  // ═══════════════════════════════════════════════════════════
  // BACK BUTTON — Navigates directly without interception
  // ═══════════════════════════════════════════════════════════
  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);



  const displayTitle = backendLessonData?.title || lesson.title;
  const displayDescription = backendLessonData?.description || lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership.";

  return (
    <div
      className="h-screen flex flex-col"
    >
      {/* Scrollable Main Content Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {/* Two-column nav: Left (Back + House) | Right (Toggle + GYN) */}
        <div className="px-7 pt-4">
          <div className="flex items-start justify-between z-30">
            {/* Left column: Back button above, House nav below */}
            <div className="flex flex-col items-start gap-2">
              {/* Back button - icon only, matching Phaser scene style */}
              <button
                onClick={handleBack}
                onMouseEnter={() => setIsBackHovered(true)}
                onMouseLeave={() => setIsBackHovered(false)}
                className="cursor-pointer transition-opacity hover:opacity-80 p-2"
                title="Go back"
                style={{ background: 'none', border: 'none' }}
              >
                <img
                  src={isBackHovered ? BackArrowHover : BackArrow}
                  alt="Back"
                  className="w-6 h-6"
                  draggable={false}
                />
              </button>

              {/* Mini House Progress — clickable rooms */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-2.5 py-2 shadow-sm">
                <div className="relative w-14 h-14">
                  {/* Roof */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: '32px solid transparent',
                      borderRight: '32px solid transparent',
                      borderBottom: '12px solid #6B85F5',
                    }}
                  />
                  {/* House body - 2x2 grid */}
                  <div className="absolute top-[12px] left-0.5 right-0.5 bottom-0 grid grid-cols-2 grid-rows-2 gap-[2px] rounded-b-md overflow-hidden">
                    {module.lessons.slice(0, 4).map((l, idx) => {
                      const isCurrent = idx === currentLessonIndex;
                      const lessonCompleted = l.completed || (idx === currentLessonIndex && isCompleted);
                      const isUnlocked = idx === 0 || module.lessons[idx - 1]?.completed;
                      return (
                        <button
                          key={l.id}
                          onClick={() => {
                            if (isUnlocked && !isCurrent && onNextLesson && module.backendId) {
                              if (flushProgress) flushProgress();
                              if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                              onNextLesson(l.id, module.backendId);
                            }
                          }}
                          disabled={!isUnlocked || isCurrent}
                          className={`relative flex items-center justify-center transition-colors duration-200 ${
                            lessonCompleted
                              ? 'bg-status-green'
                              : isUnlocked
                                ? 'bg-light-background-blue'
                                : 'bg-unavailable-button/40'
                          } ${isUnlocked && !isCurrent ? 'cursor-pointer hover:opacity-80' : ''} disabled:cursor-default`}
                        >
                          {isCurrent && (
                            <div className="w-3 h-3 rounded-full bg-logo-blue border-2 border-white shadow-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <span className="text-xs text-text-grey font-medium">
                  {currentLessonIndex + 1}/{module.lessons.length}
                </span>
              </div>
            </div>

            {/* Right column: Coins → Toggle → GYN stacked */}
            <div className="flex flex-col items-end gap-5 pt-1">
              {/* Coin Counter */}
              <LessonCoinCounter />

              {/* Video/Reading toggle */}
              <div
                data-walkthrough="lesson-view-toggle"
                onClick={() => setViewMode(viewMode === 'video' ? 'reading' : 'video')}
                className="flex items-center bg-logo-blue rounded-full p-0.5 gap-0.5 cursor-pointer"
                title={viewMode === 'video' ? 'Switch to Reading' : 'Switch to Video'}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  viewMode === 'video' ? 'bg-white shadow-sm' : ''
                }`}>
                  <img src={VideoProgressIcon} alt="Video" className="w-6 h-6" draggable={false}
                    style={{ opacity: viewMode === 'video' ? 1 : 0 }} />
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  viewMode === 'reading' ? 'bg-white shadow-sm' : ''
                }`}>
                  <img src={DocumentProgressIcon} alt="Reading" className="w-6 h-6" draggable={false}
                    style={{ opacity: viewMode === 'reading' ? 1 : 0 }} />
                </div>
              </div>

              {/* GYN Lesson Minigame Button */}
              {isValidBackendId && (
                <GYNLessonButton
                  lessonCompleted={isCompleted}
                  gynPlayed={
                    !!backendLessonData?.grow_your_nest_played ||
                    gynAlreadyPlayed ||
                    (isMockLesson && mockGYNPlayedLessons.has(lesson.backendId || ''))
                  }
                  onPlay={handleGYNPlay}
                  isLoading={isLoadingLesson}
                />
              )}
            </div>
          </div>
        </div>

        {/* GYN Unlock Modal — appears when lesson completes and minigame unlocks */}
        <GYNUnlockModal
          isOpen={showGYNUnlockModal}
          lessonTitle={displayTitle}
          onPlayNow={handleGYNPlay}
          onDismiss={() => setShowGYNUnlockModal(false)}
        />

        {/* Toast Notifications — fixed position, won't affect layout */}
        <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2" style={{ pointerEvents: 'none' }}>
          {showGYNUnlockedNotification && (
            <div className="border border-status-green/30 rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg max-w-sm animate-toast-slide-in" style={{ pointerEvents: 'auto', backgroundColor: '#ecfdf5' }}>
              <span className="text-base flex-shrink-0">🌱</span>
              <p className="text-xs text-status-green font-medium">
                Minigame Unlocked! Help the bird grow her tree.
              </p>
              <button
                onClick={() => {
                  setShowGYNUnlockedNotification(false);
                  if (gynNotificationTimerRef.current) {
                    clearTimeout(gynNotificationTimerRef.current);
                    gynNotificationTimerRef.current = null;
                  }
                }}
                className="ml-auto flex-shrink-0 text-status-green/60 hover:text-status-green transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <style>{`
            .animate-toast-slide-in {
              animation: toastSlideIn 0.3s ease-out;
            }
            @keyframes toastSlideIn {
              from { opacity: 0; transform: translateX(20px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>
        </div>

        {/* Main content — negative margin pulls it up under the nav */}
        <div className="max-w-3xl mx-auto px-6 relative z-[25]" style={{ marginTop: -120 }}>
          <div className="rounded-xl pb-8">
            {/* Lesson title + description + complete button */}
            <div className="flex items-start justify-between mb-4 bg-text-white rounded-2xl p-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text-blue-black">{displayTitle}</h1>
                <p className="text-sm text-text-grey mt-1">{displayDescription}</p>
              </div>

              {/* Mark as Completed Toggle Button */}
              <div className="flex flex-col items-end gap-2 ml-4" data-walkthrough="lesson-mark-complete">
                <button
                  onClick={handleMarkComplete}
                  disabled={isLoadingLesson}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-200 border-2 ${
                    isCompleted
                      ? 'border-transparent text-white'
                      : 'bg-transparent border-logo-blue text-logo-blue hover:bg-logo-blue hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={isCompleted ? { background: 'linear-gradient(180deg, #339D5F 0%, #32A68E 100%)' } : undefined}
                >
                  {isCompleted ? (
                    <>
                      <span className="text-sm font-medium">Completed</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                      <span className="text-sm font-medium">Mark Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Video section - always mounted, hidden via CSS to preserve YouTube player */}
            <div style={{ display: viewMode === 'video' ? 'block' : 'none' }}>
              <>
                <div className="mb-6">
                  <div className="rounded-2xl aspect-video flex items-center justify-center relative">
                    {youtubeVideoId ? (
                      <>
                        {/* YouTube Player Container - Hidden when complete */}
                        <div
                          ref={playerContainerRef}
                          className="w-full h-full rounded-2xl overflow-hidden"
                          style={{
                            display: videoCompleted ? 'none' : 'block',
                            position: 'relative'
                          }}
                        />
                        
                        {/* CSS to hide YouTube branding and "More videos" button */}
                        <style dangerouslySetInnerHTML={{__html: `
                          /* Hide YouTube logo/branding */
                          .ytp-title-channel,
                          .ytp-chrome-top,
                          .ytp-show-cards-title,
                          .ytp-ce-element,
                          .ytp-cards-teaser,
                          .ytp-pause-overlay,
                          .ytp-scroll-min,
                          .ytp-watermark,
                          .ytp-player-content {
                            display: none !important;
                            opacity: 0 !important;
                            pointer-events: none !important;
                          }
                          
                          /* Hide annotations and info cards */
                          .annotation,
                          .video-annotations,
                          .ytp-cards-button,
                          .ytp-cards-teaser-box {
                            display: none !important;
                            visibility: hidden !important;
                          }
                        `}} />
                        
                        {/* Video Completed Overlay - Blocks ALL YouTube content */}
                        {videoCompleted && (
                          <div className="absolute inset-0 bg-text-blue-black rounded-2xl flex flex-col items-center justify-center">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-status-green rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Video Complete!</h3>
                              <p className="text-text-grey mb-6">Great job completing this lesson.</p>
                              <button
                                onClick={() => {
                                  setVideoCompleted(false);
                                  if (playerRef.current) {
                                    playerRef.current.seekTo(0, true);
                                  }
                                }}
                                className="px-6 py-2 bg-logo-blue text-white rounded-full hover:opacity-90 transition-colors"
                              >
                                Watch Again
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback when no video URL */
                      <div className="text-center">
                        <div className="w-20 h-20 bg-unavailable-button rounded-full flex items-center justify-center mx-auto mb-4">
                          <button
                            onClick={() => handleVideoProgress(10)}
                            className="w-8 h-8 text-white hover:text-logo-blue transition-colors"
                          >
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                        <p className="text-unavailable-button text-sm">No video available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-8 bg-text-white rounded-lg p-6">
                  <h3 className="font-semibold text-text-blue-black mb-3">Video Transcript</h3>
                  <div className="space-y-2 text-sm text-text-grey">
                    {backendLessonData?.video_transcription ? (
                      (() => {
                        const timestampRegex = /\[(\d{2}:\d{2}:\d{2})\]/g;
                        const segments: Array<{ timestamp: string; text: string }> = [];
                        
                        let match;
                        let lastIndex = 0;
                        
                        while ((match = timestampRegex.exec(backendLessonData.video_transcription)) !== null) {
                          if (lastIndex > 0) {
                            const text = backendLessonData.video_transcription
                              .substring(lastIndex, match.index)
                              .trim();
                            if (text) {
                              segments[segments.length - 1].text = text;
                            }
                          }
                          
                          segments.push({
                            timestamp: match[1],
                            text: ''
                          });
                          
                          lastIndex = match.index + match[0].length;
                        }
                        
                        if (segments.length > 0 && lastIndex < backendLessonData.video_transcription.length) {
                          segments[segments.length - 1].text = backendLessonData.video_transcription
                            .substring(lastIndex)
                            .trim();
                        }
                        
                        return segments.map((segment, index) => {
                          const timeFormatted = segment.timestamp.substring(3);
                          
                          return (
                            <div key={index} className="flex gap-3">
                              <span className="text-unavailable-button font-mono">{timeFormatted}</span>
                              <p>{segment.text}</p>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="flex gap-3">
                        <span className="text-unavailable-button font-mono">0:00</span>
                        <p>Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness. That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            </div>

            {viewMode === 'reading' && (
              <div className="mb-8 bg-text-white rounded-2xl p-6">
                <div className="prose prose-gray max-w-none">
                  {backendLessonData?.video_transcription ? (
                    (() => {
                      const cleanText = backendLessonData.video_transcription
                        .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
                        .trim();
                      
                      const sentences = cleanText.split(/(?<=[.!?])\s+/);
                      
                      const paragraphs: string[] = [];
                      let currentParagraph: string[] = [];
                      
                      sentences.forEach((sentence: string, index: number) => {
                        currentParagraph.push(sentence);
                        
                        if (currentParagraph.length >= 3 || index === sentences.length - 1) {
                          paragraphs.push(currentParagraph.join(' '));
                          currentParagraph = [];
                        }
                      });
                      
                      return paragraphs.map((paragraph, index) => (
                        <p key={index} className="text-base text-text-grey leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ));
                    })()
                  ) : (
                    <>
                      <p className="text-base text-text-grey leading-relaxed mb-4">
                        Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness.
                      </p>
                      <p className="text-base text-text-grey leading-relaxed">
                        That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?
                      </p>
                    </>
                  )}
                </div>

              </div>
            )}

            {/* Uncomplete Confirmation Modal — rendered via portal at root level */}
          </div>
        </div>
      </div>

      {/* Uncomplete Confirmation Modal — rendered via portal to cover entire viewport including sidebar */}
      {showUncompleteModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-status-yellow/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-status-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-blue-black mb-1">Reverse Progress?</h3>
              <p className="text-sm text-text-grey">
                Are you sure you want to mark this lesson as incomplete? This will reverse your progress for this lesson.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUncompleteModal(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-unavailable-button text-text-grey text-sm font-medium hover:bg-light-background-blue transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUncomplete}
                className="flex-1 px-4 py-2 rounded-xl bg-status-red text-white text-sm font-medium hover:opacity-90 transition-colors"
              >
                Yes, Reverse
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LessonView;