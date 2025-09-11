import React from 'react';
import { useModules } from '../../hooks/useModules';
import { Lesson, Module } from '../../types/modules';

interface LessonQuizProps {
  lesson: Lesson;
  module: Module;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

const LessonQuiz: React.FC<LessonQuizProps> = ({
  lesson,
  module,
  isVisible,
  onClose,
  onComplete
}) => {
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

  // Use Redux state instead of local state
  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  // Question Component for reusability
  const QuestionCard: React.FC<{
    questionData: any;
    questionNumber: number;
    totalQuestions: number;
    selectedAnswer?: string | null;
    showFeedback?: boolean;
    isCurrentQuestion?: boolean;
  }> = ({ questionData, questionNumber, totalQuestions, selectedAnswer = null, showFeedback: cardShowFeedback = false, isCurrentQuestion = false }) => {
    
    const cardCorrectAnswer = questionData?.options.find((opt: any) => opt.isCorrect);

    return (
      <>
        {/* Quiz Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Test Your Knowledge</h1>
          <p className="text-xs text-gray-600">Question {questionNumber} out of {totalQuestions}</p>
        </div>

        {/* Question Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* Illustration */}
          <div className="mb-4 flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center relative">
              <div className="text-2xl">🤔</div>
              <div className="absolute -top-1 -left-1 text-blue-400 text-lg">❓</div>
              <div className="absolute -top-2 right-1 text-blue-300 text-sm">❓</div>
            </div>
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
              const isCorrect = option.isCorrect;
              const showResult = cardShowFeedback && isSelected;
              
              let buttonStyle = {
                backgroundColor: '#D7DEFF',
                color: '#3F6CB9'
              };
              
              if (showResult) {
                if (isCorrect) {
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

          {/* FIXED HEIGHT FEEDBACK CONTAINER - Always allocates space */}
          <div className="w-full max-w-sm mx-auto mb-4 flex-shrink-0 h-20 relative overflow-hidden">
            {/* Feedback Section - Slides in from bottom with fade */}
            <div 
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                cardShowFeedback && selectedAnswer 
                  ? 'transform translate-y-0 opacity-100' 
                  : 'transform translate-y-full opacity-0'
              }`}
            >
              <div className={`h-full p-3 rounded-lg border-2 flex items-center justify-center ${
                selectedAnswer === cardCorrectAnswer?.id 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="text-center">
                  <div className="text-xs font-medium mb-1">
                    {selectedAnswer === cardCorrectAnswer?.id ? 'Correct!' : 'Not quite right'}
                  </div>
                  <div className="text-xs leading-tight">
                    {selectedAnswer === cardCorrectAnswer?.id 
                      ? questionData?.explanation?.correct 
                      : (selectedAnswer && questionData?.explanation?.incorrect?.[selectedAnswer]?.why_wrong) || 'Please try again!'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={`fixed top-0 right-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${
      isVisible ? 'w-full' : 'w-0'
    } overflow-hidden`}>
      <div className="p-4 h-full flex flex-col relative">
        {/* Header */}
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
          <div className="text-center">
            <h1 className="text-sm font-semibold text-gray-900">Lesson Quiz</h1>
            <p className="text-xs text-gray-600">{module.title}</p>
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
                      questionNumber={quizState.currentQuestion + 1}
                      totalQuestions={quizState.questions.length}
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
          /* Results Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                quizState.score >= 80 ? 'bg-green-100' : quizState.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {quizState.score >= 80 ? '🎉' : quizState.score >= 60 ? '👍' : '📚'}
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {quizState.score >= 80 ? 'Excellent!' : quizState.score >= 60 ? 'Good Job!' : 'Keep Learning!'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-1">Your Score: {quizState.score}%</p>
            <p className="text-xs text-gray-600 mb-6">
              You got {Math.round((quizState.score / 100) * quizState.questions.length)} out of {quizState.questions.length} questions correct
            </p>

            <div className="space-y-3">
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue Learning
              </button>
              
              <button
                onClick={handleRetake}
                className="block px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;