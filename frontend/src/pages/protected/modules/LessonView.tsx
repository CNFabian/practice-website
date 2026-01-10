import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModules } from '../../../hooks/useModules';
import { Module, Lesson } from '../../../types/modules.backup';
import { useLesson, useLessonQuiz } from '../../../hooks/queries/useLearningQueries';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
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
  return backendQuestions.map((q: BackendQuizQuestion, index: number) => {
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
          ...Object.fromEntries(
            sortedAnswers.slice(1).map((_, idx) => [
              String.fromCharCode(98 + idx),
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

  const { data: backendLessonData, isLoading: isLoadingLesson, error: lessonError } = useLesson(lesson?.backendId || '');
  const { data: quizData } = useLessonQuiz(lesson?.backendId || '');
  
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

  const handleNextLesson = useCallback(() => {
    if (!nextLesson) return;
    goToLesson(nextLesson.id, module.id);
  }, [nextLesson, goToLesson, module.id]);

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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
                <p className="text-sm text-gray-600 mt-1">{displayDescription}</p>
                {/* Backend status indicator */}
                {isLoadingLesson && (
                  <p className="text-xs text-blue-500 mt-1">Loading lesson data...</p>
                )}
                {lessonError && (
                  <p className="text-xs text-amber-500 mt-1">Using cached data</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors">
                  Finish
                </button>
                {/* Quiz indicator */}
                <span className="text-xs text-gray-500">
                  {transformedQuizQuestions.length} quiz questions ready
                </span>
              </div>
            </div>

            {/* Video Content Area */}
            {viewMode === 'video' && (
              <>
                <div className="mb-6">
                  <div className="min-h-[350px] flex items-center justify-center bg-gray-200 rounded-lg">
                    <div className="text-center">
                      <div className="w-64 h-64 mx-auto rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-32 h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Video content will appear here</p>
                    </div>
                  </div>
                </div>

                {/* Video Transcript Section */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">Video Transcript</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex gap-3">
                      <span className="text-gray-500 font-mono">0:00</span>
                      <p>Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness. That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Reading Content Area */}
            {viewMode === 'reading' && (
              <div className="mb-8">
                <div className="prose prose-gray max-w-none">
                  <p className="text-base text-gray-800 leading-relaxed mb-4">
                    Welcome to this module on Readiness and Decision Making in your homeownership journey. Buying a home is one of the most significant financial and emotional decisions you'll make. So before diving into listings and neighborhood visits, it's important to take a step back and assess your personal and financial readiness.
                  </p>
                  <p className="text-base text-gray-800 leading-relaxed">
                    That means understanding your current income, savings, debt, and how stable your job or life situation is. Are you ready to stay in one place for at least a few years? Do you feel comfortable with the idea of taking on a mortgage and the responsibilities that come with home maintenance?
                  </p>
                </div>
              </div>
            )}

            {/* Navigation footer */}
            {nextLesson && (
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleNextLesson}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-between"
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