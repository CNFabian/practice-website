// src/pages/protected/LessonQuiz.tsx
import React, { useState, useEffect } from 'react';
import { Module, Lesson } from '../../types/modules';
import { useModuleState } from '../../utils/ModuleStateContext';

interface LessonQuizProps {
  lesson: Lesson;
  module: Module;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  explanation: string;
  wrong_answers: {
    [key: string]: {
      why_wrong: string;
      confusion_reason: string;
    };
  };
}

// Sample quiz questions (keep your existing questions)
const sampleQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the most important factor in determining your home buying budget?",
    options: [
      { id: 'a', text: "The maximum loan amount the bank will approve", isCorrect: false },
      { id: 'b', text: "Your current monthly income and expenses", isCorrect: true },
      { id: 'c', text: "The average home price in your desired area", isCorrect: false },
      { id: 'd', text: "Current mortgage interest rates", isCorrect: false }
    ],
    explanation: "Your monthly income and expenses determine what you can comfortably afford, which is more important than what a bank might approve you for.",
    wrong_answers: {
      'a': {
        why_wrong: "Banks may approve you for more than you can comfortably afford.",
        confusion_reason: "Just because you're approved doesn't mean it's wise to borrow the maximum."
      },
      'c': {
        why_wrong: "Area prices don't determine your personal budget capacity.",
        confusion_reason: "You need to base decisions on your finances, not market prices."
      },
      'd': {
        why_wrong: "Interest rates affect costs but aren't the primary budget factor.",
        confusion_reason: "Rates impact affordability but your income/expenses are fundamental."
      }
    }
  },
  {
    id: 2,
    question: "Which credit score range is typically considered 'good' for mortgage applications?",
    options: [
      { id: 'a', text: "580-669", isCorrect: false },
      { id: 'b', text: "670-739", isCorrect: true },
      { id: 'c', text: "740-799", isCorrect: false },
      { id: 'd', text: "500-579", isCorrect: false }
    ],
    explanation: "A credit score between 670-739 is generally considered 'good' by most lenders, though higher scores get better rates.",
    wrong_answers: {
      'a': {
        why_wrong: "This range is typically considered 'fair' credit, not 'good'.",
        confusion_reason: "While you can get loans with fair credit, it's below the 'good' threshold."
      },
      'c': {
        why_wrong: "This is actually 'very good' to 'excellent' credit range.",
        confusion_reason: "This range is better than just 'good' - it's in the top tier."
      },
      'd': {
        why_wrong: "This range is considered 'poor' credit.",
        confusion_reason: "Scores below 580 make it very difficult to qualify for mortgages."
      }
    }
  },
  {
    id: 3,
    question: "What percentage of your gross monthly income should housing costs ideally not exceed?",
    options: [
      { id: 'a', text: "15-20%", isCorrect: false },
      { id: 'b', text: "25-28%", isCorrect: true },
      { id: 'c', text: "35-40%", isCorrect: false },
      { id: 'd', text: "45-50%", isCorrect: false }
    ],
    explanation: "The 28% rule suggests your housing expenses shouldn't exceed 28% of your gross monthly income for financial stability.",
    wrong_answers: {
      'a': {
        why_wrong: "While conservative, this may be unrealistic in many markets.",
        confusion_reason: "15-20% is very conservative and often impractical."
      },
      'c': {
        why_wrong: "This percentage leaves little room for other expenses and savings.",
        confusion_reason: "35-40% can make you 'house poor' with little budget flexibility."
      },
      'd': {
        why_wrong: "This is dangerously high and leaves no financial cushion.",
        confusion_reason: "Half your income on housing is financially risky."
      }
    }
  }
];

