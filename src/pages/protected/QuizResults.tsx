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
  nextLesson?: any; // Add nextLesson prop to determine button text
}

const QuizResults: React.FC<QuizResultsProps> = ({
  totalQuestions,
  correctAnswers,
  onContinue,
  onRetake,
  triggerCoinVacuum = false,
  nextLesson, // NEW: Use this to determine button text
  // lessonTitle is received but not used - this prevents TS errors
}) => {
  const { incrementCoinsWithAnimation, quizState, lessonProgress, selectedLessonId } = useModules();
  
  // Animation states
  const [showContent, setShowContent] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [coinVacuumActive, setCoinVacuumActive] = useState(false);
  const [coinsHaveBeenVacuumed, setCoinsHaveBeenVacuumed] = useState(false);
  const [escapeCoins] = useState<Array<{
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
    
    return newlyEarnedCoins > 0 ? newlyEarnedCoins : correctAnswers * 5;
  };

  const newlyEarnedCoins = calculateNewlyEarnedCoins();

  // Generate random coin positions around the image
  const generateCoinPositions = () => {
    const positions = [];
    const numCoins = Math.min(correctAnswers * 3, 15);
    
    for (let i = 0; i < numCoins; i++) {
      const angle = (i / numCoins) * 2 * Math.PI;
      const radius = 80 + Math.random() * 40;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 30;
      const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 30;
      
      positions.push({
        x: x,
        y: y,
        delay: Math.random() * 0.5,
        coinType: coinIcons[Math.floor(Math.random() * coinIcons.length)]
      });
    }
    
    return positions;
  };

  const coinPositions = generateCoinPositions();

  // Handle coin vacuum effect
  useEffect(() => {
    if (triggerCoinVacuum) {
      setCoinVacuumActive(true);
      
      const timer = setTimeout(() => {
        setCoinVacuumActive(false);
        setCoinsHaveBeenVacuumed(true);
        incrementCoinsWithAnimation(selectedLessonId || 0, newlyEarnedCoins, true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [triggerCoinVacuum, selectedLessonId, newlyEarnedCoins, incrementCoinsWithAnimation]);

  // Show content after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Escape Coins Component using Portal
  const EscapeCoins = () => {
    if (escapeCoins.length === 0) return null;

    return createPortal(
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        {escapeCoins.map((coin) => (
          <div
            key={coin.id}
            className="absolute w-8 h-8 animate-bounce"
            style={{
              left: coin.startX,
              top: coin.startY,
              animationDelay: `${coin.delay}s`,
              animationDuration: '2s'
            }}
          >
            <img src={coin.icon} alt="Escaping coin" className="w-full h-full" />
          </div>
        ))}
      </div>,
      document.body
    );
  };

  const handleRewardsModalClose = () => {
    setShowRewardsModal(false);
  };

  const handleNavigateToRewards = () => {
    console.log('Navigate to rewards page');
    setShowRewardsModal(false);
  };

  const handleNavigateToBadges = () => {
    console.log('Navigate to badges page');
    setShowRewardsModal(false);
  };

  return (
    <div ref={containerRef} className="h-full flex items-center justify-center bg-white p-6 relative overflow-hidden">
      <div className={`text-center transition-all duration-500 ${
        showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      } max-w-sm w-full`}>
        
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
            {nextLesson ? 'Next Lesson' : 'Complete Module'}
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