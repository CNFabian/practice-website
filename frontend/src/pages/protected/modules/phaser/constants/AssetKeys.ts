export const ASSET_KEYS = {
  // Backgrounds
  SUBURBAN_BACKGROUND: 'suburbanBackground',
  NEIGHBORHOOD_MAP_BACKGROUND: 'neighborhoodMapBackground',
  GROW_YOUR_NEST_BACKGROUND: 'growYourNestBackground',

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

  // Trees
  TREE_STAGE_1: 'tree_stage_1',
  TREE_STAGE_2: 'tree_stage_2',
  TREE_STAGE_3: 'tree_stage_3',
  TREE_STAGE_4: 'tree_stage_4',
  TREE_STAGE_5: 'tree_stage_5',
  TREE_STAGE_6: 'tree_stage_6',
  TREE_STAGE_7: 'tree_stage_7',
  TREE_SHADOW: 'tree_shadow',

  // Minigame Assets
  WATERING_CAN_STILL: 'watering_can_still',
  WATERING_CAN_POURING: 'watering_can_pouring',
} as const;

// Type for asset keys
export type AssetKey = typeof ASSET_KEYS[keyof typeof ASSET_KEYS];