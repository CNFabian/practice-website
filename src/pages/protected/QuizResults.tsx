import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [escapeCoins, setEscapeCoins] = useState<Array<{
    id: number;
    startX: number;
    startY: number;
    icon: string;
    delay: number;
  }>>([]);
  
  // Use ref instead of state to prevent re-renders
  const rewardsTriggeredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (triggerCoinVacuum && containerRef.current) {
      // Get container position for proper coin placement
      const rect = containerRef.current.getBoundingClientRect();
      
      // Create escape coins with absolute positions
      const coins = Array.from({ length: 30 }, (_, i) => {
        // Random position within the visible container
        const relativeX = Math.random() * 80 + 10; // 10% to 90% to avoid edges
        const relativeY = Math.random() * 60 + 20; // 20% to 80% to stay in visible area
        
        return {
          id: i,
          startX: rect.left + (rect.width * relativeX / 100),
          startY: rect.top + (rect.height * relativeY / 100),
          icon: coinIcons[Math.floor(Math.random() * coinIcons.length)],
          delay: Math.random() * 0.8
        };
      });
      
      setEscapeCoins(coins);
      setCoinVacuumActive(true);
      
      // Hide regular confetti and clean up after animation
      setTimeout(() => {
        setEscapeCoins([]);
        setCoinVacuumActive(false);
      }, 2200);
    }
  }, [triggerCoinVacuum]);

  // Regular Confetti Component (only shows when vacuum is not active)
  const Confetti = () => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${confettiVisible && !coinVacuumActive ? 'block' : 'hidden'}`}>
      {[...Array(30)].map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 50;
        return (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random()}s`,
            }}
          >
            <img 
              src={coinIcons[Math.floor(Math.random() * coinIcons.length)]}
              alt="Coin"
              className="w-6 h-6"
            />
          </div>
        );
      })}
    </div>
  );

  // Escape Coins Portal Component
  const EscapeCoins = () => {
    if (escapeCoins.length === 0) return null;

    const targetX = window.innerWidth * 0.87; // 75% from left (more to the right)
    const targetY = 25; // Just below header

    return createPortal(
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {escapeCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute w-6 h-6"
            style={{
              left: `${coin.startX}px`,
              top: `${coin.startY}px`,
              animation: `coinEscape-${coin.id} 1.8s cubic-bezier(0.4, 0.0, 0.2, 1) ${coin.delay}s forwards`,
            }}
          >
            <img 
              src={coin.icon}
              alt="Coin"
              className="w-full h-full"
            />
          </div>
        ))}
        
        <style dangerouslySetInnerHTML={{
          __html: `
            ${escapeCoins.map(coin => `
              @keyframes coinEscape-${coin.id} {
                0% {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                }
                100% {
                  opacity: 1;
                  transform: translateX(${targetX - coin.startX}px) 
                             translateY(${targetY - coin.startY}px) 
                             scale(1) 
                             rotate(720deg);
                }
              }
            `).join('')}
          `
        }} />
      </div>,
      document.body
    );
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center text-center p-6 relative bg-gradient-to-b from-blue-50 to-white"
    >
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

      {/* Render escape coins */}
      <EscapeCoins />
    </div>
  );
};

export default QuizResults;