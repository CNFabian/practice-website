import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useModules } from '../../../hooks/useModules';
import { Module, Lesson } from '../../../types/modules';
import { CoinIcon, BadgeMedal, RobotoFont } from '../../../assets';
import { LessonQuiz } from '../../../components';
import { useLesson, useLessonQuiz } from '../../../hooks/queries/useLearningQueries';
import { useCompleteLesson } from '../../../hooks/mutations/useCompleteLesson';
import { useUpdateLessonProgress } from '../../../hooks/mutations/useUpdateLessonProgress';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
  isTransitioning?: boolean;
}

interface BackendQuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: string;
  explanation: string;
  order_index: number;
  answers: {
    id: string;
    question_id: string;
    answer_text: string;
    order_index: number;
  }[];
}

// Mock quiz data for fallback when backend data is not available
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
  },
  {
    id: 2,
    question: "What does PMI stand for?",
    options: [
      { id: "a", text: "Private Mortgage Insurance", isCorrect: true },
      { id: "b", text: "Public Mortgage Investment", isCorrect: false },
      { id: "c", text: "Primary Monthly Interest", isCorrect: false },
      { id: "d", text: "Property Management Insurance", isCorrect: false }
    ],
    explanation: {
      correct: "Correct! PMI stands for Private Mortgage Insurance, which protects lenders when you put down less than 20%.",
      incorrect: {
        "b": { 
          why_wrong: "PMI is not related to public investments.",
          confusion_reason: "The 'Public' and 'Investment' terms might seem related to mortgages but are incorrect."
        },
        "c": { 
          why_wrong: "PMI is not about monthly interest calculations.",
          confusion_reason: "While PMI does affect monthly payments, it's insurance, not interest."
        },
        "d": { 
          why_wrong: "PMI is not property management insurance.",
          confusion_reason: "Both involve property and insurance, but PMI specifically protects the mortgage lender."
        }
      }
    }
  },
  {
    id: 3,
    question: "Which credit score range is considered excellent for mortgage applications?",
    options: [
      { id: "a", text: "800-850", isCorrect: true },
      { id: "b", text: "700-750", isCorrect: false },
      { id: "c", text: "650-700", isCorrect: false },
      { id: "d", text: "600-650", isCorrect: false }
    ],
    explanation: {
      correct: "Excellent! A credit score of 800-850 is considered excellent and will get you the best mortgage rates.",
      incorrect: {
        "b": { 
          why_wrong: "700-750 is considered good, but not excellent.",
          confusion_reason: "While this range qualifies for good rates, excellent rates require higher scores."
        },
        "c": { 
          why_wrong: "650-700 is considered fair to good, but not excellent.",
          confusion_reason: "This range can still qualify for mortgages but won't get the best rates."
        },
        "d": { 
          why_wrong: "600-650 is considered fair and may require higher interest rates.",
          confusion_reason: "This range may qualify for some loans but with less favorable terms."
        }
      }
    }
  },
  {
    id: 4,
    question: "What is the debt-to-income ratio that most lenders prefer?",
    options: [
      { id: "a", text: "Below 28%", isCorrect: true },
      { id: "b", text: "Below 40%", isCorrect: false },
      { id: "c", text: "Below 50%", isCorrect: false },
      { id: "d", text: "Below 60%", isCorrect: false }
    ],
    explanation: {
      correct: "Perfect! Most lenders prefer a debt-to-income ratio below 28% for the housing payment alone.",
      incorrect: {
        "b": { 
          why_wrong: "40% is often the maximum total debt-to-income ratio, not the preferred amount.",
          confusion_reason: "This might be the total DTI limit, but lenders prefer lower housing ratios."
        },
        "c": { 
          why_wrong: "50% is too high for most conventional mortgage approvals.",
          confusion_reason: "This high ratio would be risky for both lender and borrower."
        },
        "d": { 
          why_wrong: "60% debt-to-income ratio would be considered very high risk.",
          confusion_reason: "Such a high ratio would likely result in loan denial."
        }
      }
    }
  },
  {
    id: 5,
    question: "How long should you typically save bank statements before applying for a mortgage?",
    options: [
      { id: "a", text: "2-3 months", isCorrect: true },
      { id: "b", text: "1 month", isCorrect: false },
      { id: "c", text: "6 months", isCorrect: false },
      { id: "d", text: "1 year", isCorrect: false }
    ],
    explanation: {
      correct: "Correct! Lenders typically require 2-3 months of bank statements to verify your financial stability.",
      incorrect: {
        "b": { 
          why_wrong: "1 month is usually insufficient for lenders to assess financial patterns.",
          confusion_reason: "While recent, this doesn't show enough financial history for lenders."
        },
        "c": { 
          why_wrong: "6 months is more than typically required, though having them doesn't hurt.",
          confusion_reason: "While helpful to have, lenders usually only require 2-3 months."
        },
        "d": { 
          why_wrong: "1 year of bank statements is excessive for most mortgage applications.",
          confusion_reason: "This might be confused with other financial documents that require longer history."
        }
      }
    }
  }
];

