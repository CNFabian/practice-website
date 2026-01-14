import React, { useState } from 'react';

interface Question {
  id: number;
  question: string;
  options: {
    letter: string;
    text: string;
  }[];
  correctAnswer: string;
}

interface MinigameProps {
  onClose?: () => void;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Which factor most directly affects how much house you can afford to buy?",
    options: [
      { letter: "A", text: "Your monthly rent history" },
      { letter: "B", text: "Your credit score and income" },
      { letter: "C", text: "The size of your household" },
      { letter: "D", text: "How long you plan to stay in the home" }
    ],
    correctAnswer: "B"
  },
  {
    id: 2,
    question: "What is the recommended down payment percentage for a conventional loan?",
    options: [
      { letter: "A", text: "5%" },
      { letter: "B", text: "10%" },
      { letter: "C", text: "20%" },
      { letter: "D", text: "30%" }
    ],
    correctAnswer: "C"
  },
  {
    id: 3,
    question: "Which document is NOT typically required when applying for a mortgage?",
    options: [
      { letter: "A", text: "Pay stubs" },
      { letter: "B", text: "Tax returns" },
      { letter: "C", text: "High school diploma" },
      { letter: "D", text: "Bank statements" }
    ],
    correctAnswer: "C"
  }
];

const Minigame: React.FC<MinigameProps> = ({ onClose }) => {
  const [viewMode, setViewMode] = useState<'growth' | 'questions'>('questions');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showIntro, setShowIntro] = useState(true);
  const [waterCount, setWaterCount] = useState(0);
  const [showWaterNotification, setShowWaterNotification] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];
  const progress = (answeredQuestions.size / SAMPLE_QUESTIONS.length) * 100;
  const currentStage = Math.floor((answeredQuestions.size / SAMPLE_QUESTIONS.length) * 5) + 1;

  const handleAnswerSelect = (letter: string) => {
    setSelectedAnswer(letter);
  };

  const handleNext = () => {
    if (selectedAnswer) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        setWaterCount(prev => prev + 1);
        setShowWaterNotification(true);
        setTimeout(() => setShowWaterNotification(false), 2000);
      }

      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]));
      setSelectedAnswer(null);

      if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handleStart = () => {
    setShowIntro(false);
  };

  const handleDoItLater = () => {
    if (onClose) {
      onClose();
    }
  };

  // Intro Screen
  if (showIntro) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-100 via-blue-50 to-orange-50">
        <div className="max-w-6xl w-full mx-8 grid grid-cols-2 gap-8">
          {/* Left Panel - Growth View */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Grow Your Nest</h2>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${viewMode === 'growth' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Growth
                </span>
                <button
                  onClick={() => setViewMode(viewMode === 'growth' ? 'questions' : 'growth')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    viewMode === 'questions' ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      viewMode === 'questions' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${viewMode === 'questions' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Question Cards
                </span>
              </div>
            </div>

            {/* Plant Growth Area */}
            <div className="flex items-center justify-center h-64 mb-8">
              {/* Simple plant representation */}
              <div className="relative">
                <div className="w-32 h-8 bg-gradient-to-t from-amber-800 to-amber-700 rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20">
                  <div className="w-2 h-20 bg-green-600" />
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-6 h-8 bg-green-500 rounded-full transform -rotate-45" />
                    <div className="w-6 h-8 bg-green-500 rounded-full transform rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-auto">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Stage 1</span>
                <span>{progress.toFixed(0)} / 100</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Intro */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Question Cards</h2>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              {/* Bird placeholder */}
              <div className="w-32 h-32 mb-8 bg-blue-400 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.06 1.06z" />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                Answer questions to earn water and fertilizer to grow your tree of Module 1!
              </h3>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 mt-8">
              <button
                onClick={handleDoItLater}
                className="px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
              >
                DO IT LATER
              </button>
              <button
                onClick={handleStart}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                LET'S GO
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Question Screen
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-100 via-blue-50 to-orange-50">
      <div className="max-w-6xl w-full mx-8 grid grid-cols-2 gap-8">
        {/* Left Panel - Growth View */}
        <div className="bg-white rounded-2xl shadow-xl p-8 relative">
          {/* Water Notification */}
          {showWaterNotification && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white rounded-lg shadow-2xl px-6 py-3 animate-bounce">
              <p className="text-2xl font-bold text-gray-800">+1 Water</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Grow Your Nest</h2>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${viewMode === 'growth' ? 'text-blue-600' : 'text-gray-500'}`}>
                Growth
              </span>
              <button
                onClick={() => setViewMode(viewMode === 'growth' ? 'questions' : 'growth')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  viewMode === 'questions' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    viewMode === 'questions' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${viewMode === 'questions' ? 'text-blue-600' : 'text-gray-500'}`}>
                Question Cards
              </span>
            </div>
          </div>

          {/* Plant Growth Area - grows as questions are answered */}
          <div className="flex items-center justify-center h-64 mb-8">
            <div className="relative">
              {/* Soil */}
              <div className="w-32 h-8 bg-gradient-to-t from-amber-800 to-amber-700 rounded-full" />
              
              {/* Plant stem - grows taller */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-20">
                <div 
                  className="w-2 bg-green-600 transition-all duration-500"
                  style={{ height: `${20 + (waterCount * 15)}px` }}
                />
                
                {/* Leaves - appear based on stage */}
                {waterCount >= 1 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-6 h-8 bg-green-500 rounded-full transform -rotate-45" />
                    <div className="w-6 h-8 bg-green-500 rounded-full transform rotate-45" />
                  </div>
                )}
                
                {waterCount >= 2 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-8 h-10 bg-green-600 rounded-full transform -rotate-45" />
                    <div className="w-8 h-10 bg-green-600 rounded-full transform rotate-45" />
                  </div>
                )}

                {/* Watering can icon when answer is correct */}
                {showWaterNotification && (
                  <div className="absolute -right-12 top-0 animate-bounce">
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505a20.01 20.01 0 013.78.501.75.75 0 11-.339 1.462A18.558 18.558 0 0010 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 01-.338-1.462 20.01 20.01 0 013.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 01-.387.83A4.98 4.98 0 015 14a4.98 4.98 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 01-.336-1.462 33.18 33.18 0 016.668-.829V2.75A.75.75 0 0110 2zM5 7.543L3.92 12.33a3.499 3.499 0 002.16 0L5 7.543zm10 0l-1.08 4.787a3.498 3.498 0 002.16 0L15 7.543z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-auto">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Stage {currentStage}</span>
              <span>{progress.toFixed(0)} / 100</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Question */}
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Question Cards</h2>
          
          <div className="flex-1 flex flex-col">
            {/* Question */}
            <div className="mb-8">
              <p className="text-xl font-semibold text-gray-800">
                {currentQuestionIndex + 1}. {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-4 mb-8">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.letter}
                  onClick={() => handleAnswerSelect(option.letter)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedAnswer === option.letter
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="font-semibold text-gray-800">{option.letter}.</span>{' '}
                  <span className="text-gray-700">{option.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`px-8 py-3 rounded-full font-medium flex items-center gap-2 transition-colors ${
                selectedAnswer
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              NEXT
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Minigame;