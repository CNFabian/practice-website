import React from 'react';
import { useModules } from '../../hooks/useModules';
import { Module } from '../../types/modules';
import { CoinIcon, QuestionImage, TestResultIcon, BadgeMedal } from '../../assets';
import FeedbackContainer from './FeedbackContainer';
import QuizResults from './QuizResults';

interface ModuleQuizViewProps {
  module: Module;
  onBack: () => void;
  isTransitioning?: boolean;
}

const ModuleQuizView: React.FC<ModuleQuizViewProps> = ({
  module,
  onBack,
  isTransitioning = false
}) => {
  // Redux state management
  const {
    quizState,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    closeQuiz,
    completeModuleQuiz,
    sidebarCollapsed,
    toggleSidebar,
    moduleProgress
  } = useModules();

  const handleAnswerSelect = (optionId: string) => {
    if (quizState.isTransitioning) return;
    selectAnswer(quizState.currentQuestion, optionId);
  };

  const handleNext = () => {
    if (quizState.isTransitioning || !quizState.selectedAnswer) return;
    nextQuestion();
  };

  const handlePrevious = () => {
    if (quizState.isTransitioning || quizState.currentQuestion === 0) return;
    previousQuestion();
  };

  const handleFinish = () => {
    completeModuleQuiz(module.id, quizState.score, true);
    closeQuiz();
    onBack();
  };

  const handleRetake = () => {
    resetQuiz();
  };

  const handleClaimRewards = () => {
    console.log('Claiming module completion rewards for score:', quizState.score);
    handleFinish();
  };

  const handleBack = () => {
    if (isTransitioning) return;
    closeQuiz();
    onBack();
  };

  const toggleModuleInfo = () => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  };

  // Use Redux state
  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  // Get module progress from Redux
  const currentModuleProgress = moduleProgress[module.id];
  const isCompleted = currentModuleProgress?.overallProgress === 100 || false;
  const moduleQuizCompleted = currentModuleProgress?.moduleQuizCompleted || false;
  const moduleQuizScore = currentModuleProgress?.moduleQuizScore || 0;

  // Calculate correct answers for results
  const correctAnswers = quizState.questions.reduce((acc, question, index) => {
  const userAnswer = quizState.answers[index];
  const correctOption = question.options.find(opt => opt.isCorrect);
  return acc + (userAnswer === correctOption?.id ? 1 : 0);
}, 0);

  // Question Component - EXACT COPY from LessonQuiz
  const QuestionCard: React.FC<{
    questionData: any;
    selectedAnswer?: string | null;
    showFeedback?: boolean;
    isCurrentQuestion?: boolean;
  }> = ({ questionData, selectedAnswer = null, showFeedback: cardShowFeedback = false, isCurrentQuestion = false }) => {
    
    const cardCorrectAnswer = questionData?.options.find((opt: any) => opt.isCorrect);
    const isCorrect = selectedAnswer === cardCorrectAnswer?.id;

    return (
      <>
        {/* Question Content - Removed "Test Your Knowledge" header from here */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* Illustration - Improved styling */}
          <div className="mb-6 relative">
            <img 
              src={QuestionImage} 
              alt="Question Illustration" 
              className="w-48 h-48 object-cover rounded-2xl p-3" 
            />
          </div>

          {/* Question */}
          <div className="text-center mb-6 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 leading-tight px-2">
              {questionData?.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-3 w-full mb-4 flex-shrink-0">
            {questionData?.options.map((option: any) => {
              const isSelected = isCurrentQuestion && selectedAnswer === option.id;
              const isOptionCorrect = option.isCorrect;
              const showResult = cardShowFeedback && isSelected;
              
              let buttonStyle = {
                backgroundColor: '#D7DEFF',
                color: '#3F6CB9'
              };
              
              if (showResult) {
                if (isOptionCorrect) {
                  buttonStyle = {
                    backgroundColor: '#4BD48B',
                    color: '#FFFFFF'
                  };
                } else {
                  buttonStyle = {
                    backgroundColor: '#F1746D',
                    color: '#FFFFFF'
                  };
                }
              } else if (isSelected) {
                buttonStyle = {
                  backgroundColor: '#ECFFF5',
                  color: '#3F6CB9'
                };
              }
              
              return (
                <button
                  key={option.id}
                  onClick={() => isCurrentQuestion && handleAnswerSelect(option.id)}
                  disabled={!isCurrentQuestion || cardShowFeedback || quizState.isTransitioning}
                  style={buttonStyle}
                  className={`p-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed shadow-sm ${
                    isSelected ? 'ring-2 ring-white ring-opacity-50 scale-105' : ''
                  } ${!isCurrentQuestion ? 'opacity-75' : ''}`}
                >
                  <div className="text-sm text-center leading-tight">
                    {option.text}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Use the separate FeedbackContainer component */}
          <FeedbackContainer
            isVisible={cardShowFeedback && !!selectedAnswer}
            isCorrect={isCorrect}
            correctMessage={questionData?.explanation?.correct || ''}
            incorrectMessage={(selectedAnswer && questionData?.explanation?.incorrect?.[selectedAnswer]?.why_wrong) || 'Please try again!'}
          />
        </div>
      </>
    );
  };

  return (
    <div className="pt-6 w-full h-full">
      <div className="flex h-full w-full">
        {/* Arrow Toggle */}
        <button
          onClick={toggleModuleInfo}
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

        {/* Left Column - Module Info */}
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
                  <span className="whitespace-nowrap">Back to Module Library</span>
                </button>

                {/* Module Quiz Status - ADDED LIKE IN LESSONVIEW */}
                {moduleQuizCompleted && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0 min-w-0">
                    <img src={TestResultIcon} alt="Test Result Icon" className="w-5 h-5 flex-shrink-0" color="currentColor"/>
                    <span className="text-xs font-medium whitespace-nowrap">Module Quiz Completed</span>
                    {moduleQuizScore && (
                      <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        {/* Convert number of correct answers to percentage */}
                        {Math.round((moduleQuizScore / quizState.questions.length) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Module Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {module.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' 
                              ? 'bg-blue-100 text-blue-700' 
                              : tag === 'Finance'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-600">{module.lessonCount} lessons</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg w-full transition-all duration-700 ease-in-out overflow-hidden"
                style={{ 
                  height: 'min(calc(100vh - 550px), 300px)',
                  minHeight: '120px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img src={module.image} alt={module.title} className="object-contain w-full h-full" />

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
              <div className="text-xs text-gray-600">
                <p>In this module, you'll learn about the precursor steps to prepare for home ownership.</p>
              </div>

              <div className="text-xs text-gray-600">
                <p>Complete the Module quiz to get your rewards. Test your skills against another player to win more.</p>
              </div>

              {/* ENHANCED Rewards Section with Remaining Coins and Badge Status - UPDATED TO MATCH LESSONVIEW LOGIC */}
              <div className="space-y-3 pb-4">
                <h3 className="text-sm font-medium text-gray-900">Rewards</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg flex-1">
                    <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
                    <span className="text-xs font-medium text-gray-900">
                      {(() => {
                        // Calculate remaining coins that can be earned
                        const totalQuestions = quizState.questions.length; // Use actual quiz length
                        const maxCoinsForModule = totalQuestions * 10; // 10 coins per question for module quiz
                        const currentCorrectAnswers = moduleQuizScore || 0;
                        const coinsAlreadyEarned = currentCorrectAnswers * 10;
                        const remainingCoins = maxCoinsForModule - coinsAlreadyEarned;
                        
                        return `+${remainingCoins} NestCoins`;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg flex-1">
                    {(() => {
                      const totalQuestions = quizState.questions.length;
                      const currentCorrectAnswers = moduleQuizScore || 0;
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
                    <span className="text-xs font-medium text-gray-900">Module Badge</span>
                  </div>
                </div>
              </div>

              {/* Get More Rewards Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Get More Rewards</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Earn Coins, Challenge players, make the leaderboard.</p>
                  <p>Battle against each other for more rewards.</p>
                </div>
                <button
                  onClick={() => console.log('Quiz Battle clicked')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Quiz Battle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0' : 'w-px bg-gray-200 mx-2'
        }`} />

        {/* Right Column - Quiz Content - FIXED HEIGHT STRUCTURE */}
        <div className={`transition-all duration-300 ease-in-out relative overflow-hidden ${
          sidebarCollapsed ? 'w-[80%] mx-auto' : 'w-[calc(70%-1rem)]'
        }`}>
          <div className="p-4 h-full flex flex-col relative">
            {/* Header - Updated to show Test Your Knowledge and question number, left-aligned */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="text-left flex-1 ml-4">
                <h1 className="text-sm font-semibold text-gray-900">Test Your Knowledge</h1>
                <p className="text-xs text-gray-600">Question {quizState.currentQuestion + 1} out of {quizState.questions.length}</p>
              </div>
              <div className="w-6"></div>
            </div>

            {!quizState.showResults ? (
              <>
                {/* SIMPLIFIED SINGLE QUESTION CONTAINER WITH FADE TRANSITION */}
                <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                  <div className="relative h-full w-full overflow-hidden">
                    
                    {/* Single question container with fade transition */}
                    <div
                      className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
                        quizState.isTransitioning
                          ? 'opacity-0 transform scale-95'
                          : 'opacity-100 transform scale-100'
                      }`}
                      style={{ 
                        pointerEvents: quizState.isTransitioning ? 'none' : 'auto'
                      }}
                    >
                      <div className="h-full flex flex-col relative">
                        <QuestionCard
                          questionData={currentQuestionData}
                          selectedAnswer={quizState.selectedAnswer}
                          showFeedback={showFeedback}
                          isCurrentQuestion={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center flex-shrink-0 mt-2">
                  <button
                    onClick={handlePrevious}
                    disabled={quizState.currentQuestion === 0 || quizState.isTransitioning}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex gap-1">
                    {quizState.questions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === quizState.currentQuestion 
                            ? 'bg-blue-600' 
                            : index < quizState.currentQuestion 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!quizState.selectedAnswer || quizState.isTransitioning}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {quizState.currentQuestion === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                  </button>
                </div>
              </>
            ) : (
              /* Use the separate QuizResults component with updated handler */
              <QuizResults
              score={quizState.score}
              totalQuestions={quizState.questions.length}
              correctAnswers={correctAnswers}
              onContinue={handleFinish}
              onRetake={handleRetake}
              onClaimRewards={handleClaimRewards}
              lessonTitle={`${module.title} - Module Quiz`}
              nextLesson={null}
            />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleQuizView;