import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont, NoticeBirdIcon } from '../../../assets';
import GameManager from '../../../game/managers/GameManager';
import { WalkthroughStep } from './walkthroughSegments';

// Bird sizing constants
const BIRD_SIZE = 80;
const BIRD_FLY_DURATION = 800; // ms

interface ModuleWalkthroughProps {
  isActive: boolean;
  segmentId: string;
  steps: WalkthroughStep[];
  onExit: () => void;
  onComplete: () => void;
  onSceneTransition?: (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame') => void;
  currentNavView?: string;
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

const ModuleWalkthrough: React.FC<ModuleWalkthroughProps> = ({
  isActive,
  segmentId,
  steps,
  onExit,
  onComplete,
  onSceneTransition,
  currentNavView,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Bird guide state
  const [birdPos, setBirdPos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
  const [birdFlying, setBirdFlying] = useState(false);
  const [birdFlip, setBirdFlip] = useState(false);
  const [birdVisible, setBirdVisible] = useState(true);
  const prevStepRef = useRef(currentStepIndex);
  const birdFlyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  // When walkthrough becomes active, immediately transition to the first step's scene
  useEffect(() => {
    if (isActive && onSceneTransition) {
      const firstStep = steps[0];
      if (firstStep.sceneTransition) {
        onSceneTransition(firstStep.sceneTransition);
      }
    }
  }, [isActive, onSceneTransition]);

  // Calculate highlight position for highlight-type and interactive-type steps
  const updateHighlightPosition = useCallback(() => {
    if ((currentStep.type !== 'highlight' && currentStep.type !== 'interactive') || !currentStep.highlight) {
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
      const nextStep = steps[currentStepIndex + 1];
      
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

  // Handle exit - dismiss the current segment immediately
  const handleExit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onExit();
  };

  // When click-house step is shown, trigger progress card expand on first house
  useEffect(() => {
    if (!isActive) return;
    
    if (currentStep.id === 'click-house') {
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

  // Auto-advance for interactive steps when navState matches
  useEffect(() => {
    if (!isActive || currentStep.type !== 'interactive' || !currentStep.advanceOnNavState) return;

    if (currentNavView === currentStep.advanceOnNavState) {
      const delay = currentStep.advanceDelay || 0;
      const timer = setTimeout(() => {
        if (isLastStep) {
          // Last step of this segment — complete it
          onComplete();
        } else {
          setIsTransitioning(true);
          setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
            setIsTransitioning(false);
          }, TRANSITION_TIMINGS.NO_TRANSITION);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentNavView, currentStep, isLastStep, onComplete]);

  // Block all keyboard events from reaching Phaser when walkthrough is active
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();

      if (e.key === 'Escape') {
        handleExit();
      } else if (e.key === 'Enter') {
        // Don't allow Enter to advance interactive steps — user must click the target
        if (currentStep.type === 'interactive') return;

        if (isLastStep) {
          onComplete();
        } else {
          const nextStep = steps[currentStepIndex + 1];

          // Check if the next step requires a scene transition
          if (nextStep?.sceneTransition && onSceneTransition) {
            setIsTransitioning(true);
            setIsSceneTransitioning(true);

            // Fade out UI first
            setTimeout(() => {
              onSceneTransition(nextStep.sceneTransition!);
            }, TRANSITION_TIMINGS.UI_FADE_OUT);

            const transitionDelay = getTransitionDelay(nextStep.sceneTransition);

            setTimeout(() => {
              setCurrentStepIndex((prev) => prev + 1);
              setTimeout(() => {
                setIsTransitioning(false);
                setIsSceneTransitioning(false);
              }, TRANSITION_TIMINGS.UI_FADE_IN);
            }, transitionDelay);

          } else {
            setIsTransitioning(true);
            setIsSceneTransitioning(false);
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
  }, [isActive, currentStepIndex, isLastStep, onComplete, onSceneTransition, currentStep.type]);

  // Reset step index when walkthrough becomes inactive or segment changes
  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(0);
    }
  }, [isActive]);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [segmentId]);

  // ═══════════════════════════════════════════════════════════
  // BIRD POSITION CALCULATION — flies to target on step change
  // ═══════════════════════════════════════════════════════════
  const calculateBirdPosition = useCallback((step: WalkthroughStep, rect: DOMRect | null): { x: number; y: number } => {
    // For fullscreen steps or when no highlight rect: center above viewport middle
    if (step.type === 'fullscreen' || !rect || !step.birdPosition) {
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.25 };
    }

    const offset = step.birdPosition.offset ?? 10;
    const birdHalf = BIRD_SIZE / 2;

    switch (step.birdPosition.side) {
      case 'right':
        return {
          x: rect.right + birdHalf + offset,
          y: rect.top + birdHalf,
        };
      case 'left':
        return {
          x: rect.left - birdHalf - offset,
          y: rect.top + birdHalf,
        };
      case 'top':
        return {
          x: rect.left + rect.width / 2,
          y: rect.top - birdHalf - offset,
        };
      case 'bottom':
        return {
          x: rect.left + rect.width / 2,
          y: rect.bottom + birdHalf + offset,
        };
      default:
        return { x: rect.right + birdHalf + offset, y: rect.top + birdHalf };
    }
  }, []);

  // Trigger bird flight when step changes or highlight rect updates
  useEffect(() => {
    if (!isActive) return;

    const newPos = calculateBirdPosition(currentStep, highlightRect);

    // Detect step change to trigger flight animation
    if (prevStepRef.current !== currentStepIndex) {
      prevStepRef.current = currentStepIndex;

      // Check if position actually changed — skip flight if staying in same place
      const samePosition =
        Math.abs(newPos.x - birdPos.x) < 5 && Math.abs(newPos.y - birdPos.y) < 5;

      if (samePosition) {
        // Just update position without flying
        setBirdPos(newPos);
      } else {
        // Determine flight direction
        setBirdFlip(newPos.x < birdPos.x);

        // Start flying
        setBirdFlying(true);
        setBirdPos(newPos);

        // Clear any existing timer
        if (birdFlyTimerRef.current) clearTimeout(birdFlyTimerRef.current);

        // End flight after animation completes
        birdFlyTimerRef.current = setTimeout(() => {
          setBirdFlying(false);
          // After landing, face toward the target (face right = default)
          if (currentStep.birdPosition?.side === 'right') setBirdFlip(true);
          else if (currentStep.birdPosition?.side === 'left') setBirdFlip(false);
        }, BIRD_FLY_DURATION);
      }
    } else {
      // Same step, just rect updated — reposition without animation
      setBirdPos(newPos);
    }

    return () => {
      if (birdFlyTimerRef.current) clearTimeout(birdFlyTimerRef.current);
    };
  }, [isActive, currentStepIndex, highlightRect, currentStep, calculateBirdPosition]);

  // Hide bird during scene transitions, show after
  useEffect(() => {
    setBirdVisible(!isSceneTransitioning);
  }, [isSceneTransitioning]);

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
            background: 'linear-gradient(180deg, #1D3CC6 0%, #837CFF 100%)',
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

  // Render highlight step (bird guides eye, no dark overlay)
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
        {/* Exit button */}
        <button
          onClick={handleExit}
          onMouseDown={blockEvent}
          className={`absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-text-blue-black/40 hover:bg-text-blue-black/60 transition-all duration-200 flex items-center justify-center ${
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

        {/* Tooltip */}
        <div
          className={`absolute z-20 w-[400px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...getTooltipStyle(),
            background: 'linear-gradient(180deg, #1D3CC6 0%, #837CFF 100%)',
          }}
          onClick={blockEvent}
          onMouseDown={blockEvent}
        >
          <div className="p-6">
            <OnestFont
              as="h2"
              weight={700}
              lineHeight="tight"
              className="text-2xl text-pure-white mb-3"
            >
              {content.title}
            </OnestFont>

            <OnestFont
              weight={300}
              lineHeight="relaxed"
              className="text-base text-pure-white/90"
            >
              {content.description}
            </OnestFont>

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

  // Render interactive step (bird guides eye, no dark overlay, clicks pass through to target)
  const renderInteractiveStep = () => {
    const { content } = currentStep;
    const padding = currentStep.highlightPadding || 16;

    // Calculate tooltip position (same logic as renderHighlightStep)
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
        style={{ pointerEvents: 'none' }}
      >
        {/* Invisible blocker divs — block clicks OUTSIDE the target region */}
        {highlightRect && (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: highlightRect.top - padding,
              pointerEvents: 'all',
            }} />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              top: highlightRect.bottom + padding,
              pointerEvents: 'all',
            }} />
            <div style={{
              position: 'absolute', top: highlightRect.top - padding, left: 0,
              width: highlightRect.left - padding,
              height: highlightRect.height + padding * 2,
              pointerEvents: 'all',
            }} />
            <div style={{
              position: 'absolute', top: highlightRect.top - padding,
              left: highlightRect.right + padding, right: 0,
              height: highlightRect.height + padding * 2,
              pointerEvents: 'all',
            }} />
          </>
        )}

        {/* Exit button */}
        <button
          onClick={handleExit}
          onMouseDown={blockEvent}
          className={`absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-text-blue-black/40 hover:bg-text-blue-black/60 transition-all duration-200 flex items-center justify-center ${
            isSceneTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ pointerEvents: 'all' }}
          aria-label="Exit walkthrough"
        >
          <svg className="w-5 h-5 text-pure-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tooltip — NO button, instruction only */}
        <div
          className={`absolute z-20 w-[400px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-200 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...getTooltipStyle(),
            background: 'linear-gradient(180deg, #1D3CC6 0%, #837CFF 100%)',
            pointerEvents: 'all',
          }}
        >
          <div className="p-6">
            <OnestFont as="h2" weight={700} lineHeight="tight" className="text-2xl text-pure-white mb-3">
              {content.title}
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-base text-pure-white/90">
              {content.description}
            </OnestFont>
            {/* Small hint text */}
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-pure-white rounded-full animate-pulse" />
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-pure-white/60 italic">
                Click the highlighted area to continue
              </OnestFont>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the bird guide character
  const renderBird = () => {
    return (
      <img
        src={NoticeBirdIcon}
        alt=""
        className="fixed z-[10000] pointer-events-none select-none"
        style={{
          width: BIRD_SIZE,
          height: 'auto',
          left: birdPos.x,
          top: birdPos.y,
          transform: `translate(-50%, -50%) scaleX(${birdFlip ? -1 : 1})`,
          transition: birdFlying
            ? `left ${BIRD_FLY_DURATION}ms ease-in-out, top ${BIRD_FLY_DURATION}ms ease-in-out`
            : 'none',
          opacity: birdVisible && !isTransitioning ? 1 : 0,
          animation: !birdFlying && birdVisible ? 'birdFloat 2s ease-in-out infinite' : 'none',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
        }}
      />
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

    if (currentStep.type === 'interactive') {
      return renderInteractiveStep();
    }

    return renderFullscreenStep();
  };

  // Use portal to render at document root
  return createPortal(
    <>
      {/* Bird floating animation keyframe */}
      <style>{`
        @keyframes birdFloat {
          0%, 100% { transform: translate(-50%, -50%) scaleX(${birdFlip ? -1 : 1}) translateY(0); }
          50% { transform: translate(-50%, -50%) scaleX(${birdFlip ? -1 : 1}) translateY(-8px); }
        }
      `}</style>
      {renderStep()}
      {renderBird()}
    </>,
    document.body
  );
};

export default ModuleWalkthrough;