import React, { useState } from 'react';
import { useModules } from '../../hooks/useModules';
import { Lesson, Module } from '../../types/modules';
import FeedbackContainer from './FeedbackContainer';
import QuizResults from './QuizResults';
import RewardsModal from './RewardsModal';
import { QuestionImage } from '../../assets';

interface LessonQuizProps {
  lesson: Lesson;
  module: Module;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({
  lesson,
  isVisible,
  onClose,
  onComplete
}) => {
  // Add state for RewardsModal
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  // Add state to trigger coin vacuum animation
  const [triggerCoinVacuum, setTriggerCoinVacuum] = useState(false);

  // Redux state management - get all quiz state from Redux
  const {
    quizState,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    closeQuiz,
    completeQuiz
  } = useModules();

  // Keep your exact visual design but use Redux for state
  const handleAnswerSelect = (optionId: string) => {
    if (quizState.isTransitioning) return; // Only check Redux state
    selectAnswer(quizState.currentQuestion, optionId);
  };

  const handleNext = () => {
    if (quizState.isTransitioning || !quizState.selectedAnswer) return; // Only check Redux state
    
    if (quizState.currentQuestion === quizState.questions.length - 1) {
      // Calculate final score
      const correctAnswers = quizState.questions.reduce((acc, question, index) => {
        const userAnswer = quizState.answers[index];
        const correctOption = question.options.find(opt => opt.isCorrect);
        return acc + (userAnswer === correctOption?.id ? 1 : 0);
      }, 0);
      
      const finalScore = Math.round((correctAnswers / quizState.questions.length) * 100);
      
      // Complete quiz through Redux
      completeQuiz(lesson.id, finalScore);
      // Call parent callback
      onComplete(finalScore);
    } else {
      // Just call Redux action - it handles the transition
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    if (quizState.isTransitioning || quizState.currentQuestion === 0) return; // Only check Redux state
    
    // Just call Redux action - it handles the transition
    previousQuestion();
  };

  const handleFinish = () => {
    onComplete(quizState.score);
    onClose();
    closeQuiz();
  };

  const handleRetake = () => {
    resetQuiz();
  };

  // Modified handleClaimRewards to show the RewardsModal
  const handleClaimRewards = () => {
    console.log('Claiming rewards for score:', quizState.score);
    // Show the rewards modal instead of immediately finishing
    setShowRewardsModal(true);
  };

  // Handle when RewardsModal is closed - trigger coin vacuum animation
  const handleRewardsModalClose = () => {
    setShowRewardsModal(false);
    // Trigger the coin vacuum animation
    setTriggerCoinVacuum(true);
  };

  // Use Redux state instead of local state
  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  // Calculate correct answers for results
  const correctAnswers = quizState.questions.reduce((acc, question, index) => {
    const userAnswer = quizState.answers[index];
    const correctOption = question.options.find(opt => opt.isCorrect);
    return acc + (userAnswer === correctOption?.id ? 1 : 0);
  }, 0);

  // Question Component for reusability
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
          {/* Illustration - Made larger with rounded-xl and background */}
          <div className="mb-4 flex-shrink-0">
           <img src={QuestionImage} alt="Question Illustration" className="w-64 h-64 object-cover rounded-xl" />
          </div>

          {/* Question */}
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 leading-tight px-2">
              {questionData?.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-2 gap-2 w-full mb-4 flex-shrink-0">
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
                  className={`p-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed ${
                    isSelected ? 'ring-2 ring-white ring-opacity-50 scale-105' : ''
                  } ${!isCurrentQuestion ? 'opacity-75' : ''}`}
                >
                  <div className="text-xs text-center leading-tight">
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
    <>
      <div className={`fixed top-0 right-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'w-full' : 'w-0'
      } overflow-hidden`}>
        <div className="p-4 h-full flex flex-col relative">
          {/* Header - Updated to show Test Your Knowledge and question number, left-aligned */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <button
              onClick={() => {
                onClose();
                closeQuiz();
              }}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              disabled={quizState.isTransitioning} // Only check Redux state
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                  disabled={quizState.currentQuestion === 0 || quizState.isTransitioning} // Only check Redux state
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
                  disabled={!quizState.selectedAnswer || quizState.isTransitioning} // Only check Redux state
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {quizState.currentQuestion === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </>
          ) : (
            /* Use the separate QuizResults component instead of the inline results */
            <QuizResults
              score={quizState.score}
              totalQuestions={quizState.questions.length}
              correctAnswers={correctAnswers}
              onContinue={handleFinish}
              onRetake={handleRetake}
              onClaimRewards={handleClaimRewards}
              triggerCoinVacuum={triggerCoinVacuum}
              lessonTitle={lesson.title}
            />
          )}
        </div>
      </div>

      {/* RewardsModal - appears when quiz results trigger it */}
      <RewardsModal 
        isOpen={showRewardsModal}
        onClose={handleRewardsModalClose}
      />
    </>
  );
};

export default LessonQuiz;