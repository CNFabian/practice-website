/**
 * Feature Flags Configuration
 *
 * Toggle features on/off for the platform.
 * Set to `false` to hide incomplete sections from the sidebar
 * before external testing rounds.
 */

export const featureFlags = {
  /** Show Rewards page in sidebar */
  rewards: false,
  /** Show Badges page in sidebar */
  badges: false,
  /** Show Materials section (Calculators, Worksheets, etc.) in sidebar */
  materials: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return featureFlags[flag];
};
