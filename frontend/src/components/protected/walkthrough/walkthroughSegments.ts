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
  birdPosition?: {
    side: 'left' | 'right' | 'top' | 'bottom';
    offset?: number;
  };
}

export interface WalkthroughSegment {
  id: string;
  /** Which navState value triggers this segment on first visit */
  triggerNavState: string;
  steps: WalkthroughStep[];
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
      description: "As you learn, you'll earn rewards! Coins can be spent in the rewards shop to redeem coupons for your favorite stores!",
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
    id: 'beta-thank-you',
    type: 'fullscreen',
    content: {
      image: NoticeBirdIcon,
      title: 'Thank you for testing our beta version',
      description: "Some features are still in development. Thanks for your patience—and we'd love your feedback on how we can improve as we prepare for our official launch!",
      buttonText: 'CONTINUE',
    },
  },
  {
    id: 'click-neighborhood',
    type: 'interactive',
    content: {
      title: 'Explore Neighborhoods',
      description: "Each neighborhood represents a different stage of your home-buying journey. Click on this neighborhood to explore!",
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
    birdPosition: { side: 'right', offset: 10 },
  },
];

const neighborhoodIntroSteps: WalkthroughStep[] = [
  {
    id: 'click-house',
    type: 'interactive',
    content: {
      title: 'Welcome to Your First House!',
      description: "Each house contains lessons on a specific topic. Click on this house to see its lessons!",
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
    birdPosition: { side: 'top', offset: 10 },
  },
];

const houseIntroSteps: WalkthroughStep[] = [
  {
    id: 'house-lessons-overview',
    type: 'highlight',
    content: {
      title: 'Your Lessons',
      description: "Here are your lessons! Each one covers a key topic. Hover over a lesson to see details.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 17, y: 21, width: 25, height: 18 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    birdPosition: { side: 'right', offset: 10 },
  },
  {
    id: 'click-first-lesson',
    type: 'interactive',
    content: {
      title: 'Start Your First Lesson!',
      description: "Hover over Lesson 1 and click 'Start Lesson' to begin learning!",
      buttonText: '',
    },
    highlight: {
      selector: '[data-walkthrough="phaser-container"]',
      region: { x: 5, y: 10, width: 55, height: 45 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    advanceOnNavState: 'lesson',
    advanceDelay: 500,
    birdPosition: { side: 'right', offset: 10 },
  },
  {
    id: 'lesson-toggle',
    type: 'highlight',
    content: {
      title: 'Watch or Read',
      description: "Inside each lesson you can watch or read! Use this toggle to switch between watching the video or reading at your own pace.",
      buttonText: 'CONTINUE',
    },
    highlight: {
      selector: '[data-walkthrough="lesson-view-toggle"]',
    },
    tooltipPosition: 'bottom',
    highlightPadding: 8,
    birdPosition: { side: 'top', offset: 10 },
  },
];

const minigameIntroSteps: WalkthroughStep[] = [
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
      region: { x: 52, y: 8, width: 46, height: 88 },
    },
    tooltipPosition: 'left',
    highlightPadding: 12,
    birdPosition: { side: 'left', offset: 10 },
  },
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
      region: { x: 52, y: 8, width: 46, height: 88 },
    },
    tooltipPosition: 'left',
    highlightPadding: 12,
    birdPosition: { side: 'left', offset: 10 },
  },
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
      region: { x: 2, y: 8, width: 48, height: 88 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    birdPosition: { side: 'right', offset: 10 },
  },
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
      region: { x: 2, y: 8, width: 48, height: 88 },
    },
    tooltipPosition: 'right',
    highlightPadding: 12,
    birdPosition: { side: 'right', offset: 10 },
  },
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
};

export const ALL_SEGMENT_IDS = ['map-intro', 'neighborhood-intro', 'house-intro', 'minigame-intro'];

// localStorage key prefix for segment completion
export const SEGMENT_STORAGE_PREFIX = 'nestnav_wt_segment_';
