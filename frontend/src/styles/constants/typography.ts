export const FONT_FAMILY = {
  primary: "'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export const FONT_WEIGHT = {
  light: 300,
  medium: 500,
  bold: 700,
} as const;

export const FONT_SIZE = {
  // Main sizes from spec
  h1: '66px',        // Heading 1
  h2: '45px',        // Heading 2
  large: '30px',     // Large text style
  body: '20px',      // Paragraph text
  small: '17px',     // Descriptions/tags
  
  // Additional utility sizes (for responsive/edge cases)
  xs: '14px',
  sm: '16px',
  md: '20px',
  lg: '30px',
  xl: '45px',
  '2xl': '66px',
} as const;

export const LINE_HEIGHT = {
  tight: 1.25,       // 125% - For headings
  relaxed: 1.55,     // 155% - For body text
  normal: 1.5,       // Default fallback
} as const;

/**
 * Typography Style Presets
 * Complete definitions matching the design spec
 */
export const TYPOGRAPHY_STYLES = {
  h1: {
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
    usage: 'Main Titles',
  },
  h2: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.tight,
    usage: 'Main Section Titles',
  },
  large: {
    fontSize: FONT_SIZE.large,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: LINE_HEIGHT.relaxed,
    usage: 'Titles or normal text depending on context',
  },
  bodyLight: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.light,
    lineHeight: LINE_HEIGHT.relaxed,
    usage: 'Most normal texts (light backgrounds)',
  },
  bodyMedium: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: LINE_HEIGHT.relaxed,
    usage: 'Normal text with emphasis',
  },
  bodyBold: {
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: LINE_HEIGHT.relaxed,
    usage: 'Bold body text',
  },
  small: {
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.light,
    lineHeight: LINE_HEIGHT.relaxed,
    usage: 'Descriptional small text and tags',
  },
} as const;

/**
 * Font Weight Selection Based on Background
 * Best practices for readability
 */
export const FONT_WEIGHT_BY_BACKGROUND = {
  lightBackground: FONT_WEIGHT.light,    // Light backgrounds use light weight
  darkBackground: FONT_WEIGHT.medium,    // Dark backgrounds use medium weight
  coloredBackground: FONT_WEIGHT.medium, // Colored backgrounds use medium weight
} as const;

/**
 * Responsive Font Size Multipliers
 * For different screen sizes
 */
export const FONT_SIZE_SCALE = {
  mobile: 0.875,    // 87.5% of base
  tablet: 0.9375,   // 93.75% of base
  desktop: 1,       // 100% base
} as const;