import { useCallback, useRef, useState } from 'react';

interface UseSmartLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleLoad: () => Promise<void>;
}

/**
 * Custom hook to manage loading state intelligently.
 * Only shows loading on initial load, not on tab switches if data already exists.
 * 
 * @param loadFunction - Async function that loads data
 * @param dependencies - Dependencies array for useEffect (user, session, etc.)
 * @returns Object with loading state and handlers
 */
export const useSmartLoading = (
  loadFunction: () => Promise<void>,
  dependencies: any[] = []
) => {
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const handleLoad = useCallback(async () => {
    // Don't reload if already loading
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      
      // Only show loading spinner on first load, not on tab switches
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      await loadFunction();

      // Mark as loaded after successful load
      hasLoadedRef.current = true;
      setLoading(false);
    } catch (error) {
      // Show loading as false on error too
      setLoading(false);
      hasLoadedRef.current = true;
    } finally {
      isLoadingRef.current = false;
    }
  }, [loadFunction]);

  return { loading, setLoading, handleLoad };
};
