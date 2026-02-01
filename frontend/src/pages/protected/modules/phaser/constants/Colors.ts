// STRICT COLOR PALETTE - Only colors from the PDF style sheet
export const COLORS = {
  // UI Colors
  WHITE: 0xffffff,         // #FFFFFF - Pure white
  BLACK: 0x000000,
  
  // Greyscales (Text Colors) - EXACT from PDF
  TEXT_BLUE_BLACK: 0x192141,  // #192141 - TextBlueBlack - Primary headings, important text
  TEXT_GREY: 0x585561,        // #585561 - TextGrey - Body text, secondary text
  UNAVAILABLE_BUTTON: 0xb5b3b9, // #B5B3B9 - UnavailableButton - Disabled state, light gray
  TEXT_WHITE: 0xf8faff,       // #F8FAFF - TextWhite - Very light backgrounds, text on dark
  PURE_WHITE: 0xffffff,       // #FFFFFF - PureWhite - Pure white
  
  // Logo Colors - EXACT from PDF
  LOGO_BLUE: 0x3658ec,        // #3658EC - LogoBlue - Primary logo blue
  LOGO_YELLOW: 0xfdb212,      // #FDB212 - LogoYellow - Logo yellow/orange
  
  // Blues - EXACT from PDF
  // LINEAR_BLUE_1: linear-gradient(137.38deg, #1D3CC6 6.84%, #837CFF 97.24%)
  LINEAR_BLUE_1_START: 0x1d3cc6,  // #1D3CC6 - LinearBlue1 gradient start
  LINEAR_BLUE_1_END: 0x837cff,    // #837CFF - LinearBlue1 gradient end
  ELEGANT_BLUE: 0x6b85f5,         // #6B85F5 - ElegantBlue - Medium blue
  TRANSPARENT_ELEGANT_BLUE: 0x6b85f5, // #6B85F580 (use alpha separately for 50% opacity)
  
  // System Status - EXACT from PDF
  STATUS_YELLOW: 0xfac86d,    // #FAC86D - StatusYellow - Warning states
  STATUS_RED: 0xff6c4f,       // #FF6C4F - StatusRed - Error states
  STATUS_GREEN: 0x76dc94,     // #76DC94 - StatusGreen - Success states
  
  // Background Colors - EXACT from PDF
  LIGHT_BACKGROUND_BLUE: 0xebefff,  // #EBEFFF - LightBackgroundBlue - Primary background
  // CARD_GRADIENT_COLOR: linear-gradient(133.93deg, #EEF1FF 24.22%, #FAFBFF 79%)
  CARD_GRADIENT_START: 0xeef1ff,    // #EEF1FF - CardGradientColor start
  CARD_GRADIENT_END: 0xfafbff,      // #FAFBFF - CardGradientColor end
  // Unnamed gradient: linear-gradient(180deg, #EDF0FF 0%, #DDE3FF 100%)
  GRADIENT_2_START: 0xedf0ff,       // #EDF0FF - Gradient 2 start
  GRADIENT_2_END: 0xdde3ff,         // #DDE3FF - Gradient 2 end
  
  // Loading Progress (keeping original as not in PDF)
  PROGRESS_BOX: 0x222222,
  PROGRESS_BAR: 0xffffff,
  
  // Text Colors (Hex strings for Phaser.GameObjects.Text)
  TEXT_PRIMARY: '#192141',        // TextBlueBlack
  TEXT_SECONDARY: '#585561',      // TextGrey
  TEXT_LIGHT: '#B5B3B9',         // UnavailableButton
  TEXT_WHITE_HEX: '#F8FAFF',     // TextWhite
  TEXT_PURE_WHITE: '#FFFFFF',    // PureWhite
  TEXT_SUCCESS: '#76DC94',       // StatusGreen
  TEXT_WARNING: '#FAC86D',       // StatusYellow
  TEXT_ERROR: '#FF6C4F',         // StatusRed
  
  // Background Colors for camera fades
  FADE_WHITE: { r: 248, g: 250, b: 255},  // #F8FAFF - TextWhite
} as const;

// Opacity values
export const OPACITY = {
  FULL: 1,
  HIGH: 0.9,
  MEDIUM: 0.6,
  LOW: 0.3,
  TRANSPARENT_ELEGANT_BLUE: 0.5, // For TransparentElegantBlue (50% opacity)
  TRANSPARENT: 0,
} as const;