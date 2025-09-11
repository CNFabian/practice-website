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
  explanation: {
    correct: string;
    incorrect: {
      [key: string]: {
        why_wrong: string;
        confusion_reason: string;
      };
    };
  };
}

interface LessonQuizProps {
  lesson: Lesson;
  module: Module;
  isVisible: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

// Sample quiz data with explanations
const sampleQuestions: QuizQuestion[] = [
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
        'a': {
          why_wrong: "Looking at houses online is premature without knowing your budget first.",
          confusion_reason: "Many people get excited about house hunting, but this can lead to disappointment if you're looking at unaffordable homes."
        },
        'c': {
          why_wrong: "Talking to a real estate agent should come after you know your financial limits.",
          confusion_reason: "While agents are helpful, they can't help you effectively without knowing your budget constraints."
        },
        'd': {
          why_wrong: "Pre-approval comes after you've assessed what you can afford.",
          confusion_reason: "Pre-approval is important, but you need to know your own financial situation first before involving lenders."
        }
      }
    }
  },
  {
    id: 2,
    question: "Which of these is typically NOT considered a benefit of homeownership?",
    options: [
      { id: 'a', text: 'Building equity over time', isCorrect: false },
      { id: 'b', text: 'Complete flexibility to move anytime', isCorrect: true },
      { id: 'c', text: 'Tax deductions on mortgage interest', isCorrect: false },
      { id: 'd', text: 'Potential property value appreciation', isCorrect: false }
    ],
    explanation: {
      correct: "Homeownership actually reduces flexibility to move since selling a home takes time and involves transaction costs.",
      incorrect: {
        'a': {
          why_wrong: "Building equity is indeed a major benefit of homeownership.",
          confusion_reason: "You might have thought this wasn't a benefit, but equity building is one of the primary financial advantages."
        },
        'c': {
          why_wrong: "Mortgage interest deductions are a legitimate tax benefit for homeowners.",
          confusion_reason: "Tax benefits are often overlooked, but they're real advantages of homeownership."
        },
        'd': {
          why_wrong: "Property appreciation is a potential benefit, though not guaranteed.",
          confusion_reason: "While not guaranteed, property appreciation has historically been a benefit for many homeowners."
        }
      }
    }
  },
  {
    id: 3,
    question: "What does a credit score primarily reflect?",
    options: [
      { id: 'a', text: 'Your income level', isCorrect: false },
      { id: 'b', text: 'Your creditworthiness and payment history', isCorrect: true },
      { id: 'c', text: 'Your savings account balance', isCorrect: false },
      { id: 'd', text: 'Your employment status', isCorrect: false }
    ],
    explanation: {
      correct: "Credit scores are calculated based on your payment history, credit utilization, length of credit history, and types of credit accounts.",
      incorrect: {
        'a': {
          why_wrong: "Income is not directly factored into credit score calculations.",
          confusion_reason: "Many people think higher income means better credit, but credit scores focus on how you manage borrowed money."
        },
        'c': {
          why_wrong: "Savings account balances don't affect your credit score.",
          confusion_reason: "While savings are important for financial health, credit scores only track borrowed money management."
        },
        'd': {
          why_wrong: "Employment status isn't a direct factor in credit scoring.",
          confusion_reason: "Employment matters for loan approval but doesn't directly impact your credit score calculation."
        }
      }
    }
  },
  {
    id: 4,
    question: "What is the recommended debt-to-income ratio for mortgage approval?",
    options: [
      { id: 'a', text: '50% or lower', isCorrect: false },
      { id: 'b', text: '43% or lower', isCorrect: true },
      { id: 'c', text: '60% or lower', isCorrect: false },
      { id: 'd', text: '35% or lower', isCorrect: false }
    ],
    explanation: {
      correct: "The 43% debt-to-income ratio is the qualified mortgage (QM) standard set by the Consumer Financial Protection Bureau.",
      incorrect: {
        'a': {
          why_wrong: "50% is too high for most mortgage approvals.",
          confusion_reason: "This might seem reasonable, but lenders prefer lower ratios to ensure borrowers can handle payments."
        },
        'c': {
          why_wrong: "60% is far too high and would likely result in loan denial.",
          confusion_reason: "This ratio would indicate severe over-leveraging and payment difficulties."
        },
        'd': {
          why_wrong: "While 35% is conservative and good, 43% is the official threshold.",
          confusion_reason: "You're thinking conservatively, which is smart, but the official guideline is slightly higher."
        }
      }
    }
  },
  {
    id: 5,
    question: "Which factor is most important when determining how much house you can afford?",
    options: [
      { id: 'a', text: 'The house you want most', isCorrect: false },
      { id: 'b', text: 'What the bank will lend you', isCorrect: false },
      { id: 'c', text: 'Your monthly budget and expenses', isCorrect: true },
      { id: 'd', text: 'Current interest rates', isCorrect: false }
    ],
    explanation: {
      correct: "Your monthly budget determines what you can actually afford to pay without compromising your other financial goals and needs.",
      incorrect: {
        'a': {
          why_wrong: "Wanting a house doesn't mean you can afford it financially.",
          confusion_reason: "Emotional desires should be balanced with financial reality to avoid overextending yourself."
        },
        'b': {
          why_wrong: "Banks may approve you for more than you can comfortably afford.",
          confusion_reason: "Banks focus on minimum qualification requirements, not your overall financial well-being."
        },
        'd': {
          why_wrong: "Interest rates affect costs but aren't the primary factor in affordability.",
          confusion_reason: "While rates matter, your underlying budget capacity is more fundamental to affordability."
        }
      }
    }
  }
];

