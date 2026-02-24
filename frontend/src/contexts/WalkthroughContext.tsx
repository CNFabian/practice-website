import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ALL_SEGMENT_IDS, SEGMENT_STORAGE_PREFIX } from '../components/protected/walkthrough/walkthroughSegments';

interface WalkthroughContextType {
  // Segment API
  activeSegmentId: string | null;
  startSegment: (segmentId: string) => void;
  completeSegment: (segmentId: string) => void;
  exitSegment: () => void;
  isSegmentCompleted: (segmentId: string) => boolean;
  resetAllSegments: () => void;

  // Backward compat (derived from segment state)
  isWalkthroughActive: boolean;
  hasCompletedWalkthrough: boolean;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

interface WalkthroughProviderProps {
  children: ReactNode;
}

// Helper to read completed segments from localStorage
const getCompletedSegments = (): Set<string> => {
  const completed = new Set<string>();
  for (const id of ALL_SEGMENT_IDS) {
    if (localStorage.getItem(`${SEGMENT_STORAGE_PREFIX}${id}`) === 'completed') {
      completed.add(id);
    }
  }
  return completed;
};

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [completedSegments, setCompletedSegments] = useState<Set<string>>(() => getCompletedSegments());

  const startSegment = useCallback((segmentId: string) => {
    // Don't start if another segment is already active
    setActiveSegmentId(prev => {
      if (prev !== null) return prev;
      return segmentId;
    });
  }, []);

  const completeSegment = useCallback((segmentId: string) => {
    localStorage.setItem(`${SEGMENT_STORAGE_PREFIX}${segmentId}`, 'completed');
    setCompletedSegments(prev => {
      const next = new Set(prev);
      next.add(segmentId);
      return next;
    });
    setActiveSegmentId(null);
  }, []);

  const exitSegment = useCallback(() => {
    // Dismissing = completing (user chose to skip, don't show again)
    setActiveSegmentId(prev => {
      if (prev) {
        localStorage.setItem(`${SEGMENT_STORAGE_PREFIX}${prev}`, 'completed');
        setCompletedSegments(old => {
          const next = new Set(old);
          next.add(prev);
          return next;
        });
      }
      return null;
    });
  }, []);

  const isSegmentCompleted = useCallback((segmentId: string) => {
    return completedSegments.has(segmentId);
  }, [completedSegments]);

  const resetAllSegments = useCallback(() => {
    for (const id of ALL_SEGMENT_IDS) {
      localStorage.removeItem(`${SEGMENT_STORAGE_PREFIX}${id}`);
    }
    setCompletedSegments(new Set());
    setActiveSegmentId(null);
  }, []);

  // Backward compat
  const isWalkthroughActive = activeSegmentId !== null;
  const hasCompletedWalkthrough = ALL_SEGMENT_IDS.every(id => completedSegments.has(id));

  return (
    <WalkthroughContext.Provider
      value={{
        activeSegmentId,
        startSegment,
        completeSegment,
        exitSegment,
        isSegmentCompleted,
        resetAllSegments,
        isWalkthroughActive,
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
