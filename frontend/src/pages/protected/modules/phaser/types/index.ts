import type { Lesson as AppLesson, Module as AppModule } from '../../../../../types/modules';

// ═══════════════════════════════════════════════════════════
// RE-EXPORT MAIN APP TYPES
// ═══════════════════════════════════════════════════════════

// Re-export the main Lesson and Module types so phaser code uses the same types
export type Lesson = AppLesson;
export type Module = AppModule;

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
  moduleBackendId?: string;
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
  moduleLessonsData?: { [key: string]: ModuleLessonsData };
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

/**
 * Module lessons data stored in registry
 */
export interface ModuleLessonsData {
  id: number;
  title: string;
  lessons: Lesson[]; // Now uses the full Lesson type from main app
}

/**
 * Backend lesson data interface from API
 */
export interface BackendLessonData {
  id: string;
  module_id: string;
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  estimated_duration_minutes: number;
  nest_coins_reward: number;
  is_completed: boolean;
  progress_seconds: number;
  grow_your_nest_played?: boolean;
}