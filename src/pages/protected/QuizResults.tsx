import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModules } from '../../hooks/useModules';
import RewardsModal from './RewardsModal';
import { 
  CelebrationImage,
  Coin1, Coin2, Coin3, Coin4, Coin5,
} from '../../assets';

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
  totalQuestions,
  correctAnswers,
  onContinue,
  onRetake,
  triggerCoinVacuum = false,
  // lessonTitle is received but not used - this prevents TS errors
}) => {
  const { incrementCoinsWithAnimation, quizState, lessonProgress, selectedLessonId } = useModules();
  
  // Animation states
  const [showContent, setShowContent] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [coinVacuumActive, setCoinVacuumActive] = useState(false);
  const [coinsHaveBeenVacuumed, setCoinsHaveBeenVacuumed] = useState(false);
  const [escapeCoins, setEscapeCoins] = useState<Array<{
    id: string;
    startX: number;
    startY: number;
    icon: string;
    delay: number;
  }>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCoinRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Array of your coin icons for random selection
  const coinIcons = [Coin1, Coin2, Coin3, Coin4, Coin5];

  // Calculate newly earned coins (only for questions not previously completed correctly)
  const calculateNewlyEarnedCoins = () => {
    if (!selectedLessonId) return correctAnswers * 5;
    
    const existingProgress = lessonProgress[selectedLessonId];
    const previouslyCompleted = existingProgress?.completedQuestions || {};
    
    let newlyEarnedCoins = 0;
    
    quizState.questions.forEach((question, index) => {
      const userAnswer = quizState.answers[index];
      const isCorrect = question.options.find(option => option.id === userAnswer)?.isCorrect;
      
      if (isCorrect && !previouslyCompleted[question.id]) {
        newlyEarnedCoins += 5;
      }
    });
    
    return newlyEarnedCoins > 0 ? newlyEarnedCoins : correctAnswers * 5; // Fallback for mock data
  };

  const totalCoinsEarned = calculateNewlyEarnedCoins();

  // Show content and rewards modal with proper timing
  useEffect(() => {
    // Delay content reveal
    const timer1 = setTimeout(() => setShowContent(true), 300);
    
    // Show rewards modal after 2 seconds
    const timer2 = setTimeout(() => {
      setShowRewardsModal(true);
    }, 0);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Handle coin vacuum animation when triggered
useEffect(() => {
  if (triggerCoinVacuum && containerRef.current && !coinsHaveBeenVacuumed) {
    // Get actual positions of the static coins that are visible on the page
    const coinPositions = staticCoinRefs.current
      .filter(ref => ref !== null)
      .map(ref => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
        return null;
      })
      .filter((pos): pos is { x: number; y: number } => pos !== null);

    // Create escape coins using actual static coin positions
    const coins = coinPositions.map((pos, i) => ({
      id: `coin-${i}`,
      startX: pos!.x,
      startY: pos!.y,
      icon: coinIcons[i % coinIcons.length],
      delay: Math.random() * 0.8
    }));
    
    setEscapeCoins(coins);
    setCoinVacuumActive(true);
    setCoinsHaveBeenVacuumed(true);
    
    // REMOVED: No coin increments here - only visual animation
    // Coins will be incremented by handleRewardsModalClose when the modal is actually closed
    
    // Clean up after animation
    setTimeout(() => {
      setEscapeCoins([]);
      setCoinVacuumActive(false);
    }, 2200);
  }
}, [triggerCoinVacuum, coinIcons, totalCoinsEarned]);

  // Handle rewards modal actions
const handleRewardsModalClose = () => {
    setShowRewardsModal(false);
    
    // Only trigger coin vacuum animation when modal closes AND coins haven't been vacuumed yet
    if (containerRef.current && !coinsHaveBeenVacuumed && selectedLessonId) {
      // Get actual positions of the static coins that are visible on the page
      const coinPositions = staticCoinRefs.current
        .filter(ref => ref !== null)
        .map(ref => {
          if (ref) {
            const rect = ref.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
          return null;
        })
        .filter((pos): pos is { x: number; y: number } => pos !== null);

      // Create escape coins using actual static coin positions
      const coins = coinPositions.map((pos, i) => ({
        id: `coin-${i}`,
        startX: pos!.x,
        startY: pos!.y,
        icon: coinIcons[i % coinIcons.length],
        delay: Math.random() * 0.8
      }));
      
      setEscapeCoins(coins);
      setCoinVacuumActive(true);
      setCoinsHaveBeenVacuumed(true);
      
      // UPDATED: Use Redux to increment coins during animation
      if (coins.length > 0) {
        const coinsPerAnimation = totalCoinsEarned / coins.length;
        coins.forEach((coin) => {
          const arrivalTime = 1000 + (coin.delay * 1000) + 800;
          setTimeout(() => {
            // Use Redux action instead of direct incrementCoins
            incrementCoinsWithAnimation(selectedLessonId, coinsPerAnimation, true);
          }, arrivalTime);
        });
      }
      
      // Clean up after animation
      setTimeout(() => {
        setEscapeCoins([]);
        setCoinVacuumActive(false);
      }, 2200);
    }
  };

  const handleNavigateToRewards = () => {
    setShowRewardsModal(false);
    console.log('Navigating to rewards page');
  };

  const handleNavigateToBadges = () => {
    setShowRewardsModal(false);
    console.log('Navigating to badges page');
  };

  // Generate coin positions for the earned coins
  const generateCoinPositions = () => {
    const positions = [];
    const maxRadius = 120;
    const minRadius = 60;
    
    for (let i = 0; i < totalCoinsEarned; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      positions.push({
        x: x,
        y: y,
        delay: i * 0.1,
        coinType: coinIcons[i % coinIcons.length]
      });
    }
    
    return positions;
  };

  const coinPositions = generateCoinPositions();

  // Escape Coins Portal Component
  const EscapeCoins = () => {
    if (escapeCoins.length === 0) return null;

    const targetX = window.innerWidth * 0.87;
    const targetY = 25;

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
                  opacity: 0;
                  transform: translateX(${targetX - coin.startX}px) 
                             translateY(${targetY - coin.startY}px) 
                             scale(0.5) 
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
      className="flex-1 flex flex-col items-center justify-center text-center p-6 relative"
    >
      <div className={`transform transition-all duration-700 ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} max-w-sm w-full`}>
        
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

            {/* Dynamic coin confetti burst behind image - ONLY VISIBLE BEFORE VACUUM AND NOT AFTER VACUUM */}
            {!coinVacuumActive && !coinsHaveBeenVacuumed && (
              <div className="absolute -inset-24">
                {coinPositions.map((position, index) => (
                  <div 
                    key={index}
                    ref={(el) => staticCoinRefs.current[index] = el}
                    className="absolute animate-bounce" 
                    style={{ 
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${position.delay}s`
                    }}
                  >
                    <img src={position.coinType} alt="Coin" className="w-6 h-6" />
                  </div>
                ))}
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

      {/* Rewards Modal */}
      <RewardsModal
        isOpen={showRewardsModal}
        onClose={handleRewardsModalClose}
        onNavigateToRewards={handleNavigateToRewards}
        onNavigateToBadges={handleNavigateToBadges}
      />
    </div>
  );
};

export default QuizResults;
