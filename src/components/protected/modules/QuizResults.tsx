import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModules } from '../../../hooks/useModules';
import { useSubmitQuiz } from '../../../hooks/mutations/useSubmitQuiz';

import RewardsModal from './RewardsModal';
import {
  CelebrationImage, TryAgainImage,
  Coin1, Coin2, Coin3, Coin4, Coin5,
} from '../../../assets';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  onContinue: () => void;
  onRetake: () => void;
  onClaimRewards?: () => void;
  triggerCoinVacuum?: boolean;
  lessonTitle?: string;
  nextLesson?: any;
  isModuleQuiz?: boolean;
  moduleId?: number;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  totalQuestions,
  correctAnswers,
  onContinue,
  onRetake,
  triggerCoinVacuum = false,
  nextLesson,
  isModuleQuiz = false,
  moduleId,
}) => {
  const {
    quizState,
    selectedLessonId,
    completeQuiz,
    completeModuleQuiz
  } = useModules();

  const { mutate: submitQuizMutation } = useSubmitQuiz(
    selectedLessonId?.toString() || '',
    moduleId?.toString() || ''
  );

  const [showContent, setShowContent] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [coinVacuumActive, setCoinVacuumActive] = useState(false);
  const [coinsHaveBeenVacuumed, setCoinsHaveBeenVacuumed] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [escapeCoins, setEscapeCoins] = useState<Array<{
    id: string;
    startX: number;
    startY: number;
    icon: string;
    delay: number;
  }>>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const staticCoinRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Add ref to track if modal has already been shown
  const modalShownRef = useRef(false);

  const coinIcons = [Coin1, Coin2, Coin3, Coin4, Coin5];

  const totalCoinsEarned = 0;
  const hasEarnedCoins = false;

useEffect(() => {
  if (!quizSubmitted && selectedLessonId && quizState.answers) {
    const answers = Object.entries(quizState.answers).map(([questionId, answerId]) => ({
      [questionId]: answerId
    }));

    submitQuizMutation({
      lesson_id: selectedLessonId.toString(),
      answers,
    });

    setQuizSubmitted(true);
  }
}, [quizSubmitted, selectedLessonId, quizState.answers, submitQuizMutation]);

useEffect(() => {
  const timer1 = setTimeout(() => setShowContent(true), 300);

  const timer2 = setTimeout(() => {
    if (!modalShownRef.current && (hasEarnedCoins || correctAnswers === totalQuestions)) {
      setShowRewardsModal(true);
      modalShownRef.current = true;
    }
  }, 2000);

  const timer3 = setTimeout(() => {
    if (correctAnswers === 0 && !hasEarnedCoins) {
      if (isModuleQuiz && moduleId) {
        completeModuleQuiz(moduleId, quizState.score);
      } else if (selectedLessonId) {
        completeQuiz(selectedLessonId, quizState.score);
      }
    }
  }, 2500);

  return () => {
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);
  };
}, [correctAnswers, totalQuestions, hasEarnedCoins, isModuleQuiz, moduleId, selectedLessonId, completeModuleQuiz, completeQuiz, quizState.score]);

  useEffect(() => {
    if (triggerCoinVacuum && containerRef.current && !coinsHaveBeenVacuumed && hasEarnedCoins) {
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
      
      
      // Clean up
      setTimeout(() => {
        setEscapeCoins([]);
        setCoinVacuumActive(false);
      }, 2200);
    }
  }, [triggerCoinVacuum, coinIcons, totalCoinsEarned, hasEarnedCoins, coinsHaveBeenVacuumed, isModuleQuiz, moduleId, selectedLessonId]);

  const handleRewardsModalClose = () => {
    setShowRewardsModal(false);
    
    if (isModuleQuiz && moduleId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeModuleQuiz(moduleId, quizState.score);
      
      if (containerRef.current) {
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
        
        
        setTimeout(() => {
          setEscapeCoins([]);
          setCoinVacuumActive(false);
        }, 2200);
      }
    } else if (selectedLessonId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeQuiz(selectedLessonId, quizState.score);
      
      if (containerRef.current) {
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
        
        
        // Clean up
        setTimeout(() => {
          setEscapeCoins([]);
          setCoinVacuumActive(false);
        }, 2200);
      }
    }
  };

  const handleNavigateToRewards = () => {
    if (isModuleQuiz && moduleId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeModuleQuiz(moduleId, quizState.score);
      setCoinsHaveBeenVacuumed(true);
    } else if (selectedLessonId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeQuiz(selectedLessonId, quizState.score);
      setCoinsHaveBeenVacuumed(true);
    }
    
    setShowRewardsModal(false);
    console.log('Navigating to rewards page');
  };

  const handleNavigateToBadges = () => {
    if (isModuleQuiz && moduleId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeModuleQuiz(moduleId, quizState.score);
      setCoinsHaveBeenVacuumed(true);
    } else if (selectedLessonId && hasEarnedCoins && !coinsHaveBeenVacuumed) {
      completeQuiz(selectedLessonId, quizState.score);
      setCoinsHaveBeenVacuumed(true);
    }
    
    setShowRewardsModal(false);
    console.log('Navigating to badges page');
  };

  // Generate coin positions for the earned coins
  const generateCoinPositions = () => {
    if (!hasEarnedCoins) return [];
    
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
            {/* Conditional image based on score */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={correctAnswers === 0 ? TryAgainImage : CelebrationImage}
                alt={correctAnswers === 0 ? "Try Again" : "Celebration"} 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Dynamic coin confetti burst behind image - ONLY VISIBLE BEFORE VACUUM AND NOT AFTER VACUUM AND NOT FOR 0% */}
            {!coinVacuumActive && !coinsHaveBeenVacuumed && hasEarnedCoins && correctAnswers > 0 && (
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

        {/* Conditional success/failure message */}
        <h2 className="text-2xl font-bold text-gray-900">
          {correctAnswers === 0 ? 'Keep Trying!' : hasEarnedCoins ? 'Great Work!' : 'Quiz Complete!'}
        </h2>

        {/* Conditional description message */}
        {correctAnswers === 0 ? (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Don't worry! Learning takes practice. Review the material and try again to master the concepts.
          </p>
        ) : (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            Great job completing the quiz! You're making excellent progress in your learning journey.
          </p>
        )}

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

      {/* Rewards Modal with proper props */}
      <RewardsModal
        isOpen={showRewardsModal}
        onClose={handleRewardsModalClose}
        onNavigateToRewards={handleNavigateToRewards}
        onNavigateToBadges={handleNavigateToBadges}
        coinsEarned={totalCoinsEarned}
        hasEarnedCoins={hasEarnedCoins}
        hasEarnedBadge={correctAnswers === totalQuestions} 
        lessonId={isModuleQuiz ? moduleId : selectedLessonId}
        totalQuestions={totalQuestions}            
        correctAnswers={correctAnswers}          
      />
    </div>
  );
};

export default QuizResults;