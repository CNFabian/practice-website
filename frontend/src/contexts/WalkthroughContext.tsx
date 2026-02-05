import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WalkthroughContextType {
  isWalkthroughActive: boolean;
  startWalkthrough: () => void;
  exitWalkthrough: () => void;
  completeWalkthrough: () => void;
  hasCompletedWalkthrough: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

interface WalkthroughProviderProps {
  children: ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);
  const [hasCompletedWalkthrough, setHasCompletedWalkthrough] = useState(() => {
    // Check localStorage for completion status
    const stored = localStorage.getItem('nestnav_walkthrough_completed');
    return stored === 'true';
  });

  const startWalkthrough = useCallback(() => {
    setIsWalkthroughActive(true);
  }, []);

  const exitWalkthrough = useCallback(() => {
    setIsWalkthroughActive(false);
  }, []);

  const completeWalkthrough = useCallback(() => {
    setIsWalkthroughActive(false);
    setHasCompletedWalkthrough(true);
    localStorage.setItem('nestnav_walkthrough_completed', 'true');
  }, []);

  return (
    <WalkthroughContext.Provider
      value={{
        isWalkthroughActive,
        startWalkthrough,
        exitWalkthrough,
        completeWalkthrough,
        hasCompletedWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};

export const useWalkthrough = (): WalkthroughContextType => {
  const context = useContext(WalkthroughContext);
  if (context === undefined) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};

export default WalkthroughContext;