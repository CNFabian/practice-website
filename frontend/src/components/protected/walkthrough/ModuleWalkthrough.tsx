import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont } from '../../../assets';
import GameManager from '../../../pages/protected/modules/phaser/managers/GameManager';

// Import assets
import { 
  NoticeBirdIcon,
  CoinStack,
  TreasureChest // Adjust this import name based on your actual asset name

} from '../../../assets';

interface WalkthroughStep {
  id: string;
  type: 'fullscreen' | 'highlight';
  targetSelector?: string;
  content: {
    image?: string;
    secondaryImage?: string;
    title: string;
    description: string | React.ReactNode;
    buttonText: string;
  };
  highlight?: {
    // For canvas-based highlighting, we use percentage-based regions
    region?: { x: number; y: number; width: number; height: number };
    // Or target a DOM element
    selector?: string;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  // Scene to transition to before showing this step
  sceneTransition?: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView';
}

interface ModuleWalkthroughProps {
  isActive: boolean;
  onExit: () => void;
  onComplete: () => void;
  onSceneTransition?: (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView') => void;
}

// Walkthrough steps
const walkthroughSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Welcome!',
      description: "We're happy to be with you through your home-buying journey!",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'MapScene',
  },
  {
    id: 'earn-coins',
    type: 'fullscreen',
    content: {
      image: CoinStack,
      title: 'Complete Lessons and Minigames to Earn Nest Coins',
      description: "Coins can be spent in the rewards shop to redeem coupons for your favorite stores!",
      buttonText: 'CONTINUE',
    },
  },
  {
    id: 'welcome-gift',
    type: 'fullscreen',
    content: {
      image: TreasureChest,
      secondaryImage: CoinStack,
      title: "Here's a Welcome Gift!",
      description: 'COIN_GIFT',
      buttonText: 'GET STARTED',
    },
  },
  {
    id: 'neighborhood-intro',
    type: 'highlight',
    content: {
      title: 'Explore Neighborhoods',
      description: 'Each neighborhood represents a different stage of your home-buying journey. Complete all the lessons in one neighborhood to unlock the next one!',
      buttonText: 'NEXT',
    },
    highlight: {
      // Target the Phaser container
      selector: '[data-walkthrough="phaser-container"]',
      // Home-Buying Knowledge neighborhood - bottom-left of the canvas
      // Adjusted based on screenshot: neighborhood is roughly at 5-45% from left, 45-90% from top
      region: { x: 5, y: 45, width: 40, height: 45 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
  },
  {
    id: 'house-intro',
    type: 'highlight',
    content: {
      title: 'Welcome to Your First House!',
      description: 'Each house contains lessons on a specific topic. Complete all the lessons in a house to earn bonus coins and unlock new content. The progress bar shows how much you\'ve completed!',
      buttonText: 'GOT IT',
    },
    highlight: {
      // Target the Phaser container
      selector: '[data-walkthrough="phaser-container"]',
      // First house (Homebuying Fundamentals) - upper-left area of the neighborhood scene
      region: { x: 5, y: 5, width: 50, height: 55 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
    sceneTransition: 'NeighborhoodScene',
  },
  {
    id: 'module-welcome',
    type: 'fullscreen',
    content: {
      title: '',
      description: "Welcome to the first module! This is where you'll learn everything you'll need to buy your first home.",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'HouseScene',
  },
  {
    id: 'module-lessons',
    type: 'highlight',
    content: {
      title: '',
      description: "You can read lessons and watch videos here.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // First lesson card - top left of house (position x:29%, y:32%)
      region: { x: 16, y: 16, width: 30, height: 30 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
  },
  {
    id: 'lesson-video-reading',
    type: 'highlight',
    content: {
      title: '',
      description: "Each lesson includes a video walkthrough and a reading version. Use this toggle to switch between watching the video or reading at your own pace.",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'LessonView',
    highlight: {
      selector: '[data-walkthrough="lesson-view-toggle"]',
    },
    tooltipPosition: 'bottom',
    highlightPadding: 8,
  },
  {
    id: 'module-minigame',
    type: 'fullscreen',
    content: {
      title: '',
      description: "Once you've completed your lessons, head back to the house and play a minigame to grow your tree and earn Nest Coins. Coins can be redeemed in the rewards shop for real-world perks and discounts!",
      buttonText: "LET'S GO",
    },
  },
];

const ModuleWalkthrough: React.FC<ModuleWalkthroughProps> = ({
  isActive,
  onExit,
  onComplete,
  onSceneTransition,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = walkthroughSteps[currentStepIndex];
  const isLastStep = currentStepIndex === walkthroughSteps.length - 1;

  // When walkthrough becomes active, immediately transition to the first step's scene
  useEffect(() => {
    if (isActive && onSceneTransition) {
      const firstStep = walkthroughSteps[0];
      if (firstStep.sceneTransition) {
        onSceneTransition(firstStep.sceneTransition);
      }
    }
  }, [isActive, onSceneTransition]);

  // Calculate highlight position for highlight-type steps
  const updateHighlightPosition = useCallback(() => {
    if (currentStep.type !== 'highlight' || !currentStep.highlight) {
      setHighlightRect(null);
      return;
    }

    const { selector, region } = currentStep.highlight;
    
    if (selector) {
      const element = document.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // If we have a region, calculate the sub-region within the element
        if (region) {
          const subRect = new DOMRect(
            rect.left + (rect.width * region.x / 100),
            rect.top + (rect.height * region.y / 100),
            rect.width * region.width / 100,
            rect.height * region.height / 100
          );
          setHighlightRect(subRect);
        } else {
          setHighlightRect(rect);
        }
      }
    }
  }, [currentStep]);

  // Update highlight position on step change and resize
  useEffect(() => {
    if (!isActive) return;

    updateHighlightPosition();

    const handleResize = () => updateHighlightPosition();
    window.addEventListener('resize', handleResize);
    
    // Also update periodically for canvas changes
    const intervalId = setInterval(updateHighlightPosition, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [isActive, currentStepIndex, updateHighlightPosition]);

  // Handle next step
  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = walkthroughSteps[currentStepIndex + 1];
      
      // Check if the next step requires a scene transition
      if (nextStep?.sceneTransition && onSceneTransition) {
        setIsTransitioning(true);
        onSceneTransition(nextStep.sceneTransition);
        
        // Wait for scene transition to complete before showing next step
        setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }, 0); // Allow time for Phaser scene transition
      } else {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }, 300);
      }
    }
  };

  // Handle exit
  const handleExit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStepIndex(0);
    onExit();
  };

  // When house-intro step is shown, trigger progress card expand on first house
useEffect(() => {
  if (!isActive) return;
  
  if (currentStep.id === 'house-intro') {
    // Delay to let NeighborhoodScene fully render after transition
    const timer = setTimeout(() => {
      const game = GameManager.getGame();
      if (game) {
        console.log('🎯 Walkthrough: calling expandProgressCard directly');
        
        const neighborhoodScene = game.scene.getScene('NeighborhoodScene') as any;
        if (neighborhoodScene && neighborhoodScene.expandProgressCard) {
          neighborhoodScene.expandProgressCard(0);
        } else {
          console.error('❌ NeighborhoodScene or expandProgressCard method not found!');
        }
      }
    }, 700);
    
    return () => clearTimeout(timer);
  }
}, [isActive, currentStepIndex]);

  // Block all keyboard events from reaching Phaser when walkthrough is active
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      
      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'Enter') {
        if (isLastStep) {
          onComplete();
        } else {
          const nextStep = walkthroughSteps[currentStepIndex + 1];
          
          // Check if the next step requires a scene transition
          if (nextStep?.sceneTransition && onSceneTransition) {
            setIsTransitioning(true);
            onSceneTransition(nextStep.sceneTransition);
            
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
              setIsTransitioning(false);
            }, 800);
          } else {
            setIsTransitioning(true);
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
              setIsTransitioning(false);
            }, 300);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, currentStepIndex, isLastStep, onComplete, onSceneTransition]);

  // Reset step index when walkthrough becomes inactive
  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  // Block all pointer events from reaching background
  const blockEvent = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Render the description with special handling for coin gift
  const renderDescription = (description: string | React.ReactNode) => {
    if (description === 'COIN_GIFT') {
      return (
        <OnestFont 
          weight={300} 
          lineHeight="relaxed" 
          className="text-lg text-pure-white/90 mb-10 max-w-md"
        >
          <span className="text-logo-yellow font-bold">225 coins</span> have been added to your balance. Get started on your home-buying journey and earn more!
        </OnestFont>
      );
    }
    
    return description;
  };

  // Render the image(s) for fullscreen steps
  const renderStepImage = () => {
    const { content } = currentStep;
    
    if (currentStep.id === 'welcome-gift' && content.image && content.secondaryImage) {
      return (
        <div className="relative mb-8 w-48 h-40">
          <img 
            src={content.image} 
            alt="" 
            className="absolute right-0 top-0 w-36 h-36 object-contain"
          />
          <img 
            src={content.secondaryImage} 
            alt="" 
            className="absolute left-0 bottom-0 w-28 h-28 object-contain z-10"
          />
        </div>
      );
    }
    
    if (content.image) {
      return (
        <div className="mb-8">
          <img 
            src={content.image} 
            alt="" 
            className="w-32 h-32 object-contain"
          />
        </div>
      );
    }
    
    return null;
  };

  // Render fullscreen modal step
  const renderFullscreenStep = () => {
    const { content } = currentStep;

    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={blockEvent}
        onMouseDown={blockEvent}
        onMouseUp={blockEvent}
        onTouchStart={blockEvent}
        onTouchEnd={blockEvent}
        style={{ pointerEvents: 'all' }}
      >
        {/* Dark overlay behind modal */}
        <div 
          className="absolute inset-0 bg-text-blue-black/60"
          onClick={(e) => {
            blockEvent(e);
            handleExit(e);
          }}
          onMouseDown={blockEvent}
          onMouseUp={blockEvent}
        />

        {/* Modal container with LinearBlue1 gradient - compact when no image */}
        <div 
          className={`relative w-full ${
            currentStep.content.image ? 'max-w-3xl h-[85vh] max-h-[700px]' : 'max-w-sm'
          } rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
          }}
          onClick={blockEvent}
          onMouseDown={blockEvent}
          onMouseUp={blockEvent}
        >
          {/* Exit button in top right */}
          <button
            onClick={handleExit}
            onMouseDown={blockEvent}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-pure-white/20 hover:bg-pure-white/30 transition-colors flex items-center justify-center"
            aria-label="Exit walkthrough"
          >
            <svg 
              className="w-5 h-5 text-pure-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

         {/* Content centered in modal */}
          <div className={`flex flex-col items-center justify-center ${
            currentStep.content.image ? 'h-full px-8' : 'px-6 py-8'
          } text-center`}>
            {renderStepImage()}

            <OnestFont 
              as={currentStep.content.image ? 'h1' : 'p'}
              weight={currentStep.content.image ? 700 : 500} 
              lineHeight={currentStep.content.image ? 'tight' : 'relaxed'}
              className={`${
                currentStep.content.image ? 'text-3xl mb-4 max-w-lg' : 'text-base mb-6'
              } text-pure-white`}
            >
              {currentStep.content.image ? content.title : renderDescription(content.description)}
            </OnestFont>

            {currentStep.content.image && (
              <OnestFont 
                weight={300} 
                lineHeight="relaxed" 
                className="text-lg text-pure-white/90 mb-10 max-w-md"
              >
                {renderDescription(content.description)}
              </OnestFont>
            )}

            <button
              onClick={handleNext}
              onMouseDown={blockEvent}
              className={`${
                currentStep.content.image ? 'px-12 py-4' : 'px-10 py-3'
              } bg-pure-white rounded-full text-elegant-blue hover:bg-text-white transition-colors shadow-lg`}
            >
              <OnestFont weight={500} lineHeight="relaxed" className={`${
                currentStep.content.image ? 'text-base' : 'text-sm'
              } tracking-wide`}>
                {content.buttonText}
              </OnestFont>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render highlight step (overlay with spotlight on element)
  const renderHighlightStep = () => {
    const { content } = currentStep;
    const padding = currentStep.highlightPadding || 16;

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
      if (!highlightRect) {
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      }

      const tooltipWidth = 400;
      const tooltipHeight = 200;
      const offset = 24;

      const viewportPadding = 16;
      let top: number | undefined;
      let left: number | undefined;
      let bottom: number | undefined;
      let right: number | undefined;

      switch (currentStep.tooltipPosition) {
        case 'top':
          bottom = window.innerHeight - highlightRect.top + padding + offset;
          left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = highlightRect.bottom + padding + offset;
          left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          right = window.innerWidth - highlightRect.left + padding + offset;
          break;
        case 'right':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          left = highlightRect.right + padding + offset;
          break;
        default:
          top = highlightRect.bottom + padding + offset;
          left = highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2;
      }

      // Clamp to viewport bounds
      if (left !== undefined) {
        left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipWidth - viewportPadding));
      }
      if (top !== undefined) {
        top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipHeight - viewportPadding));
      }

      const style: React.CSSProperties = {};
      if (top !== undefined) style.top = top;
      if (left !== undefined) style.left = left;
      if (bottom !== undefined) style.bottom = bottom;
      if (right !== undefined) style.right = right;

      return style;
    };

    return (
      <div 
        className="fixed inset-0 z-[9999]"
        onClick={blockEvent}
        onMouseDown={blockEvent}
        onMouseUp={blockEvent}
        onTouchStart={blockEvent}
        onTouchEnd={blockEvent}
        style={{ pointerEvents: 'all' }}
      >
        {/* Dark overlay with cutout for highlighted area */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Highlighted cutout area - the boxShadow creates the dark overlay around it */}
          {highlightRect && (
            <div
              className="absolute rounded-2xl transition-all duration-300"
              style={{
                top: highlightRect.top - padding,
                left: highlightRect.left - padding,
                width: highlightRect.width + padding * 2,
                height: highlightRect.height + padding * 2,
                boxShadow: '0 0 0 9999px rgba(25, 33, 65, 0.7)',
                background: 'transparent',
                pointerEvents: 'none',
              }}
            >
              {/* Pulsing border */}
              <div className="absolute inset-0 rounded-2xl border-2 border-logo-blue animate-pulse" />
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: '0 0 30px 8px rgba(54, 88, 236, 0.4)' }}
              />
            </div>
          )}
        </div>

        {/* Exit button */}
        <button
          onClick={handleExit}
          onMouseDown={blockEvent}
          className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-pure-white/20 hover:bg-pure-white/30 transition-colors flex items-center justify-center"
          aria-label="Exit walkthrough"
        >
          <svg 
            className="w-5 h-5 text-pure-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tooltip */}
        <div
          className={`absolute z-20 w-[400px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...getTooltipStyle(),
            background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
          }}
          onClick={blockEvent}
          onMouseDown={blockEvent}
        >
          <div className="p-6">
            {/* Title */}
            <OnestFont 
              as="h2" 
              weight={700} 
              lineHeight="tight" 
              className="text-2xl text-pure-white mb-3"
            >
              {content.title}
            </OnestFont>

            {/* Description */}
            <OnestFont 
              weight={300} 
              lineHeight="relaxed" 
              className="text-base text-pure-white/90"
            >
              {content.description}
            </OnestFont>

            {/* Button with margin-top for spacing */}
            <div className="mt-8">
              <button
                onClick={handleNext}
                onMouseDown={blockEvent}
                className="w-full px-8 py-3 bg-pure-white rounded-full text-elegant-blue hover:bg-text-white transition-colors shadow-lg"
              >
                <OnestFont weight={500} lineHeight="relaxed" className="text-base tracking-wide">
                  {content.buttonText}
                </OnestFont>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render based on step type
  const renderStep = () => {
    if (currentStep.type === 'fullscreen') {
      return renderFullscreenStep();
    }
    
    if (currentStep.type === 'highlight') {
      return renderHighlightStep();
    }
    
    return renderFullscreenStep();
  };

  // Use portal to render at document root
  return createPortal(renderStep(), document.body);
};

export default ModuleWalkthrough;