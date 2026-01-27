import React from 'react';
import { FONT_WEIGHT, LINE_HEIGHT } from '../../styles/constants/typography';

export type FontWeight = 300 | 500 | 700 | 'light' | 'medium' | 'bold';
export type LineHeightType = 1.25 | 1.55 | 'tight' | 'relaxed';

interface OnestFontProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
  weight?: FontWeight;
  lineHeight?: LineHeightType;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onClick?: () => void;
}

/**
 * OnestFont Component
 * 
 * Unified typography component using the Onest font family.
 * 
 * @example
 * // Heading
 * <OnestFont as="h1" weight={700} lineHeight="tight" className="text-6xl">
 *   Main Title
 * </OnestFont>
 * 
 * // Body text (light background)
 * <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-body">
 *   Body text content
 * </OnestFont>
 * 
 * // Body text (dark background)
 * <OnestFont as="p" weight={500} lineHeight="relaxed" className="text-body text-white">
 *   Body text on dark background
 * </OnestFont>
 */
const OnestFont: React.FC<OnestFontProps> = ({
  as: Component = 'span',
  weight = 300,
  lineHeight = 1.55,
  className = '',
  style = {},
  children,
  onClick,
}) => {
  // Normalize weight prop to numeric value
  const normalizedWeight = 
    weight === 'light' ? FONT_WEIGHT.light :
    weight === 'medium' ? FONT_WEIGHT.medium :
    weight === 'bold' ? FONT_WEIGHT.bold :
    weight;

  // Normalize lineHeight prop to numeric value
  const normalizedLineHeight = 
    lineHeight === 'tight' ? LINE_HEIGHT.tight :
    lineHeight === 'relaxed' ? LINE_HEIGHT.relaxed :
    lineHeight;

  const combinedStyle: React.CSSProperties = {
    fontFamily: "'Onest', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: normalizedWeight,
    lineHeight: normalizedLineHeight,
    ...style,
  };

  return (
    <Component className={className} style={combinedStyle} onClick={onClick}>
      {children}
    </Component>
  );
};

export default OnestFont;