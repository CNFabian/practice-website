import React, { useState } from 'react';
import { CloseIcon, CloseIconHover } from '../../assets';

interface CloseButtonProps {
  onClick: (e?: React.MouseEvent) => void;
  className?: string;
  size?: number;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  className = '',
  size = 24,
  ariaLabel = 'Close',
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`transition-opacity cursor-pointer ${className}`}
      aria-label={ariaLabel}
      style={style}
    >
      <img
        src={isHovered ? CloseIconHover : CloseIcon}
        alt=""
        width={size}
        height={size}
        draggable={false}
      />
    </button>
  );
};

export default CloseButton;
