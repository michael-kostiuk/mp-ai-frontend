import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '../types';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
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
  
  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiFunc(...args);
        setData(result);
        return result;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );
  
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);
  
  // Execute immediately if specified
  useEffect(() => {
    if (immediate) {
      execute(...initialArgs);
    }
  }, [immediate, execute, initialArgs]);
  
  return { data, loading, error, execute, reset };
};

export default useApi;