import React, { useState } from 'react';
import { Lesson, Module } from '../../types/modules';

interface QuizQuestion {
  id: number;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface LessonQuizProps {
  lesson: Lesson;
  module: Module;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

// Sample quiz data - in a real app this would come from props or API
const sampleQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the first step in preparing for homeownership?",
    options: [
      { id: 'a', text: 'Looking at houses online', isCorrect: false },
      { id: 'b', text: 'Assessing your financial readiness', isCorrect: true },
      { id: 'c', text: 'Talking to a real estate agent', isCorrect: false },
      { id: 'd', text: 'Getting pre-approved for a mortgage', isCorrect: false }
    ]
  },
  {
    id: 2,
    question: "Which of these is typically NOT considered a benefit of homeownership?",
    options: [
      { id: 'a', text: 'Building equity over time', isCorrect: false },
      { id: 'b', text: 'Complete flexibility to move anytime', isCorrect: true },
      { id: 'c', text: 'Tax deductions on mortgage interest', isCorrect: false },
      { id: 'd', text: 'Potential property value appreciation', isCorrect: false }
    ]
  },
  {
    id: 3,
    question: "What does a credit score primarily reflect?",
    options: [
      { id: 'a', text: 'Your income level', isCorrect: false },
      { id: 'b', text: 'Your creditworthiness and payment history', isCorrect: true },
      { id: 'c', text: 'Your savings account balance', isCorrect: false },
      { id: 'd', text: 'Your employment status', isCorrect: false }
    ]
  },
  {
    id: 4,
    question: "What is the recommended debt-to-income ratio for mortgage approval?",
    options: [
      { id: 'a', text: '50% or lower', isCorrect: false },
      { id: 'b', text: '43% or lower', isCorrect: true },
      { id: 'c', text: '60% or lower', isCorrect: false },
      { id: 'd', text: '35% or lower', isCorrect: false }
    ]
  },
  {
    id: 5,
    question: "Which factor is most important when determining how much house you can afford?",
    options: [
      { id: 'a', text: 'The house you want most', isCorrect: false },
      { id: 'b', text: 'What the bank will lend you', isCorrect: false },
      { id: 'c', text: 'Your monthly budget and expenses', isCorrect: true },
      { id: 'd', text: 'Current interest rates', isCorrect: false }
    ]
  }
];

const LessonQuiz: React.FC<LessonQuizProps> = ({
  lesson,
  module,
  isVisible,
  onClose,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      
      if (currentQuestion < sampleQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(answers[currentQuestion + 1] || null);
      } else {
        // Calculate score and show results
        const correctAnswers = sampleQuestions.reduce((acc, question, index) => {
          const userAnswer = newAnswers[index];
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
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
    }
  };

  const handleFinish = () => {
    onComplete(score);
    onClose();
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

  const currentQuestionData = sampleQuestions[currentQuestion];

  if (!isVisible) return null;

  return (
    <div className={`absolute top-0 right-0 h-full bg-white transition-all duration-700 ease-in-out z-20 ${
      isVisible ? 'w-full opacity-100 translate-x-0' : 'w-full opacity-0 translate-x-full'
    }`}>
      <div className="h-full flex flex-col p-3 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors text-xs"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lesson
          </button>
          
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showResults ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quiz Header */}
            <div className="text-center mb-4 flex-shrink-0">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Test Your Knowledge</h1>
              <p className="text-xs text-gray-600">Question {currentQuestion + 1} out of {sampleQuestions.length}</p>
            </div>

            {/* Question Content */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
              {/* Illustration */}
              <div className="mb-4 flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center relative">
                  {/* Person thinking with question marks */}
                  <div className="text-2xl">🤔</div>
                  <div className="absolute -top-1 -left-1 text-blue-400 text-lg">❓</div>
                  <div className="absolute -top-2 right-1 text-blue-300 text-sm">❓</div>
                </div>
              </div>

              {/* Question */}
              <div className="text-center mb-4 flex-shrink-0">
                <h2 className="text-sm font-semibold text-gray-900 mb-3 leading-tight px-2">
                  {currentQuestionData.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-2 w-full mb-4 flex-shrink-0">
                {currentQuestionData.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    className={`p-2 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedAnswer === option.id 
                        ? getOptionColor(option.id) + ' ring-2 ring-white ring-opacity-50 scale-105' 
                        : getOptionColor(option.id) + ' opacity-80'
                    }`}
                  >
                    <span className="text-xs leading-tight">{option.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center flex-shrink-0 mt-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {sampleQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      index === currentQuestion 
                        ? 'bg-blue-600' 
                        : index < currentQuestion 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentQuestion === sampleQuestions.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        ) : (
          /* Results Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚'}
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Learning!'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-1">Your Score: {score}%</p>
            <p className="text-xs text-gray-600 mb-6">
              You got {Math.round((score / 100) * sampleQuestions.length)} out of {sampleQuestions.length} questions correct
            </p>

            <div className="space-y-3">
              <button
                onClick={handleFinish}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue Learning
              </button>
              
              <button
                onClick={() => {
                  setCurrentQuestion(0);
                  setSelectedAnswer(null);
                  setAnswers({});
                  setShowResults(false);
                  setScore(0);
                }}
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