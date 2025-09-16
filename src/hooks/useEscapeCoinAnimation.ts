import { useState, useEffect } from 'react';

interface UseEscapeCoinAnimationReturn {
  isEscapeCoinAnimationActive: boolean;
  setEscapeCoinAnimationActive: (active: boolean) => void;
}

export const useEscapeCoinAnimation = (): UseEscapeCoinAnimationReturn => {
  const [isEscapeCoinAnimationActive, setIsEscapeCoinAnimationActive] = useState(false);

  const setEscapeCoinAnimationActive = (active: boolean) => {
    setIsEscapeCoinAnimationActive(active);
    
    if (active) {
      // Auto-disable after animation duration (2200ms)
      setTimeout(() => {
        setIsEscapeCoinAnimationActive(false);
      }, 2200);
    }
  };

  return {
    isEscapeCoinAnimationActive,
    setEscapeCoinAnimationActive
  };
};