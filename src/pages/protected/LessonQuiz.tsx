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
    if (quizState.isTransitioning) return;
    selectAnswer(quizState.currentQuestion, optionId);
  };

  const handleNext = () => {
    if (quizState.isTransitioning || !quizState.selectedAnswer) return;
    
    // Always use nextQuestion to let the Redux reducer handle the logic
    // The reducer will set showResults: true when it's the last question
    nextQuestion();
  };

  const handlePrevious = () => {
    if (quizState.isTransitioning || quizState.currentQuestion === 0) return;
    previousQuestion();
  };

  const handleFinish = () => {
    // Now call completeQuiz from the results screen
    completeQuiz(lesson.id, quizState.score);
    onComplete(quizState.score);
    onClose();
    closeQuiz();
  };

  const handleRetake = () => {
    resetQuiz();
  };

  const getOptionColor = (optionId: string) => {
    const colors = {
      'a': 'bg-red-400 hover:bg-red-500',
      'b': 'bg-blue-400 hover:bg-blue-500', 
      'c': 'bg-green-400 hover:bg-green-500',
      'd': 'bg-purple-400 hover:bg-purple-500'
    };
    return colors[optionId as keyof typeof colors] || 'bg-gray-400 hover:bg-gray-500';
  };

  // Use Redux state instead of local state
  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const correctAnswer = currentQuestionData?.options.find(opt => opt.isCorrect);
  const isCorrectAnswer = quizState.selectedAnswer === correctAnswer?.id;
  const showFeedback = !!quizState.selectedAnswer;

  if (!isVisible || !quizState.isActive) return null;

  return (
    <div className={`absolute top-0 right-0 h-full bg-white transition-all duration-700 ease-in-out z-20 ${
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
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              {/* Current Question Container */}
              <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
                quizState.isTransitioning ? '-translate-x-full' : 'translate-x-0'
              }`}>
                {/* Quiz Header */}
                <div className="text-center mb-4 flex-shrink-0">
                  <h1 className="text-lg font-bold text-gray-900 mb-1">Test Your Knowledge</h1>
                  <p className="text-xs text-gray-600">Question {quizState.currentQuestion + 1} out of {quizState.questions.length}</p>
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
                      {currentQuestionData?.question}
                    </h2>
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-2 gap-2 w-full mb-4 flex-shrink-0">
                    {currentQuestionData?.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option.id)}
                        disabled={showFeedback}
                        className={`p-2 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed ${
                          quizState.selectedAnswer === option.id 
                            ? getOptionColor(option.id) + ' ring-2 ring-white ring-opacity-50 scale-105' 
                            : getOptionColor(option.id) + ' opacity-80'
                        }`}
                      >
                        <span className="text-xs leading-tight">{option.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Overlay */}
                <div className={`absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out transform ${
                  showFeedback && quizState.selectedAnswer
                    ? 'translate-y-0 opacity-100' 
                    : '-translate-y-full opacity-0'
                }`}>
                  <div className={`mx-4 mt-16 p-4 rounded-lg shadow-lg backdrop-blur-sm ${
                    isCorrectAnswer 
                      ? 'bg-green-50/95 border border-green-200' 
                      : 'bg-red-50/95 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCorrectAnswer ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrectAnswer ? (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <h3 className={`text-sm font-semibold ${
                        isCorrectAnswer ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
                      </h3>
                    </div>
                    
                    <div className={`text-xs ${
                      isCorrectAnswer ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {isCorrectAnswer ? (
                        <p>{currentQuestionData.explanation.correct}</p>
                      ) : (
                        quizState.selectedAnswer && (
                          <div className="space-y-2">
                            <p><strong>Why this is wrong:</strong> {currentQuestionData.explanation.incorrect[quizState.selectedAnswer]?.why_wrong}</p>
                            <p><strong>Why you might have chosen this:</strong> {currentQuestionData.explanation.incorrect[quizState.selectedAnswer]?.confusion_reason}</p>
                            <p><strong>Correct answer:</strong> {correctAnswer?.text} - {currentQuestionData.explanation.correct}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Question Container (slides in from right) */}
              {quizState.isTransitioning && quizState.currentQuestion < quizState.questions.length - 1 && (
                <div className="absolute top-0 left-0 right-0 bottom-16 flex flex-col translate-x-full transition-transform duration-300 ease-in-out">
                  {/* Quiz Header */}
                  <div className="text-center mb-4 flex-shrink-0">
                    <h1 className="text-lg font-bold text-gray-900 mb-1">Test Your Knowledge</h1>
                    <p className="text-xs text-gray-600">Question {quizState.currentQuestion + 2} out of {quizState.questions.length}</p>
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
                        {quizState.questions[quizState.currentQuestion + 1]?.question}
                      </h2>
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-2 gap-2 w-full mb-4 flex-shrink-0">
                      {quizState.questions[quizState.currentQuestion + 1]?.options.map((option) => (
                        <button
                          key={option.id}
                          disabled
                          className={`p-2 rounded-lg text-white font-medium ${getOptionColor(option.id)} opacity-80`}
                        >
                          <span className="text-xs leading-tight">{option.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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