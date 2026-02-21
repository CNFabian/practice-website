export const SCENE_KEYS = {
  PRELOADER: 'PreloaderScene',
  MAP: 'MapScene',
  NEIGHBORHOOD: 'NeighborhoodScene',
  HOUSE: 'HouseScene',
} as const;

// Type for scene keys
export type SceneKey = typeof SCENE_KEYS[keyof typeof SCENE_KEYS];