// Memoized transformation function to prevent recalculation
const transformQuizQuestions = (backendQuestions: BackendQuizQuestion[]) => {
  return backendQuestions.map((q: BackendQuizQuestion, index: number) => {
    // Sort answers once and cache the result
    const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);
    
    return {
      id: index + 1, 
      question: q.question_text,
      options: sortedAnswers.map((answer, answerIndex) => ({
        id: String.fromCharCode(97 + answerIndex),
        text: answer.answer_text,
        isCorrect: answerIndex === 0
      })),
      explanation: {
        correct: q.explanation || "Correct! Well done.",
        incorrect: {
          // Generate explanations with both required properties
          ...Object.fromEntries(
            sortedAnswers.slice(1).map((_, idx) => [
              String.fromCharCode(98 + idx), // 'b', 'c', 'd', etc.
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

const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  module, 
  onBack, 
  isTransitioning = false 
}) => {

  if (!lesson || !module) {
    console.error('❌ LessonView: Missing required props!');
    return <div className="p-8 text-center text-red-500">Missing lesson or module data</div>;
  }

  const {
    sidebarCollapsed,
    toggleSidebar,
    startQuiz,
    currentView,
    goToLesson
  } = useModules();

  // Enhanced hooks with loading states
  const { data: backendLessonData, isLoading: isLoadingLesson, error: lessonError } = useLesson(lesson?.backendId || '');
  const { 
    data: quizData, 
    isLoading: isLoadingQuiz, 
    isFetching: isRefetchingQuiz,
    error: quizError 
  } = useLessonQuiz(lesson?.backendId || '');
  
  const { mutate: completeLessonMutation } = useCompleteLesson(lesson?.backendId || '', module?.backendId || '');
  const { mutate: updateLessonProgressMutation } = useUpdateLessonProgress(lesson?.backendId || '', module?.backendId || '');

  // State variables
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isQuizReady, setIsQuizReady] = useState(false);

  // Memoize transformed quiz questions to prevent recalculation
  const transformedQuizQuestions = useMemo(() => {
    // Use backend data if available, otherwise fallback to mock data
    if (quizData && Array.isArray(quizData) && quizData.length > 0) {
      console.log('🔄 Transforming backend quiz questions (memoized):', quizData.length);
      return transformQuizQuestions(quizData);
    } else {
      console.log('🔄 Using mock quiz questions as fallback:', MOCK_QUIZ_QUESTIONS.length);
      return MOCK_QUIZ_QUESTIONS;
    }
  }, [quizData]);

  // Check if quiz is ready when data changes
  useEffect(() => {
    // Quiz is ready if we have either backend data or can fallback to mock data
    const hasBackendData = !isLoadingQuiz && !isRefetchingQuiz && !quizError && quizData && Array.isArray(quizData) && quizData.length > 0;
    const canUseMockData = !isLoadingQuiz && !isRefetchingQuiz && (!quizData || quizData.length === 0);
    
    const isReady = hasBackendData || canUseMockData;
    setIsQuizReady(isReady);
    
    if (isReady) {
      if (hasBackendData) {
        console.log('✅ Quiz data ready with backend data');
      } else {
        console.log('✅ Quiz data ready with mock data fallback');
      }
    }
  }, [isLoadingQuiz, isRefetchingQuiz, quizData, quizError]);

  // Derived data with memoization
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

  const showQuiz = currentView === 'quiz';

  // Event Handlers with useCallback for optimization
  const handleBack = useCallback(() => {
    if (isTransitioning) return;
    onBack();
  }, [isTransitioning, onBack]);

  const toggleLessonInfo = useCallback(() => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  }, [isTransitioning, toggleSidebar, sidebarCollapsed]);

  const handleNextLesson = useCallback(() => {
    if (!nextLesson || isTransitioning) return;
    goToLesson(nextLesson.id, module.id);
  }, [nextLesson, isTransitioning, goToLesson, module.id]);

  const handlePreviousLesson = useCallback(() => {
    if (currentLessonIndex === 0 || isTransitioning) return;
    
    const previousLesson = module.lessons[currentLessonIndex - 1];
    if (previousLesson) {
      goToLesson(previousLesson.id, module.id);
    }
  }, [currentLessonIndex, isTransitioning, module.lessons, goToLesson, module.id]);

  const handleStartQuiz = useCallback(() => {
    if (isTransitioning) return;

    console.log('🚀 Starting quiz - Quiz Ready:', isQuizReady);

    if (!isQuizReady || !transformedQuizQuestions) {
      console.warn('⚠️ Quiz not ready yet. Loading state:', {
        isLoadingQuiz,
        isRefetchingQuiz,
        hasQuizData: !!quizData,
        hasTransformedData: !!transformedQuizQuestions,
        error: quizError?.message
      });
      return;
    }

    console.log('✅ Starting quiz instantly with pre-transformed data');
    startQuiz(transformedQuizQuestions, lesson.id);
  }, [
    isTransitioning, 
    isQuizReady, 
    transformedQuizQuestions, 
    startQuiz, 
    lesson.id,
    isLoadingQuiz,
    isRefetchingQuiz,
    quizData,
    quizError
  ]);

  const handleCloseQuiz = useCallback(() => {
    // Add quiz close logic here
  }, []);

  const handleQuizComplete = useCallback((score: number) => {
    console.log(`Quiz completed with score: ${score}%`);
  }, []);

  const handleVideoProgress = useCallback((progressPercent: number) => {
    const estimatedDurationMinutes = backendLessonData?.estimated_duration_minutes || 20;
    const estimatedDuration = estimatedDurationMinutes * 60;
    const progressSeconds = Math.floor((progressPercent / 100) * estimatedDuration);

    updateLessonProgressMutation(
      { lessonId: lesson.id.toString(), videoProgressSeconds: progressSeconds },
      {
        onSuccess: () => {
          console.log(`Progress updated: ${progressPercent}% (${progressSeconds}s out of ${estimatedDuration}s)`);
        },
        onError: (error) => {
          console.error('Error updating progress on backend:', error);
        },
      }
    );

    if (progressPercent >= 95 && !lesson.completed) {
      handleMarkComplete();
    }
  }, [backendLessonData, lesson, updateLessonProgressMutation]);

  const handleMarkComplete = useCallback(() => {
    completeLessonMutation(
      { lessonId: lesson.id.toString() },
      {
        onSuccess: (data) => {
          console.log('Lesson marked complete on backend:', data);
        },
        onError: (error) => {
          console.error('Error completing lesson on backend:', error);
        },
      }
    );
  }, [completeLessonMutation, lesson.id]);

  // Display values with fallbacks
  const displayTitle = backendLessonData?.title || lesson.title;
  const displayDescription = backendLessonData?.description || lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership and understand why lenders evaluate.";
  const displayImage = backendLessonData?.image_url || lesson.image;
  const displayTranscript = backendLessonData?.video_transcription || lesson.transcript;

  const isCompleted = lesson.completed || false;

  // Quiz button state logic
  const getQuizButtonState = () => {
    if (isLoadingQuiz || isRefetchingQuiz) {
      return {
        disabled: true,
        text: 'Loading Quiz...',
        className: 'w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-gray-400 text-white cursor-not-allowed'
      };
    }

    if (quizError) {
      return {
        disabled: false,
        text: 'Start Quiz (Demo)',
        className: 'w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-blue-600 text-white hover:bg-blue-700'
      };
    }

    if (!isQuizReady) {
      return {
        disabled: true,
        text: 'Preparing Quiz...',
        className: 'w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-yellow-400 text-white cursor-not-allowed'
      };
    }

    // Show different text based on data source
    const isUsingBackendData = quizData && Array.isArray(quizData) && quizData.length > 0;
    const buttonText = isUsingBackendData ? 'Test Your Knowledge' : 'Test Your Knowledge (Demo)';

    return {
      disabled: false,
      text: buttonText,
      className: 'w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm bg-blue-600 text-white hover:bg-blue-700'
    };
  };

  const quizButtonState = getQuizButtonState();

  return (
    <div className="pt-6 w-full h-full">
      <div className="flex h-full w-full">
        <button
          onClick={toggleLessonInfo}
          disabled={isTransitioning}
          className={`relative z-10 w-4 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0`}
          style={{
            top: '240px'
          }}
        >
          <svg 
            className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Left Column - Lesson Info */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[30%] opacity-100'
        }`}>
          <div 
            className="h-full px-2 flex flex-col overflow-y-auto" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {/* Top Fixed Content */}
            <div className="flex-shrink-0">
              {/* Back Button and Quiz Status Row */}
              <div className="pb-2 flex items-center justify-between gap-2 min-w-0">
                <button
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <RobotoFont weight={500} className="text-blue-600 whitespace-nowrap">
                    Back to Module
                  </RobotoFont>
                </button>
              </div>

              {/* Lesson Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <RobotoFont as="h1" weight={700} className="text-xl text-gray-900 mb-1 leading-tight">
                    {displayTitle}
                  </RobotoFont>
                  <div className="flex items-center gap-2 mb-1">
                    <RobotoFont className="text-xs text-gray-600">
                      {lesson.duration}
                    </RobotoFont>
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' ? 'bg-blue-100 text-blue-700' :
                            tag === 'Intermediate' ? 'bg-purple-100 text-purple-700' :
                            tag === 'Finance' ? 'bg-green-100 text-green-700' :
                            tag === 'Process' ? 'bg-orange-100 text-orange-700' :
                            tag === 'Maintenance' ? 'bg-red-100 text-red-700' :
                            tag === 'Safety' ? 'bg-yellow-100 text-yellow-700' :
                            tag === 'Technology' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <RobotoFont weight={500}>
                            {tag}
                          </RobotoFont>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading/Error State */}
              {isLoadingLesson && (
                <div className="text-xs text-gray-500 pb-2">
                  <RobotoFont className="text-xs">Loading lesson details...</RobotoFont>
                </div>
              )}
              {lessonError && (
                <div className="text-xs text-red-500 pb-2">
                  <RobotoFont className="text-xs">
                    {lessonError instanceof Error ? lessonError.message : 'Failed to load lesson'}
                  </RobotoFont>
                </div>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg w-full transition-all duration-700 ease-in-out overflow-hidden"
                style={{ 
                  height: descriptionExpanded ? '64px' : 'min(calc(100vh - 600px), 300px)',
                  minHeight: descriptionExpanded ? '64px' : '120px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img src={displayImage} alt={displayTitle} className="object-contain w-full h-full" />
                  
                  {/* Completion badge from Redux */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 py-3 border-t border-gray-100 space-y-3">
              {/* Lesson Description */}
              <div className="bg-blue-50 rounded-lg p-2">
                <div 
                  className={`text-xs text-gray-700 mb-1 leading-tight cursor-pointer transition-all duration-300 hover:text-gray-900 ${
                    displayDescription.length > 120 ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (displayDescription.length > 120) {
                      setDescriptionExpanded(!descriptionExpanded);
                    }
                  }}
                >
                  <RobotoFont className="text-xs text-gray-700">
                    {descriptionExpanded || displayDescription.length <= 120 ? (
                      displayDescription
                    ) : (
                      <>
                        {displayDescription.substring(0, 120)}
                        <span className="text-blue-600 font-medium">...</span>
                      </>
                    )}
                  </RobotoFont>
                </div>
                <RobotoFont className="text-xs text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </RobotoFont>
              </div>

              {/* Enhanced Test Knowledge Button with Loading States */}
              <button
                onClick={handleStartQuiz}
                disabled={quizButtonState.disabled}
                className={quizButtonState.className}
              >
                <div className="flex items-center justify-center">
                  <RobotoFont weight={500} className="text-white">
                    {quizButtonState.text}
                  </RobotoFont>
                  {(isLoadingQuiz || isRefetchingQuiz) && (
                    <svg className="animate-spin -mr-1 ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
              </button>

              {/* Rewards Section with Remaining Coins and Badge Status */}
              <div>
                <RobotoFont as="h3" weight={600} className="text-sm mb-2">
                  Rewards
                </RobotoFont>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1.5 rounded-lg">
                    <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
                    <RobotoFont weight={500} className="text-xs">
                      {(() => {
                        const totalQuestions = 5;
                        const maxCoinsForLesson = totalQuestions * 5; // 5 coins per question = 25 total
                        return `+${maxCoinsForLesson} NestCoins`;
                      })()}
                    </RobotoFont>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 pt-1.5 rounded-lg">
                    <img
                      src={BadgeMedal}
                      alt="Badge"
                      className="w-7 h-7 transition-all duration-300 opacity-100 brightness-0"
                    />
                    <RobotoFont weight={500} className="text-xs">
                      Lesson Badge
                    </RobotoFont>
                  </div>
                </div>
              </div>

              {/* Next Lesson */}
              {nextLesson && (
                <div className="bg-gray-50 rounded-lg pb-2 px-2">
                  <RobotoFont as="h4" weight={600} className="text-sm mb-1">
                    Next Lesson
                  </RobotoFont>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">💳</span>
                    </div>
                    <div className="min-w-0">
                      <RobotoFont as="h5" weight={500} className="text-xs truncate">
                        {nextLesson.title}
                      </RobotoFont>
                      <RobotoFont className="text-xs text-gray-600">
                        {nextLesson.duration}
                      </RobotoFont>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={handlePreviousLesson}
                  disabled={isTransitioning || currentLessonIndex === 0}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RobotoFont weight={500} className="text-gray-700">
                    Previous
                  </RobotoFont>
                </button>
                {nextLesson ? (
                  <button 
                    onClick={handleNextLesson}
                    disabled={isTransitioning}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RobotoFont weight={500} className="text-white">
                      Next
                    </RobotoFont>
                  </button>
                ) : (
                  <button 
                    onClick={handleMarkComplete}
                    disabled={isTransitioning}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RobotoFont weight={500} className="text-white">
                      Complete
                    </RobotoFont>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0' : 'w-px bg-gray-200 mx-2'
        }`} />

        {/* Right Column - Video Player */}
        <div className={`transition-all duration-300 ease-in-out relative overflow-hidden ${
          sidebarCollapsed ? 'w-[80%] mx-auto' : 'w-[calc(70%-1rem)]'
        }`}>
          {/* Main Video Content */}
          <div className={`h-full transition-transform duration-700 ease-in-out ${
            showQuiz ? '-translate-x-full' : 'translate-x-0'
          }`}>
            <div className={`h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${
              sidebarCollapsed ? 'px-6' : 'px-4'
            }`}>
              <div className="space-y-6 pb-6">
                {/* Video Player */}
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <button
                        onClick={() => handleVideoProgress(10)}
                        className="w-8 h-8 text-white hover:text-blue-400 transition-colors"
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <RobotoFont className="text-right text-sm text-gray-500 mt-4">
                      {lesson.duration}
                    </RobotoFont>
                  </div>
                </div>

                {/* Video Transcript */}
                {displayTranscript && (
                  <div>
                    <RobotoFont as="h3" weight={600} className="text-lg mb-4">
                      Video Transcript
                    </RobotoFont>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <RobotoFont weight={500} className="text-sm text-gray-500 min-w-[3rem]">
                            0:00
                          </RobotoFont>
                          <RobotoFont className="text-sm text-gray-700 leading-relaxed">
                            {displayTranscript}
                          </RobotoFont>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lesson Navigation */}
                <div className="flex gap-3">
                  <button 
                    onClick={handlePreviousLesson}
                    disabled={isTransitioning || currentLessonIndex === 0}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RobotoFont weight={500} className="text-gray-700">
                      Previous Lesson
                    </RobotoFont>
                  </button>
                  {nextLesson ? (
                    <button 
                      onClick={handleNextLesson}
                      disabled={isTransitioning}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RobotoFont weight={500} className="text-white">
                        Next Lesson
                      </RobotoFont>
                    </button>
                  ) : (
                    <button 
                      onClick={handleMarkComplete}
                      disabled={isTransitioning}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RobotoFont weight={500} className="text-white">
                        Complete Module
                      </RobotoFont>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Overlay */}
          <div className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out ${
            showQuiz ? 'translate-x-0' : 'translate-x-full'
          }`}>
            {showQuiz && (
              <LessonQuiz
                lesson={lesson}
                module={module}
                isVisible={showQuiz}
                onClose={handleCloseQuiz}
                onComplete={handleQuizComplete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;