const LessonQuiz: React.FC<LessonQuizProps> = ({
  lesson,
  module,
  isVisible,
  onClose,
  onComplete
}) => {
  const { 
    state,
    setQuizAnswer,
    setCurrentQuizQuestion,
    resetQuizState,
    getQuizAnswers
  } = useModuleState();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use quiz state from context
  const currentQuestion = state.currentQuizQuestion;
  const answers = getQuizAnswers();

  // Reset quiz when it becomes visible
  useEffect(() => {
    if (isVisible) {
      resetQuizState();
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowResults(false);
      setScore(0);
    }
  }, [isVisible]);

  // Load saved answer for current question
  useEffect(() => {
    const savedAnswer = answers[currentQuestion];
    if (savedAnswer) {
      setSelectedAnswer(savedAnswer);
      setShowFeedback(true);
    } else {
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentQuestion, answers]);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
    setShowFeedback(true);
    setQuizAnswer(currentQuestion, optionId);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      if (currentQuestion < sampleQuestions.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentQuizQuestion(currentQuestion + 1);
          setIsTransitioning(false);
        }, 300);
      } else {
        // Calculate score and show results
        const correctAnswers = sampleQuestions.reduce((acc, question, index) => {
          const userAnswer = answers[index];
          const correctOption = question.options.find(opt => opt.isCorrect);
          return acc + (userAnswer === correctOption?.id ? 1 : 0);
        }, 0);
        
        const finalScore = Math.round((correctAnswers / sampleQuestions.length) * 100);
        setScore(finalScore);
        setShowResults(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuizQuestion(currentQuestion - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleRetakeQuiz = () => {
    resetQuizState();
    setSelectedAnswer(null);
    setShowFeedback(false);
    setShowResults(false);
    setScore(0);
  };

  const handleCompleteQuiz = () => {
    onComplete(score);
    onClose();
  };

  if (!isVisible) return null;

  const question = sampleQuestions[currentQuestion];
  const selectedOption = question.options.find(opt => opt.id === selectedAnswer);
  const isCorrectAnswer = selectedOption?.isCorrect || false;

  return (
    <div className="h-full w-full bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lesson Quiz</h2>
            <p className="text-sm text-gray-600 mt-1">{lesson.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestion + 1} of {sampleQuestions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / sampleQuestions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / sampleQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!showResults ? (
          <div className={`max-w-3xl mx-auto px-6 py-8 transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}>
            {/* Question */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {question.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const showCorrect = showFeedback && option.isCorrect;
                  const showWrong = showFeedback && isSelected && !option.isCorrect;

                  return (
                    <button
                      key={option.id}
                      onClick={() => !showFeedback && handleAnswerSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        showCorrect
                          ? 'border-green-500 bg-green-50'
                          : showWrong
                          ? 'border-red-500 bg-red-50'
                          : isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            showCorrect
                              ? 'border-green-500 bg-green-100'
                              : showWrong
                              ? 'border-red-500 bg-red-100'
                              : isSelected
                              ? 'border-purple-500 bg-purple-100'
                              : 'border-gray-300'
                          }`}>
                            <span className={`text-sm font-semibold ${
                              showCorrect ? 'text-green-700' : showWrong ? 'text-red-700' : isSelected ? 'text-purple-700' : 'text-gray-600'
                            }`}>
                              {option.id.toUpperCase()}
                            </span>
                          </div>
                          <span className={`text-base ${
                            showCorrect ? 'text-green-700 font-medium' : showWrong ? 'text-red-700' : 'text-gray-700'
                          }`}>
                            {option.text}
                          </span>
                        </div>
                        {showCorrect && (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {showWrong && (
                          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className={`mt-6 p-4 rounded-lg ${
                  isCorrectAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                    <div>
                      <h4 className={`font-semibold mb-1 ${
                        isCorrectAnswer ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {isCorrectAnswer ? 'Correct!' : 'Not quite right'}
                      </h4>
                      <p className={`text-sm ${
                        isCorrectAnswer ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {isCorrectAnswer 
                          ? question.explanation
                          : selectedAnswer && question.wrong_answers[selectedAnswer]?.why_wrong}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestion === sampleQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-600">{score}%</span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Learning!'}
              </h3>
              
              <p className="text-gray-600 mb-8">
                You got {sampleQuestions.filter((q, i) => answers[i] === q.options.find(o => o.isCorrect)?.id).length} out of {sampleQuestions.length} questions correct
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRetakeQuiz}
                  className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                >
                  Retake Quiz
                </button>
                <button
                  onClick={handleCompleteQuiz}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Complete Lesson
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonQuiz;