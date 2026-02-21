/**
 * Typography.ts
 * 
 * Centralized typography configuration for Phaser game module.
 * Matches design specification and React typography system.
 */

// Font family constant
export const FONT_FAMILY = 'Onest, Arial, sans-serif';

// Font weights (must match loaded font variants)
export const FONT_WEIGHTS = {
  LIGHT: 300,
  MEDIUM: 500,
  BOLD: 700,
} as const;

// Line heights (as percentages to match design spec)
export const LINE_HEIGHTS = {
  TIGHT: 1.25,   // 125% - for headings
  RELAXED: 1.55, // 155% - for body text
} as const;

// Font size presets (in pixels, will be scaled by scaleHelper)
export const FONT_SIZES = {
  // Based on design specification
  H1: 66,      // Main titles
  H2: 45,      // Section titles
  LARGE: 30,   // Large text
  BODY: 20,    // Body text (default)
  SMALL: 17,   // Small text
  TINY: 14,    // Very small text (labels, captions)
  MINI: 12,    // Minimal text (badges, tags)
} as const;

// Typography style presets for common use cases
export const TEXT_STYLES = {
  // Headings
  H1: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.H1,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  
  H2: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.H2,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.TIGHT,
  },
  
  // Body text variants
  BODY_LIGHT: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: FONT_WEIGHTS.LIGHT,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  BODY_MEDIUM: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  BODY_BOLD: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  // Labels and small text
  LABEL: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.SMALL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  CAPTION: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.TINY,
    fontWeight: FONT_WEIGHTS.LIGHT,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  // UI elements
  BUTTON: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.BODY,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  BADGE: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.MINI,
    fontWeight: FONT_WEIGHTS.BOLD,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
  
  TAG: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES.MINI,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    lineHeight: LINE_HEIGHTS.RELAXED,
  },
} as const;

// Helper function to create Phaser text style config
export function createTextStyle(
  baseStyle: keyof typeof TEXT_STYLES,
  color: string,
  overrides?: Partial<Phaser.Types.GameObjects.Text.TextStyle>
): Phaser.Types.GameObjects.Text.TextStyle {
  const preset = TEXT_STYLES[baseStyle];
  
  return {
    fontFamily: preset.fontFamily,
    fontSize: `${preset.fontSize}px`,
    color: color,
    // Note: Phaser doesn't directly support fontWeight in TextStyle
    // We handle this through CSS font variants loaded in Preloader
    ...overrides,
  };
}

// Weight selection helper based on background
export function getWeightForBackground(
  isLightBackground: boolean
): number {
  return isLightBackground ? FONT_WEIGHTS.LIGHT : FONT_WEIGHTS.MEDIUM;
}