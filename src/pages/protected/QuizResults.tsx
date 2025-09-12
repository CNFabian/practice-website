import React, { useState, useEffect } from 'react';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  onContinue: () => void;
  onRetake: () => void;
  onClaimRewards?: () => void;
  lessonTitle?: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  onContinue,
  onRetake,
  onClaimRewards,
  lessonTitle
}) => {
  // Animation states
  const [showContent, setShowContent] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);

  // Trigger celebration sequence when component mounts
  useEffect(() => {
    // Delay content reveal
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setConfettiVisible(true), 500);
    const timer3 = setTimeout(() => setConfettiVisible(false), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Confetti Component - simpler version
  const Confetti = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${confettiVisible ? 'block' : 'hidden'}`}>
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 50}%`,
            fontSize: ['12px', '16px', '20px'][Math.floor(Math.random() * 3)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random()}s`
          }}
        >
          {['🎉', '⭐', '✨', '🎊', '🌟'][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative bg-gradient-to-b from-blue-50 to-white">
      <Confetti />
      
      <div className={`transform transition-all duration-700 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} max-w-sm w-full`}>
        
        {/* Score indicator at top */}
        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
          {correctAnswers}/{totalQuestions} Questions Correct
        </div>

        {/* Celebratory Character Illustration */}
        <div className="mb-6 relative">
          <div className="w-48 h-48 mx-auto relative">
            {/* Character illustration - simplified version matching your design */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Character body */}
              <div className="relative">
                {/* Confetti burst behind character */}
                <div className="absolute -inset-8">
                  <div className="absolute top-2 left-4 text-yellow-400 animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
                  <div className="absolute top-6 right-2 text-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }}>🎊</div>
                  <div className="absolute bottom-8 left-2 text-orange-400 animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
                  <div className="absolute bottom-4 right-6 text-green-400 animate-bounce" style={{ animationDelay: '0.7s' }}>🌟</div>
                  <div className="absolute top-4 left-8 text-purple-400 animate-bounce" style={{ animationDelay: '0.9s' }}>✨</div>
                  <div className="absolute top-8 right-8 text-pink-400 animate-bounce" style={{ animationDelay: '1.1s' }}>🎉</div>
                </div>

                {/* Main character */}
                <div className="w-32 h-40 mx-auto relative">
                  {/* Head */}
                  <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-2 relative">
                    {/* Hair */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-8 bg-gray-800 rounded-t-full"></div>
                    {/* Face */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex space-x-2 mb-1">
                        <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                      </div>
                      <div className="w-3 h-2 bg-pink-300 rounded-full"></div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="w-12 h-16 bg-yellow-400 rounded-t-2xl mx-auto relative">
                    {/* Arms raised in celebration */}
                    <div className="absolute -top-2 -left-3 w-3 h-8 bg-yellow-100 rounded-full transform -rotate-45 animate-pulse"></div>
                    <div className="absolute -top-2 -right-3 w-3 h-8 bg-yellow-100 rounded-full transform rotate-45 animate-pulse"></div>
                    
                    {/* Quiz certificate in hand */}
                    <div className="absolute -top-1 right-0 w-6 h-4 bg-white border-2 border-green-500 rounded text-xs flex items-center justify-center transform rotate-12">
                      <div className="text-green-600 font-bold text-xs">✓</div>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You completed the lesson!
        </h2>
        
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          In this module, you learned the key financial requirements lenders evaluate and your next steps!
        </p>

        {/* Action buttons */}
        <div className="space-y-3 w-full">
          <button
            onClick={onContinue}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Next Lesson
          </button>
          
          <button
            onClick={onRetake}
            className="w-full py-3 bg-blue-100 text-blue-600 rounded-xl font-semibold hover:bg-blue-200 transition-colors"
          >
            Try Again
          </button>
        </div>

        {/* Achievement badge if high score */}
        {score >= 80 && (
          <div className="mt-6 animate-pulse">
            <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-xs font-medium">
              🏆 Great Job! {score}% Score
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;