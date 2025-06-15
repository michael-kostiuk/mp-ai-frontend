import { useState, useCallback, useEffect } from 'react';
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
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        // Cancel previous request if it exists
        if (abortController) {
          abortController.abort();
        }

        // Create new abort controller
        const newAbortController = new AbortController();
        setAbortController(newAbortController);
        
        setLoading(true);
        setError(null);
        
        const result = await apiFunc(...args);
        
        // Only update state if request wasn't cancelled
        if (!newAbortController.signal.aborted) {
          setData(result);
          setLoading(false); // Set loading to false here
          setAbortController(null);
        }
        
        return result;
      } catch (err) {
        // Only handle error if request wasn't cancelled
        if (!abortController || !abortController.signal.aborted) {
          const apiError = err as ApiError;
          setError(apiError);
          setLoading(false); // Set loading to false on error
          setAbortController(null);
          throw apiError;
        }
        throw err;
      }
    },
    [apiFunc, abortController]
  );
  
  const cancel = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoading(false);
    }
  }, [abortController]);
  
  const reset = useCallback(() => {
    cancel();
    setData(null);
    setLoading(false);
    setError(null);
  }, [cancel]);
  
  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute(...initialArgs);
    }
  }, [immediate, execute, initialArgs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);
  
  return { data, loading, error, execute, reset, cancel };
};

export default useApi;