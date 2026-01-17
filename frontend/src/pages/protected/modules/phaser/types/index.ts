// ═══════════════════════════════════════════════════════════
// SCENE DATA INTERFACES
// ═══════════════════════════════════════════════════════════

/**
 * Data passed to MapScene on initialization
 */
export interface MapSceneData {
  // No data needed for map scene currently
}

/**
 * Data passed to NeighborhoodScene on initialization
 */
export interface NeighborhoodSceneData {
  neighborhoodId?: string;
  houses?: HousePosition[];
  currentHouseIndex?: number;
}

/**
 * Data passed to HouseScene on initialization
 */
export interface HouseSceneData {
  houseId?: string;
  moduleId?: number;
}

// ═══════════════════════════════════════════════════════════
// NEIGHBORHOOD & HOUSE INTERFACES
// ═══════════════════════════════════════════════════════════

/**
 * Neighborhood data for MapScene
 */
export interface NeighborhoodData {
  id: string;
  name: string;
  x: number;
  y: number;
  color: number;
  isLocked: boolean;
}

/**
 * House position data for NeighborhoodScene
 */
export interface HousePosition {
  id: string;
  name: string; // Module title
  x: number;
  y: number;
  isLocked?: boolean; // Module lock status
  houseType?: string;
  moduleId?: number; // Frontend module ID
  moduleBackendId?: string; // Backend module UUID
  description?: string; // Module description
  coinReward?: number; // Coins for completing module
}

// ═══════════════════════════════════════════════════════════
// MODULE & LESSON INTERFACES
// ═══════════════════════════════════════════════════════════

/**
 * Lesson data for HouseScene
 */
export interface Lesson {
  id: number;
  title: string;
  type: string;
  completed: boolean;
  locked: boolean;
}

/**
 * Module data containing lessons
 */
export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

// ═══════════════════════════════════════════════════════════
// BIRD CHARACTER INTERFACES
// ═══════════════════════════════════════════════════════════

/**
 * Bird travel information for scene transitions
 * Used to determine entrance animation in HouseScene
 */
export interface BirdTravelInfo {
  previousHouseIndex: number;
  currentHouseIndex: number;
  traveled: boolean; // Whether the bird actually moved between houses
}

// ═══════════════════════════════════════════════════════════
// REGISTRY DATA INTERFACES
// ═══════════════════════════════════════════════════════════

/**
 * Data stored in Phaser registry for cross-scene communication
 */
export interface RegistryData {
  // Asset loading
  assetsLoaded?: boolean;

  // Navigation handlers
  handleNeighborhoodSelect?: (neighborhoodId: string) => void;
  handleHouseSelect?: (houseId: string) => void;
  handleLessonSelect?: (lessonId: number) => void;
  handleMinigameSelect?: () => void;
  handleBackToMap?: () => void;
  handleBackToNeighborhood?: () => void;

  // Navigation state
  currentHouseIndex?: number;
  birdTravelInfo?: BirdTravelInfo;
  returningFromLesson?: boolean;

  // Data
  neighborhoodHouses?: { [key: string]: HousePosition[] };
}

// ═══════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════

/**
 * Generic position type
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle bounds
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}