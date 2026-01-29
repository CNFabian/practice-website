export const COLORS = {
  // UI Colors
  WHITE: 0xffffff,
  BLACK: 0x000000,
  
  // Gray Scale
  GRAY_100: 0xf3f4f6,
  GRAY_200: 0xe5e7eb,
  GRAY_300: 0xd1d5db,
  GRAY_400: 0x9ca3af,
  GRAY_500: 0x6b7280,
  GRAY_600: 0x4b5563,
  GRAY_700: 0x374151,
  GRAY_800: 0x1f2937,
  GRAY_900: 0x111827,
  
  // Primary Colors
  BLUE_400: 0x60a5fa,
  BLUE_500: 0x3b82f6,
  BLUE_600: 0x2563eb,
  BLUE_700: 0x1d4ed8,
  
  // Success/Green Colors
  GREEN_400: 0x4ade80,
  GREEN_500: 0x10b981,
  GREEN_600: 0x059669,
  GREEN_700: 0x047857,
  
  // Warning/Orange Colors
  ORANGE_400: 0xfb923c,
  ORANGE_500: 0xf97316,
  ORANGE_600: 0xea580c,
  
  // Loading Progress
  PROGRESS_BOX: 0x222222,
  PROGRESS_BAR: 0xffffff,
  
  // Text Colors (Hex strings for Phaser.GameObjects.Text)
  TEXT_PRIMARY: '#1f2937',
  TEXT_SECONDARY: '#6b7280',
  TEXT_WHITE: '#ffffff',
  TEXT_SUCCESS: '#10b981',
  TEXT_WARNING: '#f97316',
  
  // Background Colors (for camera fades)
  FADE_WHITE: { r: 255, g: 255, b: 255}
} as const;

// Opacity values
export const OPACITY = {
  FULL: 1,
  HIGH: 0.9,
  MEDIUM: 0.6,
  LOW: 0.3,
  TRANSPARENT: 0,
} as const;