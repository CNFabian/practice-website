import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Module, Lesson } from '../../../types/modules';
import { useLesson, useLessonQuiz } from '../../../hooks/queries/useLearningQueries';
import { useCompleteLesson } from '../../../hooks/mutations/useCompleteLesson';
import { useUpdateLessonProgress } from '../../../hooks/mutations/useUpdateLessonProgress';
import { LessonViewBackground } from '../../../assets';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
  onNextLesson?: (lessonId: number, moduleBackendId: string) => void;
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

const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  module, 
  onBack,
  onNextLesson
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'reading'>('video');
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Add ref for scrollable container

  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.style.setProperty('background', `url(${LessonViewBackground})`, 'important');
      bgElement.style.backgroundSize = 'cover';
      bgElement.style.backgroundPosition = 'center';
      bgElement.style.backgroundRepeat = 'no-repeat';
    }

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

  const handleCompleteLesson = useCallback(() => {
    console.log('🔄 Complete lesson called');
    console.log('Next lesson:', nextLesson);
    console.log('Module backend ID:', module.backendId);
    
    // First, try to complete the lesson on backend (if valid IDs exist)
    if (isValidBackendId && module?.backendId) {
      completeLessonMutation({ lessonId: lesson.backendId! }, {
        onSuccess: () => {
          console.log('✅ Lesson completed successfully on backend');
        },
        onError: (error) => {
          console.error('❌ Failed to complete lesson on backend:', error);
        }
      });
    } else {
      console.warn('⚠️ Skipping backend completion - invalid backend IDs');
    }
    
    // Navigate based on whether there's a next lesson
    if (nextLesson && onNextLesson && module.backendId) {
      console.log('✅ Navigating to next lesson:', nextLesson.id, 'in module:', module.backendId);
      
      // Scroll the content container to very top instantly
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0; // Instant scroll to top
      }
      
      // Navigate to next lesson
      onNextLesson(nextLesson.id, module.backendId);
    } else if (!nextLesson) {
      console.log('✅ No next lesson - navigating back to house');
      // Navigate back to house when final lesson is completed
      onBack();
    } else if (!onNextLesson) {
      console.error('❌ No navigation handler provided');
    }
  }, [isValidBackendId, module?.backendId, completeLessonMutation, nextLesson, onNextLesson, onBack, lesson?.backendId]);

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
    <div className="h-screen flex flex-col bg-transparent">
      {/* Scrollable Main Content Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-7 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-text-blue-black font-bold hover:bg-black/10 rounded-xl px-3 py-2 -ml-3 transition-colors"
            >
              <span className="text-2xl mr-10">←</span>
              <span className="text-l">Back</span>
            </button>

            <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full p-1">
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
              </div>
            </div>

            {viewMode === 'video' && (
              <>
                <div className="mb-6">
                  <div className="rounded-2xl aspect-video flex items-center justify-center relative">
                    {lesson.videoUrl ? (
                      <iframe
                        src={`${lesson.videoUrl}?rel=0&showinfo=0&controls=1&modestbranding=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`}
                        title={lesson.title}
                        className="w-full h-full rounded-2xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
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
    </div>
  );
};

export default LessonView;