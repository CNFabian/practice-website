import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Module, Lesson } from '../../../types/modules';
import { useLesson, useLessonQuiz } from '../../../hooks/queries/useLearningQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getLesson } from '../../../services/learningAPI';import { useCompleteLesson } from '../../../hooks/mutations/useCompleteLesson';
import { useUpdateLessonProgress } from '../../../hooks/mutations/useUpdateLessonProgress';
import { LessonViewBackground } from '../../../assets';
import { useGYNLessonQuestions, buildLessonModeInitData } from '../../../hooks/queries/useGrowYourNest';
import type { GYNMinigameInitData } from '../../../types/growYourNest.types';
import { useTrackLessonMilestone } from '../../../hooks/queries/useTrackLessonMilestone';
import type { BatchProgressItem } from '../../../services/learningAPI';
import GrowYourNestPromptModal from '../../../components/protected/modals/GrowYourNestPromptModal';
import { getLessonQuestions, getFreeRoamQuestions, getFreeRoamState, transformGYNQuestionsForMinigame, resetLessonGYNDev } from '../../../services/growYourNestAPI';
import gameManager from './phaser/managers/GameManager';

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
    
    if (correctAnswerIndex === -1) {
      console.warn('⚠️ No is_correct field found, assuming first answer is correct for question:', q.id);
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
  onNextLesson,
  addProgressItem,
  flushProgress
}) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'video' | 'reading'>('video');  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // YouTube Player state and refs
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isYouTubeAPIReady, setIsYouTubeAPIReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playerState, setPlayerState] = useState<number>(YT_PLAYER_STATES.UNSTARTED);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoCompleted, setVideoCompleted] = useState(false); // Track if video is complete

  // Milestone tracking refs
  const milestonesReachedRef = useRef<Set<number>>(new Set());
  const lessonStartTimeRef = useRef<number>(Date.now());
  const lastProgressSyncRef = useRef<number>(0);

  // ═══════════════════════════════════════════════════════════
  // GYN MODAL STATE — Clean, server-driven approach
  // ═══════════════════════════════════════════════════════════
  // Modal visibility
  const [showGYNPromptModal, setShowGYNPromptModal] = useState(false);
  // Pending navigation to execute after modal is dismissed/played
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  // Session guard: once the user has played or dismissed the GYN
  // modal for THIS lesson in THIS session, never show it again.
  // Uses state (not ref) so it participates in React's render cycle.
  const [gynDismissedThisSession, setGynDismissedThisSession] = useState(false);

  // Dev button loading states — TEMP: Remove before production
  const [isDevCompleting, setIsDevCompleting] = useState(false);
  const [isDevFreeRoam, setIsDevFreeRoam] = useState(false);
  const [isDevResetting, setIsDevResetting] = useState(false);

  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.style.setProperty('background', `url(${LessonViewBackground})`, 'important');
      bgElement.style.backgroundSize = 'cover';
      bgElement.style.backgroundPosition = 'center';
      bgElement.style.backgroundRepeat = 'no-repeat';
    }

    // Reset all per-lesson state when lesson changes
    setVideoCompleted(false);
    milestonesReachedRef.current.clear();
    lessonStartTimeRef.current = Date.now();
    lastProgressSyncRef.current = 0;
    setGynDismissedThisSession(false);
    setShowGYNPromptModal(false);
    pendingNavigationRef.current = null;

    return () => {
      const bgElement = document.getElementById('section-background');
      if (bgElement) {
        bgElement.style.setProperty('background', '', 'important');
        bgElement.style.backgroundSize = '';
        bgElement.style.backgroundPosition = '';
        bgElement.style.backgroundRepeat = '';
      }
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
    error: lessonError 
  } = useLesson(isValidBackendId ? lesson.backendId! : '');
  
  // ═══════════════════════════════════════════════════════════
  // GYN QUESTIONS — Only fetch when server confirms:
  //   1. Lesson is completed
  //   2. GYN has NOT been played yet
  // ═══════════════════════════════════════════════════════════
  const shouldFetchGYN = !!(
    backendLessonData?.is_completed &&
    backendLessonData?.grow_your_nest_played === false
  );
  const { data: gynLessonData } = useGYNLessonQuestions(
    shouldFetchGYN ? (lesson.backendId || '') : ''
  );

  // ═══════════════════════════════════════════════════════════
  // shouldShowGYNModal — Called at the moment of navigation
  // (Back / Next Lesson). NOT memoized — reads live values.
  //
  // Returns true ONLY when ALL of these are true:
  //   1. Backend says lesson is completed (is_completed === true)
  //   2. Backend says GYN not played yet (grow_your_nest_played === false)
  //   3. User hasn't dismissed/played GYN this session
  //   4. GYN questions are available
  //   5. We have a valid backend ID
  // ═══════════════════════════════════════════════════════════
  const shouldShowGYNModal = useCallback(async (): Promise<boolean> => {
    // Guard 1: Valid backend connection
    if (!isValidBackendId || !lesson.backendId) {
      console.log('🌳 [GYN Check] No valid backend data — skipping');
      return false;
    }

    // Guard 2: User hasn't already dismissed/played GYN this session
    if (gynDismissedThisSession) {
      console.log('🌳 [GYN Check] GYN already handled this session — skipping');
      return false;
    }

    // Guard 3: Force-refetch FRESH lesson data from server (bypass cache)
    console.log('🌳 [GYN Check] Fetching fresh lesson data from server...');
    let freshLessonData;
    try {
      freshLessonData = await queryClient.fetchQuery({
        queryKey: queryKeys.learning.lesson(lesson.backendId),
        queryFn: () => getLesson(lesson.backendId!),
        staleTime: 0, // Force fresh fetch, never use cache
      });
    } catch (error) {
      console.error('🌳 [GYN Check] Failed to fetch fresh lesson data:', error);
      return false;
    }

    // Guard 4: Lesson must be completed (server confirms)
    if (!freshLessonData?.is_completed) {
      console.log('🌳 [GYN Check] Lesson not completed — skipping');
      return false;
    }

    // Guard 5: GYN must NOT already be played (server confirms with FRESH data)
    if (freshLessonData?.grow_your_nest_played) {
      console.log('🌳 [GYN Check] GYN already played for this lesson — skipping');
      return false;
    }

    // Guard 6: GYN questions must be available
    if (!gynLessonData?.questions || gynLessonData.questions.length === 0) {
      console.log('🌳 [GYN Check] No GYN questions available — skipping');
      return false;
    }

    console.log('🌳 [GYN Check] ✅ All conditions met — showing modal');
    return true;
  }, [isValidBackendId, lesson.backendId, gynDismissedThisSession, gynLessonData, queryClient]);
  
  const { 
    data: quizData,
    isLoading: isLoadingQuiz,
    error: quizError
  } = useLessonQuiz(isValidBackendId ? lesson.backendId! : '');
  
  const { mutate: completeLessonMutation } = useCompleteLesson(
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
              // Remove from set so it retries next time
              milestonesReachedRef.current.delete(milestone);
            },
          }
        );
      }
    }
  }, [isValidBackendId, lesson.backendId, trackMilestoneMutation]);

  const transformedQuizQuestions = useMemo(() => {
    if (quizData && Array.isArray(quizData) && quizData.length > 0) {
      console.log('🔄 Using backend quiz questions:', quizData.length);
      return transformQuizQuestions(quizData);
    } else {
      console.log('🔄 Using mock quiz questions for instant access:', MOCK_QUIZ_QUESTIONS.length);
      return MOCK_QUIZ_QUESTIONS;
    }
  }, [quizData]);

  const currentLessonIndex = useMemo(() => 
    module.lessons.findIndex(l => l.id === lesson.id), 
    [module.lessons, lesson.id]
  );

  const nextLesson = useMemo(() => 
    currentLessonIndex < module.lessons.length - 1 
      ? module.lessons[currentLessonIndex + 1] 
      : null,
    [module.lessons, currentLessonIndex]
  );

  const isLastLesson = useMemo(() => !nextLesson, [nextLesson]);

  // Extract YouTube video ID
  const videoUrl = backendLessonData?.video_url || lesson.videoUrl;
  const youtubeVideoId = useMemo(() => {
    return extractYouTubeVideoId(videoUrl || '');
  }, [videoUrl]);

  // Define handleVideoProgress before YouTube event handlers that use it
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
    setVideoCompleted(false); // Reset on player ready

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
          
          // Mark as complete and hide player
          setVideoCompleted(true);
          console.log('✅ [YouTube Player] VIDEO COMPLETED - Player hidden!');
          
          // Update progress to full duration
          handleVideoProgress(Math.floor(duration));
          
          // Mark lesson as complete on backend (NO GYN modal here — only on navigation)
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
        
        // Only process when playing to avoid spam
        if (state === YT_PLAYER_STATES.PLAYING) {
          console.log('⏯️ [YouTube Player] Progress - Time:', currentTime.toFixed(2), 'State:', getPlayerStateName(state));
          
          // Check milestone thresholds (replaces continuous progress updates)
          checkAndTrackMilestones(currentTime, duration);
          
          // Reduced-frequency progress sync: every 30 seconds instead of every second
          const now = Date.now();
          if (now - lastProgressSyncRef.current >= 30000) {
            handleVideoProgress(Math.floor(currentTime));
            lastProgressSyncRef.current = now;
          }

          // Queue for batch sync on tab close/hide (Step 13)
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
    }, 1000); // Update every second for UI, but milestones + progress sync are throttled

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
        setVideoCompleted(true); // Hide player immediately
        handleVideoProgress(Math.floor(duration)); // Send full duration as progress
        
        // Mark lesson as complete on backend (NO GYN modal here — only on navigation)
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
        break;
        
      case YT_PLAYER_STATES.PLAYING:
        console.log('▶️ [YouTube Player] Video is playing');
        console.log('🎵 [YouTube Player] Playback rate:', player.getPlaybackRate(), 'x');
        setPlaybackRate(player.getPlaybackRate());
        break;
        
      case YT_PLAYER_STATES.PAUSED:
        console.log('⏸️ [YouTube Player] Video is paused at', currentTime.toFixed(2), 'seconds');
        handleVideoProgress(Math.floor(currentTime));
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
          rel: 0,              // Don't show related videos
          showinfo: 0,
          fs: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0,
          disablekb: 0,        // Keep keyboard controls enabled
          enablejsapi: 1,      // Enable JS API
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
  // NAVIGATION HELPERS
  // ═══════════════════════════════════════════════════════════

  const executeNavigation = useCallback(() => {
    if (nextLesson && onNextLesson && module.backendId) {
      console.log('✅ Navigating to next lesson:', nextLesson.id, 'in module:', module.backendId);
      
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      
      onNextLesson(nextLesson.id, module.backendId);
    } else if (!nextLesson) {
      console.log('✅ No next lesson - navigating back to house');
      onBack();
    } else if (!onNextLesson) {
      console.error('❌ No navigation handler provided');
    }
  }, [nextLesson, onNextLesson, module.backendId, onBack]);

  // ═══════════════════════════════════════════════════════════
  // COMPLETE LESSON BUTTON (top-right "Next Lesson" / "Finish")
  // Only marks lesson complete on backend. No navigation, no modal.
  // ═══════════════════════════════════════════════════════════
  const handleCompleteLesson = useCallback(() => {
    if (flushProgress) {
      flushProgress();
    }
    
    console.log('🔄 Complete lesson called');
    
    if (isValidBackendId && module?.backendId) {
      completeLessonMutation({ lessonId: lesson.backendId! }, {
        onSuccess: () => {
          console.log('✅ Lesson completed successfully on backend');
        },
        onError: (error: Error) => {
          console.error('❌ Failed to complete lesson on backend:', error);
        }
      });
    } else {
      console.warn('⚠️ Skipping backend completion - invalid backend IDs');
    }
  }, [isValidBackendId, module?.backendId, completeLessonMutation, lesson?.backendId, flushProgress]);

  // ═══════════════════════════════════════════════════════════
  // NEXT LESSON BUTTON (bottom bar)
  // Marks complete, then checks GYN eligibility before navigating.
  // Modal shown ONLY if server says lesson complete + GYN not played.
  // ═══════════════════════════════════════════════════════════
  const handleNextLesson = useCallback(() => {
    if (!nextLesson) return;
    
    if (flushProgress) {
      flushProgress();
    }
    
    if (isValidBackendId && module?.backendId) {
      completeLessonMutation({ lessonId: lesson.backendId! }, {
        onSuccess: async () => {
          console.log('✅ Lesson completed on backend before navigation');
          
          // Check GYN eligibility with fresh server data
          const showGYN = await shouldShowGYNModal();
          if (showGYN) {
            pendingNavigationRef.current = executeNavigation;
            setShowGYNPromptModal(true);
            return;
          }
          
          executeNavigation();
        },
        onError: (error: Error) => {
          console.error('❌ Failed to complete lesson:', error);
          executeNavigation();
        }
      });
    } else {
      executeNavigation();
    }
  }, [nextLesson, flushProgress, isValidBackendId, module?.backendId, completeLessonMutation, lesson?.backendId, shouldShowGYNModal, executeNavigation]);

  // ═══════════════════════════════════════════════════════════
  // GYN MODAL HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleGYNPlay = useCallback(async () => {
    setShowGYNPromptModal(false);
    setGynDismissedThisSession(true);
    pendingNavigationRef.current = null;

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
          gynData
        );

        // Step 1: Dismiss LessonView first to reveal HouseScene
        onBack();

        // Step 2: After React state updates and HouseScene is visible,
        // trigger the slide transition via HouseScene's public method
        setTimeout(() => {
          const phaserGame = gameManager.getGame();
          if (phaserGame) {
            const houseScene = phaserGame.scene.getScene('HouseScene') as any;
            if (houseScene && houseScene.launchLessonMinigame) {
              houseScene.launchLessonMinigame(initData);
              console.log('🌳 [GYN Play] Lesson minigame launch triggered with slide transition!');
            } else {
              console.error('🌳 [GYN Play] HouseScene or launchLessonMinigame not found');
            }
          } else {
            console.error('🌳 [GYN Play] Phaser game instance not found');
          }
        }, 500);
      } else {
        console.warn('🌳 [GYN Play] No GYN questions available');
      }
    } catch (error) {
      console.error('🌳 [GYN Play] Failed to fetch GYN questions:', error);
    }
  }, [lesson.backendId, module.id, onBack]);

  const handleGYNDismiss = useCallback(() => {
    setShowGYNPromptModal(false);
    setGynDismissedThisSession(true);
    
    // Execute the pending navigation (user chose to skip GYN)
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // BACK BUTTON
  // Shows GYN modal if lesson is complete + GYN not played.
  // Otherwise navigates directly.
  // ═══════════════════════════════════════════════════════════
  const handleBack = useCallback(async () => {
    // Only check GYN if the lesson has actually been completed
    // (either video finished this session OR server says so)
    if (videoCompleted || backendLessonData?.is_completed) {
      const showGYN = await shouldShowGYNModal();
      if (showGYN) {
        pendingNavigationRef.current = onBack;
        setShowGYNPromptModal(true);
        return;
      }
    }
    onBack();
  }, [videoCompleted, backendLessonData?.is_completed, shouldShowGYNModal, onBack]);

  // ═══════════════════════════════════════════════════════════
  // TEMPORARY DEV BUTTONS — Remove before production
  // ═══════════════════════════════════════════════════════════

  /** 
   * TEMP: Complete lesson on backend, then show GYN prompt modal.
   * Bypasses the video completion requirement but still routes
   * through the modal so the user chooses whether to play.
   */
  const handleDevCompleteLesson = useCallback(async () => {
    if (!isValidBackendId || !lesson.backendId || !module?.backendId) {
      console.warn('🧪 [Dev] Cannot complete - invalid backend IDs');
      return;
    }

    setIsDevCompleting(true);
    console.log('🧪 [Dev] Completing lesson on backend:', lesson.backendId);

    completeLessonMutation(
      { lessonId: lesson.backendId! },
      {
        onSuccess: () => {
          console.log('🧪 [Dev] Lesson marked complete. Showing GYN prompt modal...');
          setIsDevCompleting(false);
          // Dev shortcut: show modal directly (bypasses normal navigation flow)
          setShowGYNPromptModal(true);
        },
        onError: (error: Error) => {
          console.error('🧪 [Dev] Failed to complete lesson:', error);
          setIsDevCompleting(false);
        },
      }
    );
  }, [isValidBackendId, lesson.backendId, module?.backendId, completeLessonMutation]);

  /**
   * TEMP: Launch Free Roam mode directly.
   * Only available on the last lesson after it's been completed.
   */
  const handleDevLaunchFreeRoam = useCallback(async () => {
    if (!module?.backendId) {
      console.warn('🧪 [Dev] Cannot launch free roam - no module backendId');
      return;
    }

    setIsDevFreeRoam(true);
    console.log('🧪 [Dev] Launching Free Roam for module:', module.backendId);

    try {
      // Fetch questions and current state in parallel
      const [questionsResponse, stateResponse] = await Promise.all([
        getFreeRoamQuestions(module.backendId),
        getFreeRoamState(module.backendId),
      ]);

      if (questionsResponse.questions.length === 0) {
        console.warn('🧪 [Dev] No free roam questions available');
        setIsDevFreeRoam(false);
        return;
      }

      if (stateResponse.completed) {
        console.log('🧪 [Dev] Tree is already fully grown!');
        setIsDevFreeRoam(false);
        return;
      }

      const transformedQuestions = transformGYNQuestionsForMinigame(questionsResponse.questions);

      const initData: GYNMinigameInitData = {
        mode: 'freeroam',
        moduleId: module.backendId,
        questions: transformedQuestions,
        treeState: {
          growth_points: stateResponse.growth_points,
          current_stage: stateResponse.current_stage,
          total_stages: stateResponse.total_stages,
          points_per_stage: stateResponse.points_per_stage,
          completed: stateResponse.completed,
        },
        moduleNumber: (module.orderIndex ?? 0) + 1,
        showStartScreen: true,
      };

      // Launch via Phaser
      const phaserGame = gameManager.getGame();
      if (phaserGame) {
        const houseScene = phaserGame.scene.getScene('HouseScene');
        if (houseScene) {
          // Stop any existing GYN scene first
          if (phaserGame.scene.isActive('GrowYourNestMinigame') || phaserGame.scene.isPaused('GrowYourNestMinigame')) {
            phaserGame.scene.stop('GrowYourNestMinigame');
          }
          houseScene.scene.pause();
          houseScene.scene.launch('GrowYourNestMinigame', initData);
          console.log('🧪 [Dev] Free Roam launched!');
        } else {
          console.error('🧪 [Dev] HouseScene not found');
        }
      } else {
        console.error('🧪 [Dev] Phaser game instance not found');
      }
    } catch (error) {
      console.error('🧪 [Dev] Error launching free roam:', error);
    }

    setIsDevFreeRoam(false);
  }, [module?.backendId, module?.id]);

  /**
   * DEV ONLY: Reset GYN played status so lesson minigame can be replayed.
   * Calls POST /api/grow-your-nest/lesson/{lesson_id}/reset-dev
   */
  const handleDevResetGYN = useCallback(async () => {
    if (!isValidBackendId || !lesson.backendId) {
      console.warn('🧪 [Dev] Cannot reset: no valid backend lesson ID');
      return;
    }

    setIsDevResetting(true);
    try {
      const result = await resetLessonGYNDev(lesson.backendId);
      console.log('🧪 [Dev] GYN reset result:', result);
      // Reset the session guard so the modal can appear again
      setGynDismissedThisSession(false);
      alert(`✅ GYN reset successful!\n\n${result.message}\n\nYou can now replay the minigame for this lesson.`);
    } catch (error) {
      console.error('🧪 [Dev] GYN reset failed:', error);
      alert(`❌ GYN reset failed.\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsDevResetting(false);
  }, [isValidBackendId, lesson.backendId]);

  const displayTitle = backendLessonData?.title || lesson.title;
  const displayDescription = backendLessonData?.description || lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership.";

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Scrollable Main Content Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-7 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center text-text-blue-black font-bold hover:bg-black/10 rounded-xl px-3 py-2 -ml-3 transition-colors"
            >
              <span className="text-2xl mr-10">←</span>
              <span className="text-l">Back</span>
            </button>

            <div data-walkthrough="lesson-view-toggle" className="flex items-center bg-white/60 backdrop-blur-sm rounded-full p-1">
              <button 
                onClick={() => setViewMode('video')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'video' ? 'bg-white shadow-sm' : 'text-text-grey'
                }`}
              >
                Video Lesson
              </button>
              <button 
                onClick={() => setViewMode('reading')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'reading' ? 'bg-white shadow-sm' : 'text-text-grey'
                }`}
              >
                Reading
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-xl pb-8">
            <div className="flex items-start justify-between mb-6 bg-text-white rounded-2xl p-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text-blue-black">{displayTitle}</h1>
                <p className="text-sm text-text-grey mt-1">{displayDescription}</p>
                
                <div className="mt-2 space-y-1">
                  {isLoadingLesson && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-3 w-3 border-2 border-logo-blue border-t-transparent rounded-2xl"></div>
                      <p className="text-xs text-logo-blue">Loading lesson data from server...</p>
                    </div>
                  )}
                  
                  {lessonError && !isLoadingLesson && (
                    <div className="bg-status-yellow/10 border border-status-yellow rounded px-2 py-1">
                      <p className="text-xs text-status-yellow">
                        ⚠️ Unable to load lesson data from server. Using local data.
                      </p>
                    </div>
                  )}
                  
                  {!isValidBackendId && (
                    <div className="bg-status-yellow/10 border border-status-yellow rounded px-2 py-1">
                      <p className="text-xs text-status-yellow">
                        📌 This lesson is using demonstration mode
                      </p>
                    </div>
                  )}
                  
                  {isValidBackendId && !lessonError && !isLoadingLesson && backendLessonData && (
                    <p className="text-xs text-status-green">
                      ✓ Connected to server
                    </p>
                  )}

                  {/* YouTube Player Status */}
                  {viewMode === 'video' && youtubeVideoId && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-logo-blue">
                        🎬 YouTube Player: {isPlayerReady ? '✅ Ready' : '⏳ Loading...'}
                      </p>
                      {isPlayerReady && (
                        <>
                          <p className="text-xs text-text-grey">
                            State: {getPlayerStateName(playerState)} | Time: {currentVideoTime.toFixed(0)}s / {videoDuration.toFixed(0)}s | Speed: {playbackRate}x
                          </p>
                          <p className="text-xs text-text-grey">
                            Progress: {videoDuration > 0 ? ((currentVideoTime / videoDuration) * 100).toFixed(1) : 0}%
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 ml-4">
                <button 
                  onClick={handleCompleteLesson}
                  className="px-6 py-2 bg-logo-blue text-white rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoadingLesson}
                >
                  {nextLesson ? 'Next Lesson' : 'Finish'}
                </button>
                
                <div className="text-xs text-unavailable-button text-right">
                  {isLoadingQuiz ? (
                    <span className="text-logo-blue">Loading quiz...</span>
                  ) : quizError ? (
                    <span className="text-status-yellow">Quiz unavailable</span>
                  ) : (
                    <span>
                      {transformedQuizQuestions.length} quiz question{transformedQuizQuestions.length !== 1 ? 's' : ''} ready
                      {quizData && quizData.length > 0 && (
                        <span className="text-status-green"> (from server)</span>
                      )}
                    </span>
                  )}
                </div>

                {/* ═══ TEMP DEV BUTTONS — Remove before production ═══ */}
                <div className="mt-2 flex flex-col gap-1.5 border-t border-dashed border-status-yellow/50 pt-2">
                  <button
                    onClick={handleDevCompleteLesson}
                    disabled={isDevCompleting || !isValidBackendId}
                    className="px-4 py-1.5 bg-status-yellow text-text-blue-black rounded-full text-xs font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isDevCompleting ? (
                      <>
                        <span className="animate-spin h-3 w-3 border-2 border-text-blue-black border-t-transparent rounded-full" />
                        Completing...
                      </>
                    ) : (
                      '🧪 Complete Lesson'
                    )}
                  </button>

                  {isLastLesson && (
                    <button
                      onClick={handleDevLaunchFreeRoam}
                      disabled={isDevFreeRoam || !module?.backendId}
                      className="px-4 py-1.5 bg-status-green text-text-blue-black rounded-full text-xs font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isDevFreeRoam ? (
                        <>
                          <span className="animate-spin h-3 w-3 border-2 border-text-blue-black border-t-transparent rounded-full" />
                          Loading...
                        </>
                      ) : (
                        '🧪 Launch Free Roam'
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleDevResetGYN}
                    disabled={isDevResetting || !isValidBackendId}
                    className="px-4 py-1.5 bg-status-red text-white rounded-full text-xs font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isDevResetting ? (
                      <>
                        <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                        Resetting...
                      </>
                    ) : (
                      '🧪 Reset GYN (replay)'
                    )}
                  </button>

                  <span className="text-[10px] text-status-yellow italic">
                    Dev only — remove before launch
                  </span>
                </div>
              </div>
            </div>

            {viewMode === 'video' && (
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
            )}

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

            {nextLesson && (
              <div className="mt-6 border-t pt-4">
                <button
                  onClick={handleNextLesson}
                  disabled={isLoadingLesson}
                  className="w-full px-6 py-3 bg-white/60 backdrop-blur-sm text-text-grey rounded-lg hover:bg-white/70 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next: {nextLesson.title}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grow Your Nest Prompt Modal */}
      <GrowYourNestPromptModal
        isOpen={showGYNPromptModal}
        onPlay={handleGYNPlay}
        onDismiss={handleGYNDismiss}
        lessonTitle={displayTitle}
      />
    </div>
  );
};

export default LessonView;