const LessonQuiz: React.FC<LessonQuizProps> = ({
  module,
  isVisible,
  onClose,
  onComplete
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAnswerSelect = (optionId: string) => {
    setSelectedAnswer(optionId);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      const newAnswers = { ...answers, [currentQuestion]: selectedAnswer };
      setAnswers(newAnswers);
      
      if (currentQuestion < sampleQuestions.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer(answers[currentQuestion + 1] || null);
          setShowFeedback(false);
          setIsTransitioning(false);
        }, 300);
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
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setSelectedAnswer(answers[currentQuestion - 1] || null);
        setShowFeedback(!!answers[currentQuestion - 1]);
        setIsTransitioning(false);
      }, 300);
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
  const correctAnswer = currentQuestionData.options.find(opt => opt.isCorrect);
  const isCorrectAnswer = selectedAnswer === correctAnswer?.id;

  if (!isVisible) return null;

  return (
    <div className={`absolute top-0 right-0 h-full bg-white transition-all duration-700 ease-in-out z-20 ${
      isVisible ? 'w-full' : 'w-0'
    } overflow-hidden`}>
      <div className="p-4 h-full flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <button
            onClick={onClose}
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

        {!showResults ? (
          <>
            <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
              {/* Current Question Container */}
              <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
                isTransitioning ? '-translate-x-full' : 'translate-x-0'
              }`}>
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
                        disabled={showFeedback}
                        className={`p-2 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed ${
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

                {/* Feedback Overlay - Positioned absolutely to drop down from top */}
                <div className={`absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out transform ${
                  showFeedback && selectedAnswer
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
                        selectedAnswer && (
                          <div className="space-y-2">
                            <p><strong>Why this is wrong:</strong> {currentQuestionData.explanation.incorrect[selectedAnswer]?.why_wrong}</p>
                            <p><strong>Why you might have chosen this:</strong> {currentQuestionData.explanation.incorrect[selectedAnswer]?.confusion_reason}</p>
                            <p><strong>Correct answer:</strong> {correctAnswer?.text} - {currentQuestionData.explanation.correct}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Question Container (slides in from right) */}
              {isTransitioning && currentQuestion < sampleQuestions.length - 1 && (
                <div className="absolute top-0 left-0 right-0 bottom-16 flex flex-col translate-x-full transition-transform duration-300 ease-in-out">
                  {/* Quiz Header */}
                  <div className="text-center mb-4 flex-shrink-0">
                    <h1 className="text-lg font-bold text-gray-900 mb-1">Test Your Knowledge</h1>
                    <p className="text-xs text-gray-600">Question {currentQuestion + 2} out of {sampleQuestions.length}</p>
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
                        {sampleQuestions[currentQuestion + 1]?.question}
                      </h2>
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-2 gap-2 w-full mb-4 flex-shrink-0">
                      {sampleQuestions[currentQuestion + 1]?.options.map((option) => (
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

            {/* Navigation - Outside of sliding containers */}
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
          </>
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
                  setShowFeedback(false);
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