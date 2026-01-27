import React from 'react';
import OnestFont from './OnestFont';
import { TYPOGRAPHY_STYLES } from '../../styles/constants/typography';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'large' | 'bodyLight' | 'bodyMedium' | 'bodyBold' | 'small';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Typography Component
 * 
 * Pre-configured typography component with preset styles.
 * Automatically applies correct font size, weight, and line height.
 * 
 * @example
 * <Typography variant="h1">Main Title</Typography>
 * <Typography variant="bodyLight">Body paragraph text</Typography>
 * <Typography variant="small">Small descriptive text</Typography>
 */
const Typography: React.FC<TypographyProps> = ({
  variant = 'bodyLight',
  className = '',
  style = {},
  children,
}) => {
  const variantStyle = TYPOGRAPHY_STYLES[variant];
  
  // Determine HTML element based on variant
  const getElement = () => {
    if (variant === 'h1') return 'h1';
    if (variant === 'h2') return 'h2';
    if (variant.includes('body') || variant === 'large') return 'p';
    if (variant === 'small') return 'span';
    return 'p';
  };

  const combinedStyle: React.CSSProperties = {
    fontSize: variantStyle.fontSize,
    ...style,
  };

  return (
    <OnestFont
      as={getElement()}
      weight={variantStyle.fontWeight}
      lineHeight={variantStyle.lineHeight}
      className={className}
      style={combinedStyle}
    >
      {children}
    </OnestFont>
  );
};

export default Typography;