export const ASSET_KEYS = {
  // Backgrounds
  SUBURBAN_BACKGROUND: 'suburbanBackground',
  
  // House Assets
  LESSON_HOUSE: 'lessonHouse',
  HOUSE_1: 'house1',
  HOUSE_2: 'house2',
  HOUSE_3: 'house3',
  HOUSE_4: 'house4',
  
  // Environment
  ROAD_1: 'road1',
  PLATFORM_1: 'platform1',
  
  // Characters
  BIRD_IDLE: 'bird_idle',
  BIRD_FLY: 'bird_fly',
  
  // UI
  COIN_ICON: 'coinIcon',
} as const;

// Type for asset keys
export type AssetKey = typeof ASSET_KEYS[keyof typeof ASSET_KEYS];