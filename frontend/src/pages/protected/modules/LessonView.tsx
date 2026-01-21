import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModules } from '../../../hooks/useModules';
import { Module, Lesson } from '../../../types/modules';
import { useLesson, useLessonQuiz } from '../../../hooks/queries/useLearningQueries';
import { useCompleteLesson } from '../../../hooks/mutations/useCompleteLesson';
import { useUpdateLessonProgress } from '../../../hooks/mutations/useUpdateLessonProgress';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
}

// Updated interface with is_correct field
interface BackendQuizAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  order_index: number;
  is_correct?: boolean; // Optional since backend may not always provide it
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

// Improved transform function with better error handling
const transformQuizQuestions = (backendQuestions: BackendQuizQuestion[]) => {
  if (!backendQuestions || !Array.isArray(backendQuestions)) {
    console.warn('⚠️ Invalid quiz questions data');
    return [];
  }

  return backendQuestions.map((q: BackendQuizQuestion, index: number) => {
    const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);
    
    // Find correct answer - try is_correct field first, fallback to first answer
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

const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  module, 
  onBack
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'reading'>('video');

  // Set the background for this section
  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.style.setProperty('background', 'rgb(243, 244, 246)', 'important');
      bgElement.style.backgroundSize = 'cover';
    }
  }, [lesson.id]);

  if (!lesson || !module) {
    console.error('❌ LessonView: Missing required props!');
    return <div className="p-8 text-center text-red-500">Missing lesson or module data</div>;
  }

  const { goToLesson } = useModules();

  // Validate backend ID before making API calls
  const isValidBackendId = useMemo(() => {
    const id = lesson?.backendId;
    if (!id) {
      console.warn('⚠️ No backendId found for lesson:', lesson?.id, lesson?.title);
      return false;
    }
    
    // Check if it's a UUID format (8-4-4-4-12 hex characters with dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(String(id));
    
    if (!isValidUUID) {
      console.warn('⚠️ Backend ID is not a valid UUID format:', id, '(expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
      return false;
    }
    
    console.log('✅ Valid backend UUID for lesson:', id);
    return true;
  }, [lesson?.backendId, lesson?.id, lesson?.title]);

  // Conditional API calls - only execute if we have valid backend ID
  const { 
    data: backendLessonData, 
    isLoading: isLoadingLesson, 
    error: lessonError 
  } = useLesson(isValidBackendId ? lesson.backendId! : '');
  
  const { 
    data: quizData,
    isLoading: isLoadingQuiz,
    error: quizError
  } = useLessonQuiz(isValidBackendId ? lesson.backendId! : '');
  
  // Mutations with validation
  const { mutate: completeLessonMutation } = useCompleteLesson(
    isValidBackendId ? lesson.backendId! : '', 
    module?.backendId || ''
  );
  
  const { mutate: updateLessonProgressMutation } = useUpdateLessonProgress(
    isValidBackendId ? lesson.backendId! : '', 
    module?.backendId || ''
  );

  // Transform quiz questions with memoization
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

  // Safe handler for completing lesson
  const handleCompleteLesson = useCallback(() => {
    if (!isValidBackendId || !module?.backendId) {
      console.error('❌ Cannot complete lesson - invalid backend IDs');
      console.error('Lesson backendId:', lesson?.backendId);
      console.error('Module backendId:', module?.backendId);
      // Still allow navigation even if backend call fails
      if (nextLesson) {
        goToLesson(nextLesson.id, module.id);
      }
      return;
    }
    
    completeLessonMutation({ lessonId: lesson.backendId! }, {
      onSuccess: () => {
        console.log('✅ Lesson completed successfully');
        if (nextLesson) {
          goToLesson(nextLesson.id, module.id);
        }
      },
      onError: (error) => {
        console.error('❌ Failed to complete lesson:', error);
        // Still allow navigation even if backend call fails
        if (nextLesson) {
          goToLesson(nextLesson.id, module.id);
        }
      }
    });
  }, [isValidBackendId, module?.backendId, module?.id, completeLessonMutation, nextLesson, goToLesson, lesson?.backendId]);

  // Safe handler for updating progress
  const handleVideoProgress = useCallback((seconds: number) => {
    if (!isValidBackendId || !module?.backendId) {
      console.warn('⚠️ Cannot update progress - invalid backend IDs');
      return;
    }
    
    updateLessonProgressMutation({ 
      lessonId: lesson.backendId!, 
      videoProgressSeconds: seconds 
    }, {
      onSuccess: () => {
        console.log('✅ Progress updated:', seconds, 'seconds');
      },
      onError: (error) => {
        console.error('❌ Failed to update progress:', error);
      }
    });
  }, [isValidBackendId, module?.backendId, updateLessonProgressMutation, lesson?.backendId]);

  const handleNextLesson = useCallback(() => {
    if (!nextLesson) return;
    handleCompleteLesson();
  }, [nextLesson, handleCompleteLesson]);

  const displayTitle = backendLessonData?.title || lesson.title;
  const displayDescription = backendLessonData?.description || lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership.";

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar with Back Button and Toggle */}
      <div className="border-b z-10 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button Section */}
            <button
              onClick={onBack}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {/* Toggle Section */}
            <div className="flex items-center bg-gray-100 rounded-full p-1">
              <button 
                onClick={() => setViewMode('video')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'video' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Video Lesson
              </button>
              <button 
                onClick={() => setViewMode('reading')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'reading' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                Reading
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Main Content Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-lg shadow-sm p-8">
            {/* Title and Finish Button */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
                <p className="text-sm text-gray-600 mt-1">{displayDescription}</p>
                
                {/* Enhanced Backend Status Indicators */}
                <div className="mt-2 space-y-1">
                  {isLoadingLesson && (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <p className="text-xs text-blue-500">Loading lesson data from server...</p>
                    </div>
                  )}
                  
                  {lessonError && !isLoadingLesson && (
                    <div className="bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      <p className="text-xs text-amber-700">
                        ⚠️ Unable to load lesson data from server. Using local data.
                      </p>
                    </div>
                  )}
                  
                  {!isValidBackendId && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
                      <p className="text-xs text-yellow-700">
                        📌 This lesson is using demonstration mode
                      </p>
                    </div>
                  )}
                  
                  {isValidBackendId && !lessonError && !isLoadingLesson && backendLessonData && (
                    <p className="text-xs text-green-600">
                      ✓ Connected to server
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 ml-4">
                <button 
                  onClick={handleCompleteLesson}
                  className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoadingLesson}
                >
                  {nextLesson ? 'Next Lesson' : 'Finish'}
                </button>
                
                {/* Quiz Status Indicator */}
                <div className="text-xs text-gray-500 text-right">
                  {isLoadingQuiz ? (
                    <span className="text-blue-500">Loading quiz...</span>
                  ) : quizError ? (
                    <span className="text-amber-500">Quiz unavailable</span>
                  ) : (
                    <span>
                      {transformedQuizQuestions.length} quiz question{transformedQuizQuestions.length !== 1 ? 's' : ''} ready
                      {quizData && quizData.length > 0 && (
                        <span className="text-green-600"> (from server)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Video Content Area */}
            {viewMode === 'video' && (
              <>
                <div className="mb-6">
                  <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative">
                    {lesson.videoUrl ? (
                      <iframe
                        src={`${lesson.videoUrl}?rel=0&showinfo=0&controls=1&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
                        title={lesson.title}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
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
                        <p className="text-gray-500 text-sm">No video available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Transcript Section */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Video Transcript</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    {backendLessonData?.video_transcription ? (
                      (() => {
                        // Split transcript by timestamp pattern [HH:MM:SS]
                        const timestampRegex = /\[(\d{2}:\d{2}:\d{2})\]/g;
                        const segments: Array<{ timestamp: string; text: string }> = [];
                        
                        let match;
                        let lastIndex = 0;
                        
                        while ((match = timestampRegex.exec(backendLessonData.video_transcription)) !== null) {
                          if (lastIndex > 0) {
                            // Add the previous segment's text
                            const text = backendLessonData.video_transcription
                              .substring(lastIndex, match.index)
                              .trim();
                            if (text) {
                              segments[segments.length - 1].text = text;
                            }
                          }
                          
                          // Start a new segment
                          segments.push({
                            timestamp: match[1],
                            text: ''
                          });
                          
                          lastIndex = match.index + match[0].length;
                        }
                        
                        // Add the last segment's text
                        if (segments.length > 0 && lastIndex < backendLessonData.video_transcription.length) {
                          segments[segments.length - 1].text = backendLessonData.video_transcription
                            .substring(lastIndex)
                            .trim();
                        }
                        
                        return segments.map((segment, index) => {
                          // Convert HH:MM:SS to MM:SS
                          const timeFormatted = segment.timestamp.substring(3); // Remove first 3 chars (HH:)
                          
                          return (
                            <div key={index} className="flex gap-3">
                              <span className="text-gray-500 font-mono">{timeFormatted}</span>
                              <p>{segment.text}</p>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="flex gap-3">
                        <span className="text-gray-500 font-mono">0:00</span>
                        <p>Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness. That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reading Content Area */}
            {viewMode === 'reading' && (
              <div className="mb-8">
                <div className="prose prose-gray max-w-none">
                  {backendLessonData?.video_transcription ? (
                    (() => {
                      // Remove all timestamps [HH:MM:SS] from the transcript
                      const cleanText = backendLessonData.video_transcription
                        .replace(/\[\d{2}:\d{2}:\d{2}\]/g, '')
                        .trim();
                      
                      // Split into sentences (roughly) for better paragraph formatting
                      const sentences = cleanText.split(/(?<=[.!?])\s+/);
                      
                      // Group sentences into paragraphs (every 3-4 sentences)
                      const paragraphs: string[] = [];
                      let currentParagraph: string[] = [];
                      
                      sentences.forEach((sentence: string, index: number) => {
                        currentParagraph.push(sentence);
                        
                        // Create a new paragraph every 3-4 sentences or at the end
                        if (currentParagraph.length >= 3 || index === sentences.length - 1) {
                          paragraphs.push(currentParagraph.join(' '));
                          currentParagraph = [];
                        }
                      });
                      
                      return paragraphs.map((paragraph, index) => (
                        <p key={index} className="text-base text-gray-800 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      ));
                    })()
                  ) : (
                    <>
                      <p className="text-base text-gray-800 leading-relaxed mb-4">
                        Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness.
                      </p>
                      <p className="text-base text-gray-800 leading-relaxed">
                        That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Navigation footer */}
            {nextLesson && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleNextLesson}
                  disabled={isLoadingLesson}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default LessonView;