/**
 * useOnline hook — tracks connectivity state and exposes it app-wide.
 * 
 * Every core flow (enrollment, verification, recovery, credential presentation) 
 * works with zero internet. This hook informs UI about connectivity status
 * and queues operations for retry on reconnect.
 */

import { useState, useEffect, useCallback } from 'react';

interface OnlineContextType {
  isOnline: boolean;
  lastOnline: number | null;
  hasBeenOnline: boolean;
}

/**
 * Custom hook to track online/offline status.
 * Returns true when navigator.onLine is true, false otherwise.
 */
export function useOnline(): OnlineContextType {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnline, setLastOnline] = useState<number | null>(null);
  const [hasBeenOnline, setHasBeenOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const handleOnline = useCallback(() => {
    console.log('[Connectivity] Device came online');
    setIsOnline(true);
    setLastOnline(Date.now());
    setHasBeenOnline(true);

    // Dispatch custom event for operation queue retry
    window.dispatchEvent(new CustomEvent('reconnect'));
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[Connectivity] Device went offline');
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    lastOnline,
    hasBeenOnline
  };
}

/**
 * Provider hook to expose connectivity context.
 * Usage: const { isOnline } = useOnlineContext();
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useOnline();
  return isOnline;
}
