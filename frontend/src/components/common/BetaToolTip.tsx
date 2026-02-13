import React, { useState, useRef, useEffect, useCallback } from "react";
import { OnestFont } from "../../assets";

interface BetaTooltipProps {
  children: React.ReactNode;
  message?: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const BetaTooltip: React.FC<BetaTooltipProps> = ({
  children,
  message = "This feature is currently in development and non-functional in this beta release.",
  position = "top",
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoDismissRef = useRef<NodeJS.Timeout | null>(null);
  const fadeRef = useRef<NodeJS.Timeout | null>(null);

  const dismissTooltip = () => {
    setIsFading(true);
    fadeRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsFading(false);
    }, 500);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVisible) {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      dismissTooltip();
    } else {
      if (fadeRef.current) clearTimeout(fadeRef.current);
      setIsFading(false);
      setIsVisible(true);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      autoDismissRef.current = setTimeout(dismissTooltip, 5000);
    }
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      dismissTooltip();
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, handleClickOutside]);

  useEffect(() => {
    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 border-t-text-blue-black border-x-transparent border-b-transparent border-[6px]";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 border-b-text-blue-black border-x-transparent border-t-transparent border-[6px]";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 border-l-text-blue-black border-y-transparent border-r-transparent border-[6px]";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 border-r-text-blue-black border-y-transparent border-l-transparent border-[6px]";
      default:
        return "top-full left-1/2 -translate-x-1/2 border-t-text-blue-black border-x-transparent border-b-transparent border-[6px]";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex ${className}`}
      onClick={handleClick}
    >
      {/* Wrap children - prevent original click from firing */}
      <div
        className={`cursor-pointer ${className.includes('w-full') ? 'w-full' : ''}`}
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`absolute z-50 ${getPositionClasses()} pointer-events-none ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ transition: 'opacity 500ms ease-out' }}
        >
          <div className="bg-text-blue-black text-pure-white px-3 py-2 rounded-lg shadow-lg max-w-[220px] w-max">
            <OnestFont weight={500} lineHeight="relaxed" className="text-xs text-center block">
              {message}
            </OnestFont>
          </div>
          {/* Arrow */}
          <div className={`absolute w-0 h-0 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
};

export default BetaTooltip;