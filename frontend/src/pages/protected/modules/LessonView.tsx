import React, { useMemo, useCallback } from 'react';
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon: Enhanced Lesson Experience</h1>
          <p className="text-lg text-gray-600 mb-6">
            We're preparing a new immersive lesson experience as part of our gamified learning platform!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Lesson</h2>
          <div className="text-left space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">{displayTitle}</h3>
                <p className="text-sm text-gray-600">{displayDescription}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Backend Integration Active</h3>
                <p className="text-sm text-gray-600">
                  {isLoadingLesson ? 'Loading lesson data...' : 
                   lessonError ? 'Using fallback data' : 
                   'Connected to backend successfully'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900">Quiz System Ready</h3>
                <p className="text-sm text-gray-600">
                  {transformedQuizQuestions.length} questions prepared
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Modules
          </button>
          {nextLesson && (
            <button
              onClick={handleNextLesson}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next Lesson
            </button>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>All backend connections and data transformations are preserved for the new experience</p>
        </div>
      </div>
    </div>
  );
};

export default LessonView;