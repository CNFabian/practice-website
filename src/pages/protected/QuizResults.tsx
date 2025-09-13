import React, { useState, useEffect, useRef } from 'react';

import {Coin1, Coin2, Coin3, Coin4, Coin5, CelebrationImage} from '../../assets'

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  onContinue: () => void;
  onRetake: () => void;
  onClaimRewards?: () => void;
  triggerCoinVacuum?: boolean;
  lessonTitle?: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  onContinue,
  onRetake,
  onClaimRewards,
  triggerCoinVacuum = false,
  // lessonTitle is received but not used - this prevents TS errors
}) => {
  // Animation states
  const [showContent, setShowContent] = useState(false);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [coinVacuumActive, setCoinVacuumActive] = useState(false);
  
  // Use ref instead of state to prevent re-renders
  const rewardsTriggeredRef = useRef(false);

  // Array of your coin icons for random selection
  const coinIcons = [Coin1, Coin2, Coin3, Coin4, Coin5];

  // Single useEffect to handle all timing - removed the duplicate
  useEffect(() => {
    // Delay content reveal
    const timer1 = setTimeout(() => setShowContent(true), 300);
    const timer2 = setTimeout(() => setConfettiVisible(true), 500);
    
    // Auto-trigger rewards modal after 1.5 seconds - but only once
    const timer3 = setTimeout(() => {
      if (onClaimRewards && !rewardsTriggeredRef.current) {
        rewardsTriggeredRef.current = true;
        onClaimRewards();
      }
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []); // Empty dependency array to prevent re-runs

  // New useEffect to handle the vacuum animation when triggered
  useEffect(() => {
    if (triggerCoinVacuum) {
      setCoinVacuumActive(true);
    }
  }, [triggerCoinVacuum]);

  // Confetti Component with your coin icons
  const Confetti = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${confettiVisible ? 'block' : 'hidden'}`}>
      {[...Array(30)].map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 50;
        return (
          <div
            key={i}
            className={`absolute ${coinVacuumActive ? 'animate-coin-vacuum-upward' : 'animate-bounce'}`}
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              animationDelay: coinVacuumActive ? `${Math.random() * 0.8}s` : `${Math.random() * 2}s`,
              animationDuration: coinVacuumActive ? '1.8s' : `${1 + Math.random()}s`,
              '--start-x': `${startX}vw`,
              '--start-y': `${startY}vh`,
            } as React.CSSProperties}
          >
            <img 
              src={coinIcons[Math.floor(Math.random() * coinIcons.length)]}
              alt="Coin"
              className="w-6 h-6"
            />
          </div>
        );
      })}
      
      {/* CSS for the vacuum animation - coins go straight up to header center */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes coin-vacuum-upward {
            0% {
              opacity: 1;
              transform: translateX(0) translateY(0) scale(1) rotate(0deg);
            }
            100% {
              opacity: 0;
              transform: translateX(calc(50vw - var(--start-x))) 
                         translateY(-40vh) 
                         scale(0.1) 
                         rotate(720deg);
            }
          }
          
          .animate-coin-vacuum-upward {
            animation: coin-vacuum-upward 1.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
          }
        `
      }} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 relative bg-gradient-to-b from-blue-50 to-white">
      <Confetti />
      
      <div className={`transform transition-all duration-700 ${showContent ? 
        'scale-100 opacity-100' : 'scale-95 opacity-0'} max-w-sm w-full`}>
        
        {/* Score indicator at top */}
        <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6 inline-block">
          {correctAnswers}/{totalQuestions} Questions Correct
        </div>

        {/* Static Image Container */}
        <div className="relative">
          <div className="w-48 h-48 mx-auto relative">
            {/* Your static celebration image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={CelebrationImage}
                alt="Celebration" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Coin confetti burst behind image using your coin icons - ONLY VISIBLE BEFORE VACUUM */}
            {!coinVacuumActive && (
              <div className="absolute -inset-8">
                <div className="absolute top-2 left-4 animate-bounce" style={{ animationDelay: '0.1s' }}>
                  <img src={coinIcons[0]} alt="Coin" className="w-6 h-6" />
                </div>
                <div className="absolute top-6 right-2 animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <img src={coinIcons[1]} alt="Coin" className="w-6 h-6" />
                </div>
                <div className="absolute bottom-8 left-2 animate-bounce" style={{ animationDelay: '0.5s' }}>
                  <img src={coinIcons[2]} alt="Coin" className="w-6 h-6" />
                </div>
                <div className="absolute bottom-4 right-6 animate-bounce" style={{ animationDelay: '0.7s' }}>
                  <img src={coinIcons[3]} alt="Coin" className="w-6 h-6" />
                </div>
                <div className="absolute top-4 left-8 animate-bounce" style={{ animationDelay: '0.9s' }}>
                  <img src={coinIcons[4]} alt="Coin" className="w-6 h-6" />
                </div>
                <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: '1.1s' }}>
                  <img src={coinIcons[0]} alt="Coin" className="w-6 h-6" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-2xl font-bold text-gray-900">
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
      </div>
    </div>
  );
};

export default QuizResults;