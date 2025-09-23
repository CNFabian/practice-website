import React, { useState } from 'react';
import { useModules } from '../../../hooks/useModules';
import { Module, Lesson } from '../../../types/modules';
import { CoinIcon, BadgeMedal, RobotoFont } from '../../../assets';
import { LessonQuiz } from '../../../components';

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
  const {
    sidebarCollapsed,
    toggleSidebar,
    currentLessonProgress,
    updateProgress,
    markCompleted,
    startQuiz,
    currentView,
    goToLesson
  } = useModules();

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const showQuiz = currentView === 'quiz';

  const handleBack = () => {
    if (isTransitioning) return;
    onBack();
  };

  const toggleLessonInfo = () => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  };

  const handleNextLesson = () => {
    if (!nextLesson || isTransitioning) return;
    
    goToLesson(nextLesson.id, module.id);
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex === 0 || isTransitioning) return;
    
    const previousLesson = module.lessons[currentLessonIndex - 1];
    if (previousLesson) {
      goToLesson(previousLesson.id, module.id);
    }
  };

  const handleStartQuiz = () => {
    if (isTransitioning) return;
    
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
      },
      {
        id: 2,
        question: "What percentage of your monthly income should typically go toward housing costs?",
        options: [
          { id: 'a', text: '20%', isCorrect: false },
          { id: 'b', text: '28%', isCorrect: true },
          { id: 'c', text: '35%', isCorrect: false },
          { id: 'd', text: '40%', isCorrect: false }
        ],
        explanation: {
          correct: "The 28% rule is a widely accepted guideline that helps ensure you can afford your housing costs while maintaining financial stability for other expenses.",
          incorrect: {
            'a': { why_wrong: "20% is too conservative for most people and may limit housing options unnecessarily.", confusion_reason: "While being conservative with money is good, 20% might be too restrictive in today's housing market." },
            'b': { why_wrong: "This is actually the correct answer.", confusion_reason: "Correct choice." },
            'c': { why_wrong: "35% puts you at risk of being house poor with little money for other expenses.", confusion_reason: "This might seem reasonable if you really want a nice home, but it leaves little room for emergencies or other goals." },
            'd': { why_wrong: "40% is dangerously high and could lead to financial stress.", confusion_reason: "This percentage would make it very difficult to save money or handle unexpected expenses." }
          }
        }
      },
      {
        id: 3,
        question: "What is the minimum recommended credit score for a conventional mortgage?",
        options: [
          { id: 'a', text: '580', isCorrect: false },
          { id: 'b', text: '620', isCorrect: true },
          { id: 'c', text: '680', isCorrect: false },
          { id: 'd', text: '720', isCorrect: false }
        ],
        explanation: {
          correct: "620 is typically the minimum credit score for a conventional mortgage, though higher scores get better interest rates.",
          incorrect: {
            'a': { why_wrong: "580 is the minimum for FHA loans, not conventional mortgages.", confusion_reason: "You might be thinking of FHA loans, which have lower credit requirements but come with mortgage insurance." },
            'b': { why_wrong: "This is actually the correct answer.", confusion_reason: "Correct choice." },
            'c': { why_wrong: "680 is a good score but higher than the minimum required.", confusion_reason: "While 680 will get you better rates, you can qualify with a lower score." },
            'd': { why_wrong: "720 is an excellent score but much higher than the minimum.", confusion_reason: "This score gets you the best rates, but you don't need it to qualify for a mortgage." }
          }
        }
      },
      {
        id: 4,
        question: "What does PMI stand for in home buying?",
        options: [
          { id: 'a', text: 'Personal Mortgage Insurance', isCorrect: false },
          { id: 'b', text: 'Private Mortgage Insurance', isCorrect: true },
          { id: 'c', text: 'Property Management Insurance', isCorrect: false },
          { id: 'd', text: 'Primary Mortgage Investment', isCorrect: false }
        ],
        explanation: {
          correct: "Private Mortgage Insurance protects the lender if you default on your loan. It's required when you put down less than 20%.",
          incorrect: {
            'a': { why_wrong: "It's Private, not Personal Mortgage Insurance.", confusion_reason: "The terms sound similar, but PMI specifically refers to Private Mortgage Insurance." },
            'b': { why_wrong: "This is actually the correct answer.", confusion_reason: "Correct choice." },
            'c': { why_wrong: "Property Management Insurance is a different type of coverage entirely.", confusion_reason: "This sounds related to real estate, but it's for property management companies, not home buyers." },
            'd': { why_wrong: "PMI has nothing to do with investments.", confusion_reason: "While mortgages can be investments for lenders, PMI is purely about insurance protection." }
          }
        }
      },
      {
        id: 5,
        question: "How much should you typically have saved for a down payment on a conventional loan?",
        options: [
          { id: 'a', text: '3%', isCorrect: false },
          { id: 'b', text: '5%', isCorrect: false },
          { id: 'c', text: '10%', isCorrect: false },
          { id: 'd', text: '20%', isCorrect: true }
        ],
        explanation: {
          correct: "20% down payment helps you avoid PMI and typically gets you better loan terms and interest rates.",
          incorrect: {
            'a': { why_wrong: "3% is available but comes with PMI and higher long-term costs.", confusion_reason: "Some programs allow 3% down, but this isn't typical for conventional loans and costs more over time." },
            'b': { why_wrong: "5% is possible but still requires PMI and higher costs.", confusion_reason: "While some lenders accept 5%, you'll pay PMI and higher interest rates." },
            'c': { why_wrong: "10% is better than 5% but you'll still pay PMI.", confusion_reason: "Getting closer to 20%, but you'll still have additional costs with PMI." },
            'd': { why_wrong: "This is actually the correct answer.", confusion_reason: "Correct choice." }
          }
        }
      }
    ];
    
    startQuiz(sampleQuestions, lesson.id);
  };

  const handleCloseQuiz = () => {
  };

  const handleQuizComplete = (score: number) => {
    console.log(`Quiz completed with score: ${score}%`);
    markCompleted(lesson.id, module.id, score);
  };

  const handleVideoProgress = (progressPercent: number) => {
    updateProgress(lesson.id, {
      watchProgress: progressPercent
    });

    if (progressPercent >= 95 && !currentLessonProgress?.completed) {
      markCompleted(lesson.id, module.id);
    }
  };

  const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
  const nextLesson = currentLessonIndex < module.lessons.length - 1 
    ? module.lessons[currentLessonIndex + 1] 
    : null;

  const lessonDescription = lesson.description || "In this lesson, you'll learn the key financial steps to prepare for home ownership and understand why lenders evaluate.";

  const watchProgress = currentLessonProgress?.watchProgress || 0;
  const isCompleted = currentLessonProgress?.completed || false;
  const quizCompleted = currentLessonProgress?.quizCompleted || false;

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

                {/* Quiz Status from Redux */}
               {quizCompleted && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex-shrink-0 min-w-0">
                  {currentLessonProgress?.quizScore !== undefined && currentLessonProgress?.quizScore !== null && (
                    <RobotoFont weight={500} className="text-xs px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      {Math.round((currentLessonProgress.quizScore / 5) * 100)}%
                    </RobotoFont>
                  )}
                </div>
              )}
              </div>

              {/* Lesson Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <RobotoFont as="h1" weight={700} className="text-xl text-gray-900 mb-1 leading-tight">
                    {lesson.title}
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
                  <img src={lesson.image} alt={lesson.title} className="object-contain w-full h-full" />
                  
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
                    lessonDescription.length > 120 ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => {
                    if (lessonDescription.length > 120) {
                      setDescriptionExpanded(!descriptionExpanded);
                    }
                  }}
                >
                  <RobotoFont className="text-xs text-gray-700">
                    {descriptionExpanded || lessonDescription.length <= 120 ? (
                      lessonDescription
                    ) : (
                      <>
                        {lessonDescription.substring(0, 120)}
                        <span className="text-blue-600 font-medium">...</span>
                      </>
                    )}
                  </RobotoFont>
                </div>
                <RobotoFont className="text-xs text-gray-600">
                  When you have finished watching the video, earn rewards by testing your knowledge through a Lesson Quiz!
                </RobotoFont>
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
                <RobotoFont weight={500} className="text-white">
                  {quizCompleted ? 'Retake Quiz' : 'Test Your Knowledge'}
                </RobotoFont>
              </button>

              {/* ENHANCED Rewards Section with Remaining Coins and Badge Status */}
              <div>
                <RobotoFont as="h3" weight={600} className="text-sm mb-2">
                  Rewards
                </RobotoFont>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1.5 rounded-lg">
                    <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
                    <RobotoFont weight={500} className="text-xs">
                      {(() => {
                        // Calculate remaining coins that can be earned
                        const totalQuestions = 5; // Hard-coded as 5 questions in the sample quiz
                        const maxCoinsForLesson = totalQuestions * 5; // 5 coins per question = 25 total
                        const currentCorrectAnswers = currentLessonProgress?.quizScore || 0;
                        const coinsAlreadyEarned = currentCorrectAnswers * 5;
                        const remainingCoins = maxCoinsForLesson - coinsAlreadyEarned;
                        
                        return `+${remainingCoins} NestCoins`;
                      })()}
                    </RobotoFont>
                  </div>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 pt-1.5 rounded-lg">
                    {(() => {
                      const totalQuestions = 5;
                      const currentCorrectAnswers = currentLessonProgress?.quizScore || 0;
                      const hasEarnedBadge = currentCorrectAnswers === totalQuestions;
                      
                      return (
                        <img 
                          src={BadgeMedal} 
                          alt="Badge" 
                          className={`w-7 h-7 transition-all duration-300 ${
                            hasEarnedBadge ? 'opacity-100' : 'opacity-100 brightness-0'
                          }`}
                        />
                      );
                    })()}
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
                    onClick={handleBack}
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
                        onClick={() => handleVideoProgress(Math.min(100, watchProgress + 10))}
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
                {lesson.transcript && (
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
                            {lesson.transcript}
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
                      onClick={handleBack}
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