import {
  NoticeBirdIcon,
  CoinStack,
  TreasureChest,
} from '../../../assets';

// ═══════════════════════════════════════════════════════════
// WALKTHROUGH STEP & SEGMENT TYPES
// ═══════════════════════════════════════════════════════════

export interface WalkthroughStep {
  id: string;
  type: 'fullscreen' | 'highlight' | 'interactive';
  targetSelector?: string;
  content: {
    image?: string;
    secondaryImage?: string;
    title: string;
    description: string | React.ReactNode;
    buttonText: string;
  };
  highlight?: {
    region?: { x: number; y: number; width: number; height: number };
    selector?: string;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  highlightPadding?: number;
  sceneTransition?: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame';
  advanceOnNavState?: 'map' | 'neighborhood' | 'house' | 'lesson' | 'minigame';
  advanceDelay?: number;
  hideCloseButton?: boolean;
  hintText?: string;
  birdPosition?: {
    side: 'left' | 'right' | 'top' | 'bottom';
    offset?: number;
    flip?: boolean;
    verticalOffset?: number;
  };
}

export interface WalkthroughSegment {
  id: string;
  /** Which navState value triggers this segment on first visit */
  triggerNavState: string;
  steps: WalkthroughStep[];
  /** When false, the segment is never auto-triggered by navState changes —
   *  it must be started explicitly via startSegment(). Defaults to true. */
  autoTrigger?: boolean;
}

// ═══════════════════════════════════════════════════════════
// SEGMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════

const mapIntroSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Welcome!',
      description: "We're here to guide you through the homebuying process.",
      buttonText: 'Continue',
    },
    sceneTransition: 'MapScene',
  },
  {
    id: 'earn-coins',
    type: 'fullscreen',
    content: {
      image: CoinStack,
      title: 'Complete Lessons and Minigames to Earn Nest Coins',
      description: "As you learn, you'll earn rewards. Coins can be spent in the rewards shop for discounts at partner stores.",
      buttonText: 'Continue',
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
    id: 'beta-thank-you',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Thank you for testing our beta version',
      description: "Some features are still in development. Thanks for your patience — we'd love your feedback as we prepare for launch.",
      buttonText: 'Continue',
    },
  },
  {
    id: 'click-neighborhood',
    type: 'interactive',
    content: {
      title: '',
      description: 'Click on a neighborhood to get started',
      buttonText: '',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 3, y: 45, width: 43, height: 40 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
    advanceOnNavState: 'neighborhood',
    advanceDelay: 800,
    hideCloseButton: true,
    birdPosition: { side: 'right', offset: -20 },
  },
];

const neighborhoodIntroSteps: WalkthroughStep[] = [
  {
    id: 'click-house',
    type: 'interactive',
    content: {
      title: '',
      description: "Each house has lessons on a specific topic. Complete them all to earn coins!\n\nClick on the house to continue.",
      buttonText: '',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 1, y: 15, width: 55, height: 40 },
    },
    tooltipPosition: 'right',
    highlightPadding: 16,
    advanceOnNavState: 'house',
    advanceDelay: 800,
    hideCloseButton: true,
    birdPosition: { side: 'top', offset: 0, flip: true },
  },
];

