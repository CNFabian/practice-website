import { useEffect, useRef, useCallback } from 'react';
import { getAccessToken } from '../../../services/authAPI';
import type { BatchProgressItem } from '../../../services/learningAPI';
import { batchUpdateProgress } from '../../../services/learningAPI';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * useBatchProgressSync
 * 
 * Manages a queue of lesson progress items and syncs them to the backend:
 * - On `visibilitychange` (user switches tab) — uses fetch via batchUpdateProgress
 * - On `beforeunload` (user closes tab/navigates away) — uses navigator.sendBeacon for reliability
 * - On manual flush (e.g., when navigating between lessons)
 * 
 * Usage:
 *   const { addProgressItem, flushProgress } = useBatchProgressSync();
 *   
 *   // Queue progress from LessonView:
 *   addProgressItem({ lesson_id: '...', time_spent_seconds: 120, video_progress_seconds: 90 });
 *   
 *   // Flush when navigating between lessons:
 *   flushProgress();
 */
export const useBatchProgressSync = () => {
  const pendingItemsRef = useRef<Map<string, BatchProgressItem>>(new Map());
  const isFlushing = useRef(false);

  /**
   * Add or update a progress item in the queue.
   * Uses lesson_id as key — later updates for the same lesson overwrite earlier ones.
   */
  const addProgressItem = useCallback((item: BatchProgressItem) => {
    if (!item.lesson_id) return;
    
    // Merge with existing entry if present (keep highest values)
    const existing = pendingItemsRef.current.get(item.lesson_id);
    if (existing) {
      pendingItemsRef.current.set(item.lesson_id, {
        ...existing,
        ...item,
        video_progress_seconds: Math.max(
          existing.video_progress_seconds ?? 0,
          item.video_progress_seconds ?? 0
        ),
        time_spent_seconds: Math.max(
          existing.time_spent_seconds ?? 0,
          item.time_spent_seconds ?? 0
        ),
        milestone: item.milestone ?? existing.milestone,
        completed: item.completed || existing.completed,
      });
    } else {
      pendingItemsRef.current.set(item.lesson_id, item);
    }
  }, []);

  /**
   * Flush pending progress items via the batch API endpoint.
   * Returns true if items were sent, false if queue was empty or already flushing.
   */
  const flushProgress = useCallback(async (): Promise<boolean> => {
    if (isFlushing.current) return false;
    
    const items = Array.from(pendingItemsRef.current.values());
    if (items.length === 0) return false;

    isFlushing.current = true;
    
    // Clear the queue immediately (if new items arrive during flush, they'll be in the next batch)
    pendingItemsRef.current.clear();

    try {
      console.log(`📦 [BatchSync] Flushing ${items.length} progress item(s) to backend`);
      await batchUpdateProgress(items);
      console.log('✅ [BatchSync] Batch sync successful');
      return true;
    } catch (error) {
      console.error('❌ [BatchSync] Batch sync failed, re-queuing items:', error);
      // Re-queue failed items
      items.forEach(item => {
        if (!pendingItemsRef.current.has(item.lesson_id)) {
          pendingItemsRef.current.set(item.lesson_id, item);
        }
      });
      return false;
    } finally {
      isFlushing.current = false;
    }
  }, []);

  /**
   * Flush via navigator.sendBeacon (fire-and-forget, works on page unload).
   * sendBeacon is the only reliable way to send data during beforeunload.
   */
  const flushWithBeacon = useCallback(() => {
    const items = Array.from(pendingItemsRef.current.values());
    if (items.length === 0) return;

    const token = getAccessToken();
    if (!token) {
      console.warn('⚠️ [BatchSync] No auth token for beacon sync');
      return;
    }

    const url = `${API_BASE_URL}/api/learning/progress/batch`;
    const payload = JSON.stringify({ items });
    
    // sendBeacon sends a POST with Content-Type: text/plain by default
    // Use Blob to set the correct Content-Type
    const blob = new Blob([payload], { type: 'application/json' });

    // Note: sendBeacon doesn't support custom headers (no auth token).
    // We'll use keepalive fetch instead for authenticated requests.
    try {
      const success = navigator.sendBeacon(url, blob);
      if (success) {
        console.log(`📡 [BatchSync] Beacon sent with ${items.length} item(s)`);
        pendingItemsRef.current.clear();
      } else {
        console.warn('⚠️ [BatchSync] Beacon failed to queue');
      }
    } catch (error) {
      console.error('❌ [BatchSync] Beacon error:', error);
    }
  }, []);

  /**
   * Flush via keepalive fetch (works on page unload with auth headers).
   * This is the preferred method since it supports Authorization headers.
   */
  const flushWithKeepalive = useCallback(() => {
    const items = Array.from(pendingItemsRef.current.values());
    if (items.length === 0) return;

    const token = getAccessToken();
    if (!token) {
      console.warn('⚠️ [BatchSync] No auth token for keepalive sync');
      return;
    }

    const url = `${API_BASE_URL}/api/learning/progress/batch`;
    
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
        keepalive: true, // Allows the request to outlive the page
      });
      
      console.log(`📡 [BatchSync] Keepalive fetch sent with ${items.length} item(s)`);
      pendingItemsRef.current.clear();
    } catch (error) {
      console.error('❌ [BatchSync] Keepalive fetch error:', error);
      // Fallback to sendBeacon (no auth, but backend may accept if session cookie exists)
      flushWithBeacon();
    }
  }, [flushWithBeacon]);

  // Register event listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ [BatchSync] Tab hidden — flushing progress');
        // Use keepalive fetch for visibility change (page is still alive, just hidden)
        flushWithKeepalive();
      }
    };

    const handleBeforeUnload = () => {
      console.log('🚪 [BatchSync] Page unloading — flushing progress');
      // Use keepalive fetch (supports auth headers, works on unload)
      flushWithKeepalive();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Flush any remaining items on hook cleanup (component unmount)
      const remainingItems = Array.from(pendingItemsRef.current.values());
      if (remainingItems.length > 0) {
        console.log('🧹 [BatchSync] Hook cleanup — flushing remaining progress');
        flushWithKeepalive();
      }
    };
  }, [flushWithKeepalive]);

  return {
    /** Queue a progress item. Uses lesson_id as key — duplicates are merged. */
    addProgressItem,
    /** Manually flush all pending progress (e.g., on lesson navigation). */
    flushProgress,
    /** Check if there are pending items in the queue. */
    hasPendingItems: () => pendingItemsRef.current.size > 0,
    /** Get count of pending items. */
    pendingCount: () => pendingItemsRef.current.size,
  };
};