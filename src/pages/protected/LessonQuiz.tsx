import React, { useEffect, useState } from 'react';
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

  // Local state for managing transitions - EXACTLY like module/lesson transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousQuestionData, setPreviousQuestionData] = useState<any>(null);
  const [previousQuestionNumber, setPreviousQuestionNumber] = useState<number>(0);
  const [previousSelectedAnswer, setPreviousSelectedAnswer] = useState<string | null>(null);

  // Keep your exact visual design but use Redux for state
  const handleAnswerSelect = (optionId: string) => {
    if (quizState.isTransitioning || isTransitioning) return;
    selectAnswer(quizState.currentQuestion, optionId);
  };

  const handleNext = () => {
    if (quizState.isTransitioning || !quizState.selectedAnswer || isTransitioning) return;
    
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
      // Store current question data before transition
      setPreviousQuestionData(quizState.questions[quizState.currentQuestion]);
      setPreviousQuestionNumber(quizState.currentQuestion + 1);
      setPreviousSelectedAnswer(quizState.selectedAnswer);
      
      // Start transition
      setIsTransitioning(true);
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    if (quizState.isTransitioning || quizState.currentQuestion === 0 || isTransitioning) return;
    
    // Store current question data before transition
    setPreviousQuestionData(quizState.questions[quizState.currentQuestion]);
    setPreviousQuestionNumber(quizState.currentQuestion + 1);
    setPreviousSelectedAnswer(quizState.selectedAnswer);
    
    // Start transition
    setIsTransitioning(true);
    previousQuestion();
  };

  // Handle transition completion - EXACTLY like module/lesson
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousQuestionData(null);
        setPreviousQuestionNumber(0);
        setPreviousSelectedAnswer(null);
      }, 500); // Same duration as module/lesson transitions
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handleFinish = () => {
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
    const cardIsCorrectAnswer = selectedAnswer === cardCorrectAnswer?.id;

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
            {questionData?.options.map((option: any) => (
              <button
                key={option.id}
                onClick={() => isCurrentQuestion && handleAnswerSelect(option.id)}
                disabled={!isCurrentQuestion || cardShowFeedback || isTransitioning}
                className={`p-2 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed ${
                  isCurrentQuestion && selectedAnswer === option.id 
                    ? getOptionColor(option.id) + ' ring-2 ring-white ring-opacity-50 scale-105' 
                    : getOptionColor(option.id) + (!isCurrentQuestion ? ' opacity-60' : ' opacity-80')
                }`}
              >
                <span className="text-xs leading-tight">{option.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Overlay */}
        {isCurrentQuestion && (
          <div className={`absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out transform ${
            cardShowFeedback && selectedAnswer && !isTransitioning
              ? 'translate-y-0 opacity-100'
              : '-translate-y-full opacity-0'
          }`}>
            <div className={`p-4 mx-4 rounded-lg shadow-lg ${
              cardIsCorrectAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  cardIsCorrectAnswer ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <span className="text-xs text-white">
                    {cardIsCorrectAnswer ? '✓' : '✗'}
                  </span>
                </div>
                <h3 className={`text-sm font-semibold ${
                  cardIsCorrectAnswer ? 'text-green-800' : 'text-red-800'
                }`}>
                  {cardIsCorrectAnswer ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              
              <div className={`text-xs ${
                cardIsCorrectAnswer ? 'text-green-700' : 'text-red-700'
              }`}>
                {cardIsCorrectAnswer ? (
                  <p>{questionData.explanation.correct}</p>
                ) : (
                  selectedAnswer && (
                    <div className="space-y-2">
                      <p><strong>Why this is wrong:</strong> {questionData.explanation.incorrect[selectedAnswer]?.why_wrong}</p>
                      <p><strong>Why you might have chosen this:</strong> {questionData.explanation.incorrect[selectedAnswer]?.confusion_reason}</p>
                      <p><strong>Correct answer:</strong> {cardCorrectAnswer?.text} - {questionData.explanation.correct}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

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
            disabled={isTransitioning}
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
              <div className="relative h-full w-full overflow-hidden">
                
                {/* PREVIOUS QUESTION VIEW - Shows during transition out */}
                <div
                  className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
                    isTransitioning
                      ? '-translate-x-full opacity-0'
                      : 'translate-x-0 opacity-100'
                  }`}
                  style={{ 
                    pointerEvents: isTransitioning ? 'none' : 'auto'
                  }}
                >
                  {isTransitioning && previousQuestionData ? (
                    <div className="h-full flex flex-col relative">
                      <QuestionCard
                        questionData={previousQuestionData}
                        questionNumber={previousQuestionNumber}
                        totalQuestions={quizState.questions.length}
                        selectedAnswer={previousSelectedAnswer}
                        showFeedback={false}
                        isCurrentQuestion={false}
                      />
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* CURRENT QUESTION VIEW - Shows during transition in */}
                <div
                  className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
                    isTransitioning
                      ? 'translate-x-0 opacity-100'
                      : 'translate-x-full opacity-0'
                  }`}
                  style={{ 
                    pointerEvents: isTransitioning ? 'auto' : 'none'
                  }}
                >
                  {isTransitioning && (
                    <div className="h-full flex flex-col relative">
                      <QuestionCard
                        questionData={currentQuestionData}
                        questionNumber={quizState.currentQuestion + 1}
                        totalQuestions={quizState.questions.length}
                        selectedAnswer={quizState.selectedAnswer}
                        showFeedback={false}
                        isCurrentQuestion={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center flex-shrink-0 mt-2">
              <button
                onClick={handlePrevious}
                disabled={quizState.currentQuestion === 0 || quizState.isTransitioning || isTransitioning}
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
                disabled={!quizState.selectedAnswer || quizState.isTransitioning || isTransitioning}
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