const houseIntroSteps: WalkthroughStep[] = [
  {
    id: 'click-first-lesson',
    type: 'interactive',
    content: {
      title: '',
      description: "Lessons are located in the rooms of the house. Each one covers a key topic.\n\nHover over the bedroom and click start to begin the first lesson.",
      buttonText: '',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 5, y: 10, width: 38, height: 45 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    advanceOnNavState: 'lesson',
    advanceDelay: 500,
    hideCloseButton: true,
    birdPosition: { side: 'right', offset: 30, flip: true },
  },
  {
    id: 'lesson-toggle',
    type: 'highlight',
    content: {
      title: '',
      description: "Inside each lesson you can watch or read. Use this toggle to switch between video and text.",
      buttonText: 'Continue',
    },
    highlight: {
      selector: '[data-walkthrough="lesson-view-toggle"]',
    },
    tooltipPosition: 'bottom',
    highlightPadding: 8,
    hideCloseButton: true,
    birdPosition: { side: 'left', offset: 10, verticalOffset: -60 },
  },
  {
    id: 'lesson-complete',
    type: 'highlight',
    content: {
      title: '',
      description: "When watching a video, the lesson will autocomplete once finished. For reading, click here to mark the lesson as complete.",
      buttonText: 'Continue',
    },
    highlight: {
      selector: '[data-walkthrough="lesson-mark-complete"]',
    },
    tooltipPosition: 'bottom',
    highlightPadding: 8,
    hideCloseButton: true,
    birdPosition: { side: 'right', offset: -5, flip: true, verticalOffset: -40 },
  },
  {
    id: 'lesson-house-nav',
    type: 'highlight',
    content: {
      title: '',
      description: "This mini house shows where you are in the module. Each square is a lesson, green means it's done and grey means its not yet unlocked. Tap any unlocked square to jump to a different lesson.",
      buttonText: 'Got it',
    },
    highlight: {
      selector: '[data-walkthrough="lesson-house-nav"]',
    },
    tooltipPosition: 'right',
    highlightPadding: 10,
    hideCloseButton: true,
    birdPosition: { side: 'bottom', offset: 0, flip: false, verticalOffset: -10 },
  },
];

const minigameIntroSteps: WalkthroughStep[] = [
  {
    id: 'minigame-welcome',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Welcome to Grow Your Tree',
      description: "This bird needs a home\nHelp grow a strong tree so it can build its nest.\nAnswer questions, earn rewards,\nand watch your tree grow.",
      buttonText: "Let's go",
    },
  },
  {
    id: 'minigame-lessons',
    type: 'highlight',
    content: {
      title: '',
      description: "After each lesson, you will answer 3 questions about the content of the lesson.\n\nEach correct answer will give the tree water to help it grow.\n\nGet 3 correct in a row and earn Fertilizer for a bonus growth boost.\n\nDon't worry, mistakes won't hurt your tree — they just reset your streak.",
      buttonText: 'Continue',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 52, y: 2, width: 46, height: 70 },
    },
    tooltipPosition: 'left',
    highlightPadding: 12,
    birdPosition: { side: 'top', offset: -10, flip: false, verticalOffset: 60 },
  },
  {
    id: 'minigame-grow',
    type: 'highlight',
    content: {
      title: '',
      description: "A fully grown tree earns you up to 250 Nest Coins. Spend them in the rewards shop for real-world perks and discounts.",
      buttonText: 'Continue',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 2, y: 8, width: 48, height: 88 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    birdPosition: { side: 'top', offset: -10, flip: true, verticalOffset: 200 },
  },
  {
    id: 'minigame-ready',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Help the Nest Bird Get a Home!',
      description: "Help your bird build the perfect nest — one answer at a time.",
      buttonText: 'Continue',
    },
  },
];

// ═══════════════════════════════════════════════════════════
// FREE ROAM INTRO STEPS
// ═══════════════════════════════════════════════════════════

const freeRoamIntroSteps: WalkthroughStep[] = [
  {
    id: 'freeroam-unlocked',
    type: 'highlight',
    content: {
      title: 'Free Roam unlocked',
      description: "You've completed all lesson minigames! Tap this button to enter Free Roam mode and finish growing your tree to its final stage.",
      buttonText: 'GOT IT',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 78, y: 0, width: 22, height: 18 },
    },
    tooltipPosition: 'left',
    highlightPadding: 8,
    birdPosition: { side: 'right', offset: -230, flip: false, verticalOffset: 10 },
  },
];

// ═══════════════════════════════════════════════════════════
// SEGMENT REGISTRY
// ═══════════════════════════════════════════════════════════

export const WALKTHROUGH_SEGMENTS: Record<string, WalkthroughSegment> = {
  'map-intro': {
    id: 'map-intro',
    triggerNavState: 'map',
    steps: mapIntroSteps,
  },
  'neighborhood-intro': {
    id: 'neighborhood-intro',
    triggerNavState: 'neighborhood',
    steps: neighborhoodIntroSteps,
  },
  'house-intro': {
    id: 'house-intro',
    triggerNavState: 'house',
    steps: houseIntroSteps,
  },
  'minigame-intro': {
    id: 'minigame-intro',
    triggerNavState: 'minigame',
    steps: minigameIntroSteps,
  },
  'freeroam-intro': {
    id: 'freeroam-intro',
    triggerNavState: 'house',
    autoTrigger: false,
    steps: freeRoamIntroSteps,
  },
};

export const ALL_SEGMENT_IDS = ['map-intro', 'neighborhood-intro', 'house-intro', 'minigame-intro', 'freeroam-intro'];

// localStorage key prefix for segment completion
export const SEGMENT_STORAGE_PREFIX = 'nestnav_wt_segment_';
