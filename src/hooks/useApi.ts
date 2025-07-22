import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../types';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Hook to handle API calls with loading and error states
 */
const useApi = <T>(
  apiFunc: (...args: any[]) => Promise<T>,
  immediate = false,
  initialArgs: any[] = []
): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiFunc(...args);
        
        if (!newAbortController.signal.aborted) {
          setData(result);
        }
        
        return result;
      } catch (err) {
        if (!newAbortController.signal.aborted) {
          const apiError = err as ApiError;
          setError(apiError);
          throw apiError;
        }
        throw err;
      } finally {
        if (!newAbortController.signal.aborted) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [apiFunc]
  );
  
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    cancel();
    setData(null);
    setLoading(false);
    setError(null);
  }, [cancel]);
  
  // We need to stringify initialArgs to prevent re-running the effect on every render
  const initialArgsString = JSON.stringify(initialArgs);

  useEffect(() => {
    if (immediate) {
      const args = JSON.parse(initialArgsString);
      execute(...args).catch(() => {
        // Prevent unhandled promise rejection warning
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, execute, initialArgsString]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return { data, loading, error, execute, reset, cancel };
};

export default useApi;
