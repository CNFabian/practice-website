import React, { useState } from 'react';
import { BackArrow, BackArrowHover } from '../../assets';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  size?: number;
  ariaLabel?: string;
  children?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  className = '',
  size = 13,
  ariaLabel = 'Go back',
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-2 transition-opacity cursor-pointer ${className}`}
      aria-label={ariaLabel}
    >
      <img
        src={isHovered ? BackArrowHover : BackArrow}
        alt=""
        width={size}
        height={Math.round(size * (23 / 13))}
        draggable={false}
      />
      {children}
    </button>
  );
};

export default BackButton;
