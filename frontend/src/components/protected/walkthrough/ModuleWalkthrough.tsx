import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { OnestFont, NoticeBirdIcon } from '../../../assets';
import GameManager from '../../../game/managers/GameManager';
import CloseButton from '../../common/CloseButton';
import { WalkthroughStep } from './walkthroughSegments';
import { useSidebar } from '../../../contexts/SidebarContext';

// Bird sizing constants
const BIRD_SIZE = 120;
const BIRD_FLY_DURATION = 800; // ms

interface ModuleWalkthroughProps {
  isActive: boolean;
  segmentId: string;
  segmentNavState?: string;
  steps: WalkthroughStep[];
  onExit: () => void;
  onComplete: () => void;
  /** Hide walkthrough temporarily without marking complete — re-triggers on return */
  onSuspend?: () => void;
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
  segmentNavState,
  steps,
  onExit,
  onComplete,
  onSuspend,
  onSceneTransition,
  currentNavView,
}) => {
  // Sidebar-aware layout: overlays and modals only cover the content area, not the sidebar
  const { isCollapsed } = useSidebar();
  // Match MainLayout padding: pl-48 (192px) when expanded, pl-20 (80px) when collapsed
  const contentLeftOffset = isCollapsed ? 80 : 192;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSceneTransitioning, setIsSceneTransitioning] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Bird guide state
  const [birdPos, setBirdPos] = useState<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
  const [birdFlying, setBirdFlying] = useState(false);
  const [birdFlip, setBirdFlip] = useState(() => steps[0]?.birdPosition?.flip ?? false);
  const [birdVisible, setBirdVisible] = useState(true);
  const [birdPositionReady, setBirdPositionReady] = useState(true);
  const birdFlyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const birdSpacerRef = useRef<HTMLDivElement | null>(null);
  const birdFloatRafRef = useRef<number | null>(null);
  const birdImgRef = useRef<HTMLImageElement | null>(null);

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
          setHighlightRect(null); // Clear stale rect from previous step's element
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
          setHighlightRect(null); // Clear stale rect from previous step's element
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

  // When minigame-lessons step is shown, switch minigame from start screen to question view
  useEffect(() => {
    if (!isActive) return;

    if (currentStep.id === 'minigame-lessons') {
      // Small delay to ensure step is visible before changing minigame view
      const timer = setTimeout(() => {
        const game = GameManager.getGame();
        if (game) {
          console.log('🎯 Walkthrough: switching minigame to question view for lessons step');

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
      // Immediately hide the walkthrough UI and bird as the scene begins transitioning
      setIsTransitioning(true);
      setIsSceneTransitioning(true);
      setBirdPositionReady(false); // Hide bird until new step's position is calculated

      const delay = currentStep.advanceDelay || 0;
      const timer = setTimeout(() => {
        if (isLastStep) {
          // Last step of this segment — complete it
          onComplete();
        } else {
          setCurrentStepIndex(prev => prev + 1);
          setHighlightRect(null); // Clear stale rect from previous step's element
          // Keep transitioning state briefly for the new step to settle
          setTimeout(() => {
            setIsTransitioning(false);
            setIsSceneTransitioning(false);
          }, TRANSITION_TIMINGS.UI_FADE_IN);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentNavView, currentStep, isLastStep, onComplete]);

  // Build a set of all nav states that are valid for this segment's lifetime.
  // This includes the segment's trigger state plus any advanceOnNavState from all steps.
  // Computed once per segment (steps array is stable per segment).
  const validNavStates = useMemo(() => {
    const valid = new Set<string>();
    if (segmentNavState) valid.add(segmentNavState);
    for (const step of steps) {
      if (step.advanceOnNavState) valid.add(step.advanceOnNavState);
    }
    return valid;
  }, [segmentNavState, steps]);

  // Suspend walkthrough if the user navigates away from any scene this segment covers
  // (e.g. pressing back from NeighborhoodScene to MapScene while neighborhood-intro is active).
  // Uses onSuspend (not onExit) so the segment is NOT marked complete — it will
  // re-trigger automatically when the user returns to the correct scene.
  useEffect(() => {
    if (!isActive || !segmentNavState || !currentNavView) return;

    if (!validNavStates.has(currentNavView)) {
      console.log(`🌳 [ModuleWalkthrough] Nav mismatch — currentNavView='${currentNavView}' not in validStates=[${[...validNavStates].join(',')}] for segment '${segmentId}'. Suspending.`);
      if (onSuspend) {
        onSuspend();
      } else {
        onExit();
      }
    }
  }, [isActive, currentNavView, segmentNavState, segmentId, validNavStates, onExit, onSuspend]);

  // Block all keyboard events from reaching Phaser when walkthrough is active
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();

      if (e.key === 'Escape') {
        // Don't allow Escape to exit during first 4 MapScene slides
        if (!(segmentId === 'map-intro' && currentStepIndex < 4)) {
          handleExit();
        }
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
              setHighlightRect(null);
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
              setHighlightRect(null);
              setIsTransitioning(false);
            }, TRANSITION_TIMINGS.NO_TRANSITION);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isActive, currentStepIndex, isLastStep, onComplete, onSceneTransition, currentStep.type]);

  // Reset step index only when segment changes (not when temporarily navigating away)
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [segmentId]);

  // ═══════════════════════════════════════════════════════════
  // BIRD POSITION CALCULATION — flies to target on step change
  // ═══════════════════════════════════════════════════════════
  const calculateBirdPosition = useCallback((step: WalkthroughStep, rect: DOMRect | null, stepIndex?: number): { x: number; y: number } => {
    // Content area center (excluding sidebar)
    const contentCenterX = contentLeftOffset + (window.innerWidth - contentLeftOffset) / 2;

    // For fullscreen steps: position bird at the spacer location if available,
    // otherwise position to the left of the modal for map-intro non-bird steps
    if (step.type === 'fullscreen' || !rect || !step.birdPosition) {
      if (birdSpacerRef.current) {
        const spacerRect = birdSpacerRef.current.getBoundingClientRect();
        return {
          x: spacerRect.left + spacerRect.width / 2,
          y: spacerRect.top + spacerRect.height / 2,
        };
      }
      // For map-intro steps without a bird spacer (earn-coins, welcome-gift),
      // position the bird to the left of the modal so it flies left, not up
      if (segmentId === 'map-intro' && stepIndex !== undefined && stepIndex >= 1 && stepIndex <= 2) {
        // Move half the distance from content center to the modal left edge
        const contentAreaWidth = window.innerWidth - contentLeftOffset;
        const modalLeftEdge = contentLeftOffset + contentAreaWidth / 2 - 288;
        return {
          x: contentCenterX - (contentCenterX - modalLeftEdge) / 2,
          y: window.innerHeight * 0.35,
        };
      }
      return { x: contentCenterX, y: window.innerHeight * 0.25 };
    }

    const offset = step.birdPosition.offset ?? 10;
    const birdHalf = BIRD_SIZE / 2;
    const tooltipWidth = 400;
    const tooltipOffset = 24;
    const highlightPad = step.highlightPadding || 16;

    // Check if the bird and tooltip are on the same side — if so, push bird past the tooltip
    const tooltipSide = step.tooltipPosition || 'bottom';
    const birdSide = step.birdPosition.side;

    const vOffset = step.birdPosition.verticalOffset ?? 0;

    switch (birdSide) {
      case 'right': {
        // If tooltip is also on the right, position bird past the tooltip
        const baseX = tooltipSide === 'right'
          ? rect.right + highlightPad + tooltipOffset + tooltipWidth + birdHalf + offset
          : rect.right + birdHalf + offset;
        return {
          x: Math.min(baseX, window.innerWidth - birdHalf - 8),
          y: rect.top + birdHalf + vOffset,
        };
      }
      case 'left': {
        const baseX = tooltipSide === 'left'
          ? rect.left - highlightPad - tooltipOffset - tooltipWidth - birdHalf - offset
          : rect.left - birdHalf - offset;
        return {
          x: Math.max(baseX, birdHalf + 8),
          y: rect.top + birdHalf + vOffset,
        };
      }
      case 'top': {
        const baseY = tooltipSide === 'top'
          ? rect.top - highlightPad - tooltipOffset - 200 - birdHalf - offset
          : rect.top - birdHalf - offset;
        // When tooltip is to the right or left, center the bird above the tooltip
        // rather than above the highlight, so it appears directly above the modal.
        let topX = rect.left + rect.width / 2;
        if (tooltipSide === 'right') {
          topX = rect.right + highlightPad + tooltipOffset + tooltipWidth / 2;
        } else if (tooltipSide === 'left') {
          topX = rect.left - highlightPad - tooltipOffset - tooltipWidth / 2;
        }
        return {
          x: Math.min(Math.max(topX, birdHalf + 8), window.innerWidth - birdHalf - 8),
          y: Math.max(baseY + vOffset, birdHalf + 8),
        };
      }
      case 'bottom': {
        const baseY = tooltipSide === 'bottom'
          ? rect.bottom + highlightPad + tooltipOffset + 200 + birdHalf + offset
          : rect.bottom + birdHalf + offset;
        return {
          x: rect.left + rect.width / 2,
          y: Math.min(baseY + vOffset, window.innerHeight - birdHalf - 8),
        };
      }
      default:
        return { x: rect.right + birdHalf + offset, y: rect.top + birdHalf + vOffset };
    }
  }, [segmentId, contentLeftOffset]);

  // Track which step index has already had its flight triggered, so we don't re-fly
  // on every highlightRect update, but DO fly once the rect is available.
  // Initialised to 0 so the very first step never triggers a flight — the bird simply
  // appears in place with its float animation instead of flying from off-screen.
  const birdFlownForStepRef = useRef<number>(0);

  // Trigger bird flight when step changes AND highlight rect is ready.
  // For fullscreen steps (no highlight needed), fires immediately on step change.
  // For highlight/interactive steps, waits until highlightRect is non-null.
  // The fly-end timer is stored in birdFlyTimerRef and is NOT cleaned up by this
  // effect's cleanup — only cleared when a NEW flight starts or on unmount.
  useEffect(() => {
    if (!isActive) return;

    // If we already flew for this step, just reposition without flight on rect updates
    if (birdFlownForStepRef.current === currentStepIndex) {
      if (!birdFlying) {
        const newPos = calculateBirdPosition(currentStep, highlightRect, currentStepIndex);
        setBirdPos(newPos);
      }
      return;
    }

    // For non-fullscreen steps that need a highlight rect, wait until it's available
    const needsRect = currentStep.type !== 'fullscreen' && currentStep.birdPosition;
    if (needsRect && !highlightRect) return;

    // Mark this step as flown
    birdFlownForStepRef.current = currentStepIndex;

    const newPos = calculateBirdPosition(currentStep, highlightRect, currentStepIndex);
    const isMapIntro = segmentId === 'map-intro' && currentStepIndex < 4;

    // Always apply explicit flip setting from the step config, even without flight
    if (!isMapIntro && currentStep.birdPosition?.flip !== undefined) {
      setBirdFlip(currentStep.birdPosition.flip);
    }

    // If the bird position wasn't ready (coming from a scene transition / auto-advance),
    // skip flight animation — just place the bird at the correct position and fade in.
    // This prevents the bird from flashing at the old position before flying.
    if (!birdPositionReady) {
      // Apply flip for the new step
      if (!isMapIntro) {
        if (currentStep.birdPosition?.flip !== undefined) {
          setBirdFlip(currentStep.birdPosition.flip);
        } else if (currentStep.birdPosition?.side === 'right') {
          setBirdFlip(true);
        } else if (currentStep.birdPosition?.side === 'left') {
          setBirdFlip(false);
        }
      }
      setBirdPos(newPos);
      // Wait a frame for position to commit, then reveal
      requestAnimationFrame(() => {
        setBirdPositionReady(true);
      });
      return;
    }

    // Check if position actually changed — skip flight if staying in same place
    const samePosition =
      Math.abs(newPos.x - birdPos.x) < 5 && Math.abs(newPos.y - birdPos.y) < 5;

    if (samePosition) {
      setBirdPos(newPos);
    } else {
      // Determine flight direction — don't flip during map-intro steps
      if (!isMapIntro) {
        if (currentStep.birdPosition?.flip !== undefined) {
          setBirdFlip(currentStep.birdPosition.flip);
        } else if (currentStep.birdPosition?.side === 'right') {
          setBirdFlip(true);
        } else if (currentStep.birdPosition?.side === 'left') {
          setBirdFlip(false);
        } else {
          setBirdFlip(newPos.x < birdPos.x);
        }
      }

      // Start flying
      setBirdFlying(true);
      setBirdPos(newPos);

      // Clear any existing fly-end timer before starting a new one
      if (birdFlyTimerRef.current) clearTimeout(birdFlyTimerRef.current);

      // End flight after animation completes
      birdFlyTimerRef.current = setTimeout(() => {
        setBirdFlying(false);
        if (!isMapIntro) {
          if (currentStep.birdPosition?.flip !== undefined) {
            setBirdFlip(currentStep.birdPosition.flip);
          } else if (currentStep.birdPosition?.side === 'right') setBirdFlip(true);
          else if (currentStep.birdPosition?.side === 'left') setBirdFlip(false);
        }
      }, BIRD_FLY_DURATION);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStepIndex, highlightRect]);

  // Clean up fly timer on unmount only
  useEffect(() => {
    return () => {
      if (birdFlyTimerRef.current) clearTimeout(birdFlyTimerRef.current);
    };
  }, []);

  // Hide bird during scene transitions, show after
  useEffect(() => {
    setBirdVisible(!isSceneTransitioning);
  }, [isSceneTransitioning]);

  // Recalculate bird position after render when spacer ref becomes available
  useEffect(() => {
    if (!isActive) return;
    // Use requestAnimationFrame to wait for the DOM to paint so the ref is set
    const raf = requestAnimationFrame(() => {
      if (birdSpacerRef.current) {
        const newPos = calculateBirdPosition(currentStep, highlightRect, currentStepIndex);
        setBirdPos(newPos);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isActive, currentStepIndex]);

  // JS-driven bird float animation — directly mutates the DOM to avoid React re-render overhead
  useEffect(() => {
    if (!isActive) return;

    let startTime: number | null = null;
    const FLOAT_AMPLITUDE = 8; // pixels
    const FLOAT_PERIOD = 2000; // ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const el = birdImgRef.current;
      if (el) {
        const elapsed = timestamp - startTime;
        const offset = Math.sin((elapsed / FLOAT_PERIOD) * Math.PI * 2) * FLOAT_AMPLITUDE;
        // Read the current scaleX from the data attribute (set by React render)
        const scaleX = el.dataset.scaleX || '1';
        const isFlying = el.dataset.flying === 'true';
        // Always set transform from RAF to prevent React re-renders from wiping it.
        // During flight, apply only the scale (no float offset) so CSS transition handles position.
        // When idle, apply both scale and float offset for the hover animation.
        el.style.transform = isFlying
          ? `scaleX(${scaleX})`
          : `scaleX(${scaleX}) translateY(${offset}px)`;
      }
      birdFloatRafRef.current = requestAnimationFrame(animate);
    };

    birdFloatRafRef.current = requestAnimationFrame(animate);

    return () => {
      if (birdFloatRafRef.current) {
        cancelAnimationFrame(birdFloatRafRef.current);
      }
    };
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
          <span className="text-logo-yellow font-bold">200 coins</span> have been added to your balance. Start learning and earn more.
        </OnestFont>
      );
    }
    
    return description;
  };

  // For the first 4 map-intro steps, the bird should always be the floating guide bird
  // (never rendered inside the card) so it stays visible during step transitions.
  const isMapIntroStep = segmentId === 'map-intro' && currentStepIndex < 4;

  // Check if the current step's content image is the bird (to avoid duplicate birds)
  // During map-intro steps, we always use the floating bird, so treat the card bird as present
  // to prevent showing both.
  const stepHasBirdImage = currentStep.content.image === NoticeBirdIcon;

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
      const isBird = content.image === NoticeBirdIcon;

      // During map-intro steps, don't render the bird in the card — use a spacer instead
      // so the floating bird is the only one on screen and persists across transitions.
      if (isBird && isMapIntroStep) {
        return <div ref={birdSpacerRef} className="mb-8 w-32 h-32" />;
      }

      return (
        <div className="mb-8">
          <img
            src={content.image}
            alt=""
            className="w-32 h-32 object-contain"
            style={isBird ? {
              animation: 'cardBirdFloat 2s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
            } : undefined}
          />
        </div>
      );
    }

    return null;
  };

  // Hide close button on all walkthrough steps — the walkthrough should be
  // completed in full without the option to dismiss early.
  const shouldHideCloseButton = true;

  // Render fullscreen modal step
  const renderFullscreenStep = () => {
    const { content } = currentStep;

    return (
      <div
        className="fixed top-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4"
        onClick={blockEvent}
        onMouseDown={blockEvent}
        onMouseUp={blockEvent}
        onTouchStart={blockEvent}
        onTouchEnd={blockEvent}
        style={{ pointerEvents: 'all', left: contentLeftOffset }}
      >
        {/* Dark overlay behind modal - Fades ONLY during scene transitions */}
        <div
          className={`absolute inset-0 bg-text-blue-black/60 transition-opacity duration-200 ${
            isSceneTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={(e) => {
            blockEvent(e);
            if (!shouldHideCloseButton) handleExit(e);
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
          {/* Exit button - Hidden for first 4 MapScene slides, fades during scene transitions */}
          {!shouldHideCloseButton && (
            <CloseButton
              onClick={handleExit}
              className={`absolute top-4 right-4 z-10 transition-all duration-200 ${
                isSceneTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              ariaLabel="Exit walkthrough"
              size={20}
            />
          )}

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

      // Adjust left values for container offset (container starts at contentLeftOffset)
      const adjHLeft = highlightRect.left - contentLeftOffset;
      const adjHRight = highlightRect.right - contentLeftOffset;
      const containerWidth = window.innerWidth - contentLeftOffset;

      switch (currentStep.tooltipPosition) {
        case 'top':
          bottom = window.innerHeight - highlightRect.top + padding + offset;
          left = adjHLeft + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = highlightRect.bottom + padding + offset;
          left = adjHLeft + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          right = containerWidth - adjHLeft + padding + offset;
          break;
        case 'right':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          left = adjHRight + padding + offset;
          break;
        default:
          top = highlightRect.bottom + padding + offset;
          left = adjHLeft + highlightRect.width / 2 - tooltipWidth / 2;
      }

      // Clamp to content area bounds
      if (left !== undefined) {
        left = Math.max(viewportPadding, Math.min(left, containerWidth - tooltipWidth - viewportPadding));
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
        className="fixed top-0 right-0 bottom-0 z-[9999]"
        onClick={blockEvent}
        onMouseDown={blockEvent}
        onMouseUp={blockEvent}
        onTouchStart={blockEvent}
        onTouchEnd={blockEvent}
        style={{ pointerEvents: 'all', left: contentLeftOffset }}
      >
        {/* Tooltip */}
        <div
          className={`absolute z-20 w-[400px] rounded-2xl overflow-hidden shadow-2xl ${
            isSceneTransitioning ? '' : 'transition-all duration-200'
          } ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...getTooltipStyle(),
            background: 'linear-gradient(180deg, #1D3CC6 0%, #837CFF 100%)',
          }}
          onClick={blockEvent}
          onMouseDown={blockEvent}
        >
          {/* Exit button */}
          {!shouldHideCloseButton && !currentStep.hideCloseButton && (
            <CloseButton
              onClick={handleExit}
              className={`absolute top-4 right-4 z-20 transition-all duration-200 ${
                isSceneTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              ariaLabel="Exit walkthrough"
              size={20}
            />
          )}
          <div className="p-6">
            {content.title ? (
              <>
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
              </>
            ) : (
              <OnestFont
                weight={300}
                lineHeight="relaxed"
                className="text-base text-pure-white/90"
                style={{ whiteSpace: 'pre-line' }}
              >
                {content.description}
              </OnestFont>
            )}

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

      // Adjust left values for container offset (container starts at contentLeftOffset)
      const adjILeft = highlightRect.left - contentLeftOffset;
      const adjIRight = highlightRect.right - contentLeftOffset;
      const iContainerWidth = window.innerWidth - contentLeftOffset;

      switch (currentStep.tooltipPosition) {
        case 'top':
          bottom = window.innerHeight - highlightRect.top + padding + offset;
          left = adjILeft + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = highlightRect.bottom + padding + offset;
          left = adjILeft + highlightRect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          right = iContainerWidth - adjILeft + padding + offset;
          break;
        case 'right':
          top = highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2;
          left = adjIRight + padding + offset;
          break;
        default:
          top = highlightRect.bottom + padding + offset;
          left = adjILeft + highlightRect.width / 2 - tooltipWidth / 2;
      }

      // Clamp to content area bounds
      if (left !== undefined) {
        left = Math.max(viewportPadding, Math.min(left, iContainerWidth - tooltipWidth - viewportPadding));
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
        className="fixed top-0 right-0 bottom-0 z-[9999]"
        style={{ pointerEvents: 'none', left: contentLeftOffset }}
      >
        {/* Invisible blocker divs — block clicks OUTSIDE the target region */}
        {/* Coordinates adjusted for container starting at contentLeftOffset */}
        {highlightRect && (() => {
          const adjLeft = highlightRect.left - contentLeftOffset;
          const adjRight = highlightRect.right - contentLeftOffset;
          return (
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
                width: Math.max(0, adjLeft - padding),
                height: highlightRect.height + padding * 2,
                pointerEvents: 'all',
              }} />
              <div style={{
                position: 'absolute', top: highlightRect.top - padding,
                left: adjRight + padding, right: 0,
                height: highlightRect.height + padding * 2,
                pointerEvents: 'all',
              }} />
            </>
          );
        })()}

        {/* Tooltip — NO button, instruction only */}
        <div
          className={`absolute z-20 ${content.title ? 'w-[400px]' : 'w-auto max-w-[400px]'} rounded-2xl overflow-hidden shadow-2xl ${
            isSceneTransitioning ? '' : 'transition-all duration-200'
          } ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            ...getTooltipStyle(),
            background: 'linear-gradient(180deg, #1D3CC6 0%, #837CFF 100%)',
            pointerEvents: isSceneTransitioning ? 'none' : 'all',
          }}
        >
          {content.title ? (
            <>
              {/* Exit button — absolute for full layout, hidden if step opts out */}
              {!shouldHideCloseButton && !currentStep.hideCloseButton && (
                <CloseButton
                  onClick={handleExit}
                  className={`absolute top-4 right-4 z-20 transition-all duration-200 ${
                    isSceneTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ pointerEvents: 'all' }}
                  ariaLabel="Exit walkthrough"
                  size={20}
                />
              )}
              <div className="p-6">
                <OnestFont as="h2" weight={700} lineHeight="tight" className="text-2xl text-pure-white mb-3">
                  {content.title}
                </OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-base text-pure-white/90">
                  {content.description}
                </OnestFont>
                {/* Hint text */}
                {currentStep.hintText && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-pure-white rounded-full animate-pulse" />
                    <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-pure-white/60 italic">
                      {currentStep.hintText}
                    </OnestFont>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="px-5 py-4">
              <div className="flex items-center gap-4">
                <OnestFont weight={500} lineHeight="relaxed" className="text-base text-pure-white whitespace-pre-line">
                  {content.description}
                </OnestFont>
                {!shouldHideCloseButton && !currentStep.hideCloseButton && (
                  <CloseButton
                    onClick={handleExit}
                    className={`flex-shrink-0 transition-all duration-200 ${
                      isSceneTransitioning ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ pointerEvents: 'all' }}
                    ariaLabel="Exit walkthrough"
                    size={16}
                  />
                )}
              </div>
              {/* Hint text */}
              {currentStep.hintText && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pure-white rounded-full animate-pulse" />
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-pure-white/60 italic">
                    {currentStep.hintText}
                  </OnestFont>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render the bird guide character
  const renderBird = () => {
    return (
      <img
        ref={birdImgRef}
        src={NoticeBirdIcon}
        alt=""
        data-scale-x={birdFlip ? '-1' : '1'}
        data-flying={birdFlying ? 'true' : 'false'}
        className="fixed z-[10000] pointer-events-none select-none"
        style={{
          width: BIRD_SIZE,
          height: 'auto',
          left: birdPos.x,
          top: birdPos.y,
          marginLeft: -(BIRD_SIZE / 2),
          marginTop: -(BIRD_SIZE / 2),
          // transform is fully driven by the RAF loop — never set via React style
          // to prevent React re-renders from wiping the float animation
          transition: (isSceneTransitioning || !birdPositionReady)
            ? 'none'
            : birdFlying
              ? `left ${BIRD_FLY_DURATION}ms ease-in-out, top ${BIRD_FLY_DURATION}ms ease-in-out, opacity 200ms ease`
              : 'opacity 200ms ease',
          opacity: birdVisible && !isSceneTransitioning && birdPositionReady ? 1 : 0,
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
      {/* Card bird float animation keyframe (for bird images inside fullscreen cards) */}
      <style>{`
        @keyframes cardBirdFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      {renderStep()}
      {(!stepHasBirdImage || isMapIntroStep) && renderBird()}
    </>,
    document.body
  );
};

export default ModuleWalkthrough;