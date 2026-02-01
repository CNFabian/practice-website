export const ASSET_KEYS = {
  // Backgrounds
  SUBURBAN_BACKGROUND: 'suburbanBackground',
  NEIGHBORHOOD_MAP_BACKGROUND: 'neighborhoodMapBackground',

  // Neighborhoods
  NEIGHBORHOOD_1: 'neighborhood1',
  NEIGHBORHOOD_2: 'neighborhood2',
  NEIGHBORHOOD_3: 'neighborhood3',
  NEIGHBORHOOD_SHADOW: 'neighborhoodShadow',
  LOCK_ICON: 'lockIcon',
  ROADBLOCK_ICON: 'roadblockIcon',
  NOTICE_BIRD_ICON: 'noticeBirdIcon',
  
  // Houses
  LESSON_HOUSE: 'lessonHouse',
  HOUSE_1: 'house1',
  HOUSE_2: 'house2',
  HOUSE_3: 'house3',
  HOUSE_4: 'house4',
  HOUSE_5: 'house5',
  HOUSE_CLOUD: 'houseCloud',
  VIDEO_PROGRESS_ICON: 'videoProgressIcon',
  DOCUMENT_PROGRESS_ICON: 'documentProgressIcon',
  PROGRESS_STAR_ICON: 'progressStarIcon',
  FRONT_GRASS: 'frontGrass',
  BACKGROUND_CLOUD: 'backgroundCloud',

    
  // Characters
  BIRD_IDLE: 'bird_idle',
  BIRD_FLY: 'bird_fly',
  BIRD_CELEBRATION: 'bird_celebration',

  // UI
  COIN_ICON: 'coinIcon',
} as const;

// Type for asset keys
export type AssetKey = typeof ASSET_KEYS[keyof typeof ASSET_KEYS];