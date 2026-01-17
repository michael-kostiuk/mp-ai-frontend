import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../types';

interface UseApiResult<T, TArgs extends unknown[] = unknown[]> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: TArgs) => Promise<T>;
  reset: () => void;
  cancel: () => void;
}

const useApi = <T, TArgs extends unknown[] = unknown[]>(
  apiFunc: (...args: TArgs) => Promise<T>,
  immediate = false,
  initialArgs: TArgs = [] as unknown as TArgs
): UseApiResult<T, TArgs> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
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
      const args = JSON.parse(initialArgsString) as TArgs;
      execute(...args).catch(() => undefined);
    }
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
