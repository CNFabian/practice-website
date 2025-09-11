import React, { useState } from 'react';
import { useModules } from '../../hooks/useModules';
import { Module, Lesson } from '../../types/modules';
import { 
  CoinIcon, 
} from '../../assets';
import LessonQuiz from './LessonQuiz';

interface LessonViewProps {
  lesson: Lesson;
  module: Module;
  onBack: () => void;
  isTransitioning?: boolean;
}

const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  module, 
  onBack, 
  isTransitioning = false 
}) => {
  // Redux state management
  const {
    sidebarCollapsed,
    toggleSidebar,
    currentLessonProgress,
    updateProgress,
    markCompleted,
    startQuiz,
    currentView
  } = useModules();

  // Keep your existing local state
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Redux handles showQuiz state now via currentView
  const showQuiz = currentView === 'quiz';

  const handleBack = () => {
    if (isTransitioning) return;
    onBack();
  };

  const toggleLessonInfo = () => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  };

  const handleStartQuiz = () => {
    if (isTransitioning) return;
    
    // Use the same sample questions structure but connect to Redux
    const sampleQuestions = [
      {
        id: 1,
        question: "What is the first step in preparing for homeownership?",
        options: [
          { id: 'a', text: 'Looking at houses online', isCorrect: false },
          { id: 'b', text: 'Assessing your financial readiness', isCorrect: true },
          { id: 'c', text: 'Talking to a real estate agent', isCorrect: false },
          { id: 'd', text: 'Getting pre-approved for a mortgage', isCorrect: false }
        ],
        explanation: {
          correct: "Assessing your financial readiness is crucial because it helps you understand what you can afford and prevents you from looking at homes outside your budget.",
          incorrect: {
            'a': { why_wrong: "Looking at houses online is premature without knowing your budget first.", confusion_reason: "Many people get excited about house hunting, but this can lead to disappointment if you're looking at unaffordable homes." },
            'b': { why_wrong: "This is actually the correct answer.", confusion_reason: "Correct choice." },
            'c': { why_wrong: "Talking to a real estate agent should come after you know your financial limits.", confusion_reason: "While agents are helpful, they can't help you effectively without knowing your budget constraints." },
            'd': { why_wrong: "Pre-approval comes after you've assessed what you can afford.", confusion_reason: "Pre-approval is important, but you need to know your own financial situation first before involving lenders." }
          }
        }
      }
    ];
    
    startQuiz(sampleQuestions, lesson.id);
  };

  const handleCloseQuiz = () => {
    // Redux will handle closing quiz and returning to lesson view
  };

  const handleQuizComplete = (score: number) => {
    console.log(`Quiz completed with score: ${score}%`);
    // Redux will handle updating lesson progress with quiz completion
    markCompleted(lesson.id, module.id, score);
  };

  // Track lesson progress with Redux
  const handleVideoProgress = (progressPercent: number) => {
    updateProgress(lesson.id, {
      watchProgress: progressPercent
    });

    // Auto-complete lesson when video is 95% watched
    if (progressPercent >= 95 && !currentLessonProgress?.completed) {
      markCompleted(lesson.id, module.id);
    }
  };

  const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
  const nextLesson = currentLessonIndex < module.lessons.length - 1 
    ? module.lessons[currentLessonIndex + 1] 
    : null;

  const lessonDescription = lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership and understand why lenders evaluate.";

  // Get progress from Redux
  const watchProgress = currentLessonProgress?.watchProgress || 0;
  const isCompleted = currentLessonProgress?.completed || false;
  const quizCompleted = currentLessonProgress?.quizCompleted || false;

  return (
    <div className="pt-6 w-full h-full">
      <div className="flex h-full w-full">
        {/* Arrow Toggle */}
        <button
          onClick={toggleLessonInfo}
          disabled={isTransitioning}
          className={`relative ml-4 top-60 x-10 z-10 w-4 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
            sidebarCollapsed ? '' : 'left-[calc(30%+2px)]'
          }`}
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
            className="h-full px-2 flex flex-col overflow-y-auto -ml-8" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {/* Top Fixed Content */}
            <div className="flex-shrink-0">
              {/* Back Button */}
              <div className="py-2">
                <button
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Module
                </button>
              </div>

              {/* Lesson Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {lesson.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">{lesson.duration}</span>
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Progress Bar from Redux */}
                  {watchProgress > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs text-gray-600">{watchProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${watchProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg w-full transition-all duration-700 ease-in-out overflow-hidden"
                style={{ 
                  height: descriptionExpanded ? '64px' : 'min(calc(100vh - 600px), 300px)',
                  minHeight: descriptionExpanded ? '64px' : '120px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img src={lesson.image} alt={lesson.title} className="object-contain w-full h-full" />
                  
                  {/* Completion badge from Redux */}
                  {isCompleted && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Progress overlay from Redux */}
                  {watchProgress > 0 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {watchProgress}%
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
                    lessonDescription.length > 120 ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (lessonDescription.length > 120) {
                      setDescriptionExpanded(!descriptionExpanded);
                    }
                  }}
                >
                  {descriptionExpanded || lessonDescription.length <= 120 ? (
                    lessonDescription
                  ) : (
                    <>
                      {lessonDescription.substring(0, 120)}
                      <span className="text-blue-600 font-medium">...</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </p>
              </div>

              {/* Test Knowledge Button */}
              <button 
                onClick={handleStartQuiz}
                disabled={isTransitioning}
                className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                  quizCompleted
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {quizCompleted ? 'Retake Quiz' : 'Test Your Knowledge'}
              </button>

              {/* Completion Status from Redux */}
              {isCompleted && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                  <span className="text-xs font-medium">Lesson Completed</span>
                </div>
              )}

              {/* Quiz Status from Redux */}
              {quizCompleted && (
                <div className="flex items-center gap-2 text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-xs font-medium">Quiz Completed</span>
                  {currentLessonProgress?.quizScore && (
                    <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full">
                      {currentLessonProgress.quizScore}%
                    </span>
                  )}
                </div>
              )}

              {/* Rewards */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Rewards</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1.5 rounded-lg">
                    <img src={CoinIcon} alt="Coins" className="w-5 h-5" />
                    <span className="text-xs font-medium">+{lesson.coins} NestCoins</span>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-1.5 rounded-lg">
                    <div className="w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🎖️</span>
                    </div>
                    <span className="text-xs font-medium">Badge Progress</span>
                  </div>
                </div>
              </div>

              {/* Next Lesson */}
              {nextLesson && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <h4 className="text-sm font-semibold mb-1">Next Lesson</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">💳</span>
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-medium truncate">{nextLesson.title}</h5>
                      <p className="text-xs text-gray-600">{nextLesson.duration}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <button 
                  disabled={isTransitioning || currentLessonIndex === 0}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {nextLesson ? (
                  <button 
                    disabled={isTransitioning}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    onClick={handleBack}
                    disabled={isTransitioning}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete
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
          sidebarCollapsed ? 'flex-1' : 'w-[70%]'
        }`}>
          {/* Main Video Content */}
          <div className={`h-full transition-transform duration-700 ease-in-out ${
            showQuiz ? '-translate-x-full' : 'translate-x-0'
          }`}>
            <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 px-4">
              <div className="space-y-6 pb-6">
                {/* Video Player */}
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <button 
                        onClick={() => handleVideoProgress(Math.min(100, watchProgress + 10))}
                        className="w-8 h-8 text-white hover:text-blue-400 transition-colors"
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="text-right text-sm text-gray-500 mt-4">
                      {lesson.duration}
                    </div>
                  </div>
                  
                  {/* Video Progress Bar */}
                  {watchProgress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white bg-opacity-20 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${watchProgress}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{watchProgress}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Transcript */}
                {lesson.transcript && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Video Transcript</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <span className="text-sm text-gray-500 min-w-[3rem]">0:00</span>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {lesson.transcript}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lesson Navigation */}
                <div className="flex gap-3">
                  <button 
                    disabled={isTransitioning || currentLessonIndex === 0}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous Lesson
                  </button>
                  {nextLesson ? (
                    <button 
                      disabled={isTransitioning}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next Lesson
                    </button>
                  ) : (
                    <button 
                      onClick={handleBack}
                      disabled={isTransitioning}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Module
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