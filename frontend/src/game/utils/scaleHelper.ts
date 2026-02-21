/**
 * Get the device pixel ratio for scaling scene elements
 */
export const getScaleFactor = (): number => {
  return window.devicePixelRatio || 1;
};

/**
 * Scale a value by the device pixel ratio for high-DPI displays
 */
export const scale = (value: number): number => {
  return value * getScaleFactor();
};

/**
 * Scale font size for high-DPI displays
 */
export const scaleFontSize = (baseFontSize: number): string => {
  return `${baseFontSize * getScaleFactor()}px`;
};