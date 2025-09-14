import React from 'react';
import { useModules } from '../../hooks/useModules';
import { Module } from '../../types/modules';
import { CoinIcon, QuestionImage, TestResultIcon } from '../../assets';
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

  // Get module progress
  const currentModuleProgress = moduleProgress[module.id];
  const progress = currentModuleProgress ? 
    { 
      completed: currentModuleProgress.lessonsCompleted, 
      total: currentModuleProgress.totalLessons, 
      percentage: currentModuleProgress.overallProgress 
    } : 
    { completed: 0, total: module.lessons.length, percentage: 0 };

  // Use Redux state
  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  // Calculate correct answers for results
  const correctAnswers = quizState.questions.reduce((acc, question, index) => {
    const userAnswer = quizState.answers[index];
    const correctOption = question.options.find(opt => opt.isCorrect);
    return acc + (userAnswer === correctOption?.id ? 1 : 0);
  }, 0);

  // Question Component
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
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* Illustration */}
          <div className="mb-6 relative">
            <img 
              src={QuestionImage} 
              alt="Question Illustration" 
              className="w-64 h-64 object-cover rounded-2xl p-3" 
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
                    isSelected ? 'ring-2 ring-blue-300' : ''
                  }`}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Section */}
        {cardShowFeedback && selectedAnswer && (
          <div className="mt-4 max-w-lg mx-auto w-full px-2">
            <FeedbackContainer
              isVisible={true}
              isCorrect={isCorrect}
              correctMessage={questionData.explanation?.correct || "Great job! That's the correct answer."}
              incorrectMessage={questionData.explanation?.incorrect?.[selectedAnswer]?.why_wrong || "Not quite right. Try again!"}
            />
          </div>
        )}
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
                  <span className="whitespace-nowrap">Back to Modules</span>
                </button>

                {/* Module Quiz Status */}
                <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-2 py-1 rounded-lg flex-shrink-0 min-w-0">
                  <img src={TestResultIcon} alt="Quiz Icon" className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs font-medium whitespace-nowrap">Module Quiz</span>
                </div>
              </div>

              {/* Module Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                    {module.title}
                  </h1>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">{module.lessonCount} lessons</span>
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' ? 
                              'bg-gray-100 text-gray-700' : 
                              'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Module Progress</span>
                    <span>{progress.completed}/{progress.total} lessons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        module.status === 'Completed' ? 'bg-green-500' : 
                        module.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">{progress.percentage}% complete</div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {/* Module Description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">About This Module</h3>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {module.description}
                  </div>
                  <p className="text-xs text-gray-600">
                    Test your knowledge of all concepts covered in this module to earn completion rewards!
                  </p>
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Lessons in This Module</h3>
                  <div className="space-y-2">
                    {module.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.duration}</p>
                        </div>
                        {lesson.completed && (
                          <div className="flex-shrink-0">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reward Information */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Quiz Rewards</h3>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={CoinIcon} alt="Coins" className="w-4 h-4" />
                      <span className="text-xs font-medium text-gray-900">Completion Bonus</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Earn bonus coins for completing the module quiz with a passing score!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0' : 'w-px bg-gray-200 mx-2'
        }`} />

        {/* Right Column - Quiz Content */}
        <div className={`transition-all duration-300 ease-in-out relative overflow-hidden ${
          sidebarCollapsed ? 'w-[80%] mx-auto' : 'w-[calc(70%-1rem)]'
        }`}>
          {/* Quiz Content */}
          <div className={`h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${
            sidebarCollapsed ? 'px-6' : 'px-4'
          }`}>
            {!quizState.showResults ? (
              <div className="space-y-6 pb-6 h-full">
                {/* Question Display */}
                <div
                  className={`h-full transition-all duration-300 ease-in-out ${
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
              </div>
            ) : (
              /* Use the separate QuizResults component for module quiz results */
              <div className="h-full flex items-center justify-center">
                <QuizResults
                  score={quizState.score}
                  totalQuestions={quizState.questions.length}
                  correctAnswers={correctAnswers}
                  onContinue={handleFinish}
                  onRetake={handleRetake}
                  onClaimRewards={handleClaimRewards}
                  lessonTitle={`${module.title} - Module Quiz`}
                  nextLesson={null} // No next lesson for module quiz
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleQuizView;