import React, { useState, useEffect } from 'react';
import { useModules } from '../../../hooks/useModules';
import { useSubmitQuiz } from '../../../hooks/mutations/useSubmitQuiz';
import { Lesson, Module } from '../../../types/modules.backup';
import { QuestionImage } from '../../../assets';
import FeedbackContainer from './FeedbackContainer';
import QuizResults from './QuizResults';

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
  const {
    quizState,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    closeQuiz,
    completeQuiz,
    goToLesson,
  } = useModules();

  // Add submission tracking
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [startTime] = useState(Date.now());

  // Use backend UUIDs for the mutation - Fix: use isPending instead of isLoading
  const { mutate: submitQuizMutation, isPending: isSubmitting } = useSubmitQuiz(
    lesson.backendId || '', // Use backend UUID
    module.backendId || ''  // Use backend UUID
  );

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

  // Add function to handle quiz completion and submission
  const handleQuizCompletion = async () => {
    if (!quizSubmitted && quizState.showResults && lesson.backendId) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      
      // Format answers for backend API
      const formattedAnswers = quizState.questions.map((question, index) => {
        const userAnswer = quizState.answers[index];
        return {
          [question.id.toString()]: userAnswer || ''
        };
      });

      console.log('🚀 Submitting quiz with backend UUID:', lesson.backendId);
      console.log('📝 Formatted answers:', formattedAnswers);

      // Submit to backend
      submitQuizMutation({
        lesson_id: lesson.backendId, // Use backend UUID
        answers: formattedAnswers,
        time_taken_seconds: timeTaken
      }, {
        onSuccess: (data) => {
          console.log('✅ Quiz submission successful:', data);
          setSubmissionResult(data);
          setQuizSubmitted(true);
        },
        onError: (error) => {
          console.error('❌ Quiz submission failed:', error);
          // Still mark as submitted to prevent retry loops
          setQuizSubmitted(true);
        }
      });
    } else if (!lesson.backendId) {
      console.warn('⚠️ Cannot submit quiz: lesson.backendId is missing');
    }
  };

  // Trigger submission when quiz shows results
  useEffect(() => {
    if (quizState.showResults && !quizSubmitted) {
      handleQuizCompletion();
    }
  }, [quizState.showResults, quizSubmitted]);

  const handleNextLesson = () => {
    const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
    const nextLesson = currentLessonIndex < module.lessons.length - 1 
      ? module.lessons[currentLessonIndex + 1] 
      : null;

    if (nextLesson) {
    
      // Navigate to next lesson
      goToLesson(nextLesson.id, module.id);
      
      // Complete the quiz and close it
      completeQuiz(lesson.id, quizState.score);
      onComplete(quizState.score);
      closeQuiz();
    } else {
      // No next lesson, just finish normally
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeQuiz(lesson.id, quizState.score);
    onComplete(quizState.score);
    closeQuiz();
  };

  const handleRetake = () => {
    setQuizSubmitted(false);
    setSubmissionResult(null);
    resetQuiz();
  };

  const handleClaimRewards = () => {
    console.log('Claiming rewards for score:', quizState.score);
    if (submissionResult?.coins_earned) {
      console.log('Coins earned:', submissionResult.coins_earned);
    }
    if (submissionResult?.badges_earned?.length > 0) {
      console.log('Badges earned:', submissionResult.badges_earned);
    }
    handleFinish();
  };

  const handleCloseQuiz = () => {
    if (quizState.showResults) {
      onClose();
      closeQuiz();
    } else {
      onClose();
      closeQuiz();
    }
  };

  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  const correctAnswers = quizState.questions.reduce((acc, question, index) => {
    const userAnswer = quizState.answers[index];
    const correctOption = question.options.find(opt => opt.isCorrect);
    return acc + (userAnswer === correctOption?.id ? 1 : 0);
  }, 0);

  const currentLessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
  const nextLesson = currentLessonIndex < module.lessons.length - 1 
    ? module.lessons[currentLessonIndex + 1] 
    : null;

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
        {/* Question Content */}
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
    <div className={`fixed top-0 right-0 h-full shadow-lg z-50 transition-all duration-300 ease-in-out ${
      isVisible ? 'w-full' : 'w-0'
    } overflow-hidden`}>
      <div className="p-4 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={handleCloseQuiz}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            disabled={quizState.isTransitioning}
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
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              <div className="relative h-full w-full overflow-hidden">
                
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
          <QuizResults
            score={quizState.score}
            totalQuestions={quizState.questions.length}
            correctAnswers={correctAnswers}
            onContinue={nextLesson ? handleNextLesson : handleFinish}
            onRetake={handleRetake}
            onClaimRewards={handleClaimRewards}
            lessonTitle={lesson.title}
            nextLesson={nextLesson}
          />
        )}

        {/* Show submission status if needed */}
        {isSubmitting && (
          <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-center">Submitting quiz...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;