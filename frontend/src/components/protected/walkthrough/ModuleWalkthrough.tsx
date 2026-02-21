import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont } from '../../../assets';
import GameManager from '../../../game/managers/GameManager';

// Import assets
import { 
  NoticeBirdIcon,
  CoinStack,
  TreasureChest,
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
  sceneTransition?: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame';
}

interface ModuleWalkthroughProps {
  isActive: boolean;
  onExit: () => void;
  onComplete: () => void;
  onSceneTransition?: (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame') => void;
}

// ═══════════════════════════════════════════════════════════
// TRANSITION TIMING CONSTANTS
// ═══════════════════════════════════════════════════════════
const TRANSITION_TIMINGS = {
  // Walkthrough UI fade timings
  UI_FADE_OUT: 200,          // Fade out walkthrough before transition
  UI_FADE_IN: 300,           // Fade in walkthrough after transition
  
  // Scene transition timings (includes UI fade out + transition + UI fade in + buffer)
  STANDARD: 800,             // MapScene, NeighborhoodScene, HouseScene
  LESSON_VIEW: 1100,         // LessonView (200 fade + 500 slide + 300 fade + 100 buffer)
  MINIGAME: 1400,            // GrowYourNestMinigame (200 fade + 500 dismiss + 500 start + 200 buffer)
  NO_TRANSITION: 300,        // Steps without scene changes
} as const;

// Walkthrough steps
const walkthroughSteps: WalkthroughStep[] = [
  // ---- STEP 1: Welcome ----
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
  // ---- STEP 2: Earn Coins ----
  {
    id: 'earn-coins',
    type: 'fullscreen',
    content: {
      image: CoinStack,
      title: 'Complete Lessons and Minigames to Earn Nest Coins',
      description: "As you learn, you'll earn rewards! Coins can be spent in the rewards shop to redeem coupons for your favorite stores!",
      buttonText: 'CONTINUE',
    },
  },
  // ---- STEP 3: Welcome Gift ----
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
  // ---- STEP 4: Beta Thank You ----
  {
    id: 'beta-thank-you',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Thank you for testing our beta version',
      description: "Some features are still in development. Thanks for your patience—and we'd love your feedback on how we can improve as we prepare for our official launch!",
      buttonText: 'CONTINUE',
    },
  },
  // ---- STEP 5: Neighborhood Intro (highlight on MapScene) ----
  {
    id: 'neighborhood-intro',
    type: 'highlight',
    content: {
      title: 'Explore Neighborhoods',
      description: "Now let's explore where your journey begins! Each neighborhood represents a different stage of your home-buying journey. Complete all the lessons in one neighborhood to unlock the next one!",
      buttonText: 'NEXT',
    },
    highlight: {
      // Target the Phaser container
      selector: '[data-walkthrough="phaser-container"]',
      // Home-Buying Knowledge neighborhood - bottom-left of the canvas
      region: { x: 3, y: 45, width: 43, height: 40 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
  },
  // ---- STEP 5: House Intro (highlight, transitions to NeighborhoodScene) ----
  {
    id: 'house-intro',
    type: 'highlight',
    content: {
      title: 'Welcome to Your First House!',
      description: "Let's step inside this neighborhood! Each house contains lessons on a specific topic. Complete all the lessons in a house to earn bonus coins and unlock new content. The progress bar shows how much you've completed!",
      buttonText: 'GOT IT',
    },
    highlight: {
      // Target the Phaser container
      selector: '[data-walkthrough="phaser-container"]',
      // First house (Homebuying Fundamentals) - upper-left area of the neighborhood scene
      region: { x: 1, y: 15, width: 55, height: 40 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
    sceneTransition: 'NeighborhoodScene',
  },
  // ---- STEP 6: Module Welcome (fullscreen, transitions to HouseScene) ----
  {
    id: 'module-welcome',
    type: 'fullscreen',
    content: {
      title: '',
      description: "Let's take a look inside! Welcome to the first module — this is where you'll learn everything you need to buy your first home.",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'HouseScene',
  },
  // ---- STEP 7: Module Lessons (highlight lesson card in HouseScene) ----
  {
    id: 'module-lessons',
    type: 'highlight',
    content: {
      title: '',
      description: "Here are your lessons! Each one covers a key topic. You can read lessons and watch videos here.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // First lesson card - top left of house (position x:29%, y:32%)
      region: { x: 17, y: 21, width: 25, height: 18 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
  },
  // ---- STEP 8: Lesson Video/Reading Toggle (highlight, transitions to LessonView) ----
  {
    id: 'lesson-video-reading',
    type: 'highlight',
    content: {
      title: '',
      description: "Inside each lesson you can watch or read! Use this toggle to switch between watching the video or reading at your own pace.",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'LessonView',
    highlight: {
      selector: '[data-walkthrough="lesson-view-toggle"]',
    },
    tooltipPosition: 'bottom',
    highlightPadding: 8,
  },
  // ---- STEP 9: Minigame Intro — Story (transitions to GrowYourNestMinigame to show the minigame) ----
  {
    id: 'minigame-intro',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'One More Thing!',
      description: "Once you finish a lesson, it's time to help a friend! There's a little bird who needs your help — she's looking for a tree strong enough to build her nest.",
      buttonText: 'CONTINUE',
    },
    sceneTransition: 'GrowYourNestMinigame',
  },
  // ---- STEP 10: Minigame Lesson Mode (highlight RIGHT panel - start/intro screen) ----
  {
    id: 'minigame-lessons',
    type: 'highlight',
    content: {
      title: 'Play After Each Lesson',
      description: "After each lesson, you'll play a quick 3-question round to help your tree grow. Complete all the lessons and your tree unlocks free roam — where you can answer questions from every lesson to grow it even more!",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // Right panel: starts at ~52% from left, takes up ~46% width
      region: { x: 52, y: 8, width: 46, height: 88 },
    },
    tooltipPosition: 'left',
    highlightPadding: 12,
  },
  // ---- STEP 11: Minigame Streak — Fertilizer Bonus (highlight RIGHT panel - start/intro screen) ----
  {
    id: 'minigame-streak',
    type: 'highlight',
    content: {
      title: 'Build Your Streak!',
      description: "Get 3 correct in a row and earn Fertilizer for a bonus growth boost! Don't worry — mistakes won't hurt your tree, they just reset your streak.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // Right panel: starts at ~52% from left, takes up ~46% width
      region: { x: 52, y: 8, width: 46, height: 88 },
    },
    tooltipPosition: 'left',
    highlightPadding: 12,
  },
  // ---- STEP 12: Minigame Grow — Water Mechanic (highlight LEFT panel - tree area) ----
  {
    id: 'minigame-grow',
    type: 'highlight',
    content: {
      title: 'Grow Your Tree!',
      description: "Answer homebuying questions to water your tree and help it grow. Every correct answer gives your tree a splash of water!",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // Left panel: starts at ~2% from left, takes up ~48% width
      region: { x: 2, y: 8, width: 48, height: 88 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
  },
  // ---- STEP 13: Minigame Coins (highlight LEFT panel - tree area) ----
  {
    id: 'minigame-coins',
    type: 'highlight',
    content: {
      title: 'Earn Nest Coins!',
      description: "A fully grown tree earns you up to 250 Nest Coins! Spend them in the rewards shop for real-world perks and discounts.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      // Left panel: starts at ~2% from left, takes up ~48% width
      region: { x: 2, y: 8, width: 48, height: 88 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
  },
  // ---- STEP 14: Minigame CTA ----
  {
    id: 'minigame-ready',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Help Her Build a Nest!',
      description: "Help your bird build the perfect nest — one answer at a time!",
      buttonText: 'CONTINUE',
    },
  },
  // ---- STEP 15: Back to Map — Closing ----
  {
    id: 'back-to-map',
    type: 'fullscreen',
    content: {
      title: "You're All Set!",
      description: "This is your home base. Everything starts here — pick a neighborhood, choose a house, and begin your first lesson whenever you're ready!",
      buttonText: "LET'S GO",
    },
    sceneTransition: 'MapScene',
  },
];

const ModuleWalkthrough: React.FC<ModuleWalkthroughProps> = ({
  isActive,
  onComplete,
  onSceneTransition,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false); // NEW: Track scene changes specifically
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
  // PAUSES during transitions to prevent jitter/flicker
  useEffect(() => {
    if (!isActive) return;

    updateHighlightPosition();

    const handleResize = () => updateHighlightPosition();
    window.addEventListener('resize', handleResize);
    
    // Only update periodically when NOT transitioning to prevent visual artifacts
    const intervalId = setInterval(() => {
      if (!isTransitioning) {
        updateHighlightPosition();
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [isActive, currentStepIndex, isTransitioning, updateHighlightPosition]);

  // Get the appropriate transition delay based on the scene type
  const getTransitionDelay = (sceneType: string): number => {
    switch (sceneType) {
      case 'GrowYourNestMinigame':
        return TRANSITION_TIMINGS.MINIGAME;
      case 'LessonView':
        return TRANSITION_TIMINGS.LESSON_VIEW;
      case 'MapScene':
      case 'NeighborhoodScene':
      case 'HouseScene':
        return TRANSITION_TIMINGS.STANDARD;
      default:
        return TRANSITION_TIMINGS.STANDARD;
    }
  };

  // Handle next step with smooth pre/post transition fading
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
        setIsSceneTransitioning(true); // NEW: Mark as scene transition
        
        // PHASE 1: Fade out walkthrough UI (200ms)
        // The isTransitioning state causes the UI to fade out via CSS
        
        // PHASE 2: After UI fades, trigger the scene transition
        setTimeout(() => {
          onSceneTransition(nextStep.sceneTransition!);
        }, TRANSITION_TIMINGS.UI_FADE_OUT);
        
        // PHASE 3: Wait for complete transition, then advance step and fade in
        const transitionDelay = getTransitionDelay(nextStep.sceneTransition);
        
        setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
          // Keep isTransitioning true for a bit longer to let the new scene render
          setTimeout(() => {
            setIsTransitioning(false); // This triggers fade-in
            setIsSceneTransitioning(false); // NEW: Scene transition complete
          }, TRANSITION_TIMINGS.UI_FADE_IN);
        }, transitionDelay);
        
      } else {
        // No scene transition, just a simple step change
        setIsTransitioning(true);
        setIsSceneTransitioning(false); // NEW: Not a scene transition
        setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
          setIsTransitioning(false);
        }, TRANSITION_TIMINGS.NO_TRANSITION);
      }
    }
  };

  // Handle exit - always show final "You're All Set!" step before exiting
  const handleExit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const lastStepIndex = walkthroughSteps.length - 1;
    
    // If not on the last step, jump to the final step first
    if (currentStepIndex !== lastStepIndex) {
      setIsTransitioning(true);
      setIsSceneTransitioning(true); // NEW: This is a scene transition
      
      // PHASE 1: Fade out current step
      setTimeout(() => {
        // PHASE 2: Transition to MapScene (since that's where the final step is)
        if (onSceneTransition) {
          onSceneTransition('MapScene');
        }
      }, TRANSITION_TIMINGS.UI_FADE_OUT);
      
      // PHASE 3: After scene transition, jump to last step and fade in
      setTimeout(() => {
        setCurrentStepIndex(lastStepIndex);
        setTimeout(() => {
          setIsTransitioning(false);
          setIsSceneTransitioning(false); // NEW: Scene transition complete
        }, TRANSITION_TIMINGS.UI_FADE_IN);
      }, TRANSITION_TIMINGS.STANDARD);
      
    } else {
      // Already on the last step, so actually exit
      // The last step already has MapScene transition, so just complete
      onComplete();
    }
  };

  // When house-intro step is shown, trigger progress card expand on first house
  useEffect(() => {
    if (!isActive) return;
    
    if (currentStep.id === 'house-intro') {
      // Wait for scene transition to complete (800ms) + small buffer (100ms)
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
      }, 900);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStepIndex]);

  // When minigame-streak step is shown, switch minigame from start screen to question view
  useEffect(() => {
    if (!isActive) return;
    
    if (currentStep.id === 'minigame-streak') {
      // Small delay to ensure step is visible before changing minigame view
      const timer = setTimeout(() => {
        const game = GameManager.getGame();
        if (game) {
          console.log('🎯 Walkthrough: switching minigame to question view for streak step');
          
          const minigameScene = game.scene.getScene('GrowYourNestMinigame') as any;
          if (minigameScene && minigameScene.showQuestionsForWalkthrough) {
            minigameScene.showQuestionsForWalkthrough();
          } else {
            console.error('❌ GrowYourNestMinigame or showQuestionsForWalkthrough method not found!');
          }
        }
      }, 400);
      
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
            setIsSceneTransitioning(true); // NEW: Mark as scene transition
            
            // Fade out UI first
            setTimeout(() => {
              onSceneTransition(nextStep.sceneTransition!);
            }, TRANSITION_TIMINGS.UI_FADE_OUT);
            
            const transitionDelay = getTransitionDelay(nextStep.sceneTransition);
            
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
              setTimeout(() => {
                setIsTransitioning(false);
                setIsSceneTransitioning(false); // NEW: Scene transition complete
              }, TRANSITION_TIMINGS.UI_FADE_IN);
            }, transitionDelay);
            
          } else {
            setIsTransitioning(true);
            setIsSceneTransitioning(false); // NEW: Not a scene transition
            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
              setIsTransitioning(false);
            }, TRANSITION_TIMINGS.NO_TRANSITION);
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
          className="text-base text-pure-white/90"
        >
          <span className="text-logo-yellow font-bold">200 coins</span> have been added to your balance. Get started on your home-buying journey and earn more!
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
        {/* Dark overlay behind modal - Fades ONLY during scene transitions */}
        <div 
          className={`absolute inset-0 bg-text-blue-black/60 transition-opacity duration-200 ${
            isSceneTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={(e) => {
            blockEvent(e);
            handleExit(e);
          }}
          onMouseDown={blockEvent}
          onMouseUp={blockEvent}
        />

        {/* Modal container with LinearBlue1 gradient - balanced sizing for all steps */}
        <div 
          className={`relative w-full ${
            currentStep.content.image ? 'max-w-xl' : 'max-w-md'
          } rounded-3xl overflow-hidden shadow-2xl transition-all duration-200 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            background: 'linear-gradient(137deg, #1D3CC6 6.84%, #837CFF 97.24%)',
          }}
          onClick={blockEvent}
          onMouseDown={blockEvent}
        >
          {/* Exit button - Fades ONLY during scene transitions */}
          <button
            onClick={handleExit}
            onMouseDown={blockEvent}
            className={`absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-pure-white/20 hover:bg-pure-white/30 transition-all duration-200 flex items-center justify-center ${
              isSceneTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
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

          {/* Content - centered for image steps, compact for text-only */}
          <div className={`flex flex-col items-center text-center ${
            currentStep.content.image 
              ? 'justify-center px-10 py-12' 
              : 'px-8 py-12'
          }`}>
            {renderStepImage()}

            {/* Title */}
            {content.title && (
              <OnestFont 
                as="h2" 
                weight={700} 
                lineHeight="tight" 
                className={`${
                  currentStep.content.image ? 'text-3xl' : 'text-2xl'
                } text-pure-white mb-4`}
              >
                {content.title}
              </OnestFont>
            )}

            {/* Description */}
            <OnestFont 
              weight={300} 
              lineHeight="relaxed" 
              className="text-base text-pure-white/90 mb-8"
            >
              {renderDescription(content.description)}
            </OnestFont>

            {/* Button */}
            <button
              onClick={handleNext}
              onMouseDown={blockEvent}
              className="px-10 py-3 bg-pure-white rounded-full text-elegant-blue hover:bg-text-white transition-colors shadow-lg"
            >
              <OnestFont weight={700} lineHeight="relaxed" className="text-base tracking-wide">
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
        {/* Dark overlay with cutout for highlighted area - Fades ONLY during scene transitions */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
          isSceneTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
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

        {/* Exit button - Fades ONLY during scene transitions */}
        <button
          onClick={handleExit}
          onMouseDown={blockEvent}
          className={`absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-pure-white/20 hover:bg-pure-white/30 transition-all duration-200 flex items-center justify-center ${
            isSceneTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
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

        {/* Tooltip - ALWAYS fades during any transition */}
        <div
          className={`absolute z-20 w-[400px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
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
                <OnestFont weight={700} lineHeight="relaxed" className="text-base tracking-wide">
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