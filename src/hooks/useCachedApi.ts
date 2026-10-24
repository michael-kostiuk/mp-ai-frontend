import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../types';
import { getCacheGeneration, readCache, subscribeCache, writeCache } from '../utils/apiCache';

interface UseCachedApiResult<T, TArgs extends unknown[] = unknown[]> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: TArgs) => Promise<T>;
}

interface UseCachedApiOptions<TArgs> {
  // Fetch on mount with initialArgs (like useApi's `immediate`)
  immediate?: boolean;
  // Args the component loads first; cached data for them renders on the very first frame
  initialArgs?: TArgs;
}

const cacheKey = (name: string, args: unknown[]): string => `${name}:${JSON.stringify(args)}`;

/**
 * useApi with stale-while-revalidate: a cached response (from localStorage) is shown at once
 * and `loading` stays false while the server copy is fetched in the background. The fresh copy
 * replaces it only if it differs. After a cache invalidation (any meal plan/recipe write) the
 * hook refetches its last request from the server.
 */
const useCachedApi = <T, TArgs extends unknown[] = unknown[]>(
  cacheName: string,
  apiFunc: (...args: TArgs) => Promise<T>,
  { immediate = false, initialArgs }: UseCachedApiOptions<TArgs> = {}
): UseCachedApiResult<T, TArgs> => {
  const [data, setData] = useState<T | null>(() =>
    initialArgs ? readCache<T>(cacheKey(cacheName, initialArgs)) ?? null : null
  );
  const [loading, setLoading] = useState<boolean>(immediate && data === null);
  const [error, setError] = useState<ApiError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // What is on screen, so a refetch of the same request can keep showing it
  const shownRef = useRef<{ key: string; json: string } | null>(
    data !== null && initialArgs ? { key: cacheKey(cacheName, initialArgs), json: JSON.stringify(data) } : null
  );
  const lastArgsRef = useRef<TArgs | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<T> => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      lastArgsRef.current = args;

      const key = cacheKey(cacheName, args);
      const cached = readCache<T>(key);
      let shownJson: string | null = null;
      if (cached !== undefined) {
        shownJson = JSON.stringify(cached);
        if (shownRef.current?.key !== key || shownRef.current.json !== shownJson) {
          setData(cached);
          shownRef.current = { key, json: shownJson };
        }
      } else if (shownRef.current?.key === key) {
        shownJson = shownRef.current.json;
      }
      const hasFallback = shownJson !== null;

      setLoading(!hasFallback);
      setError(null);
      const generation = getCacheGeneration();

      try {
        const result = await apiFunc(...args);
        writeCache(key, result, generation);
        if (!controller.signal.aborted) {
          const json = JSON.stringify(result);
          if (json !== shownJson) {
            setData(result);
            shownRef.current = { key, json };
          }
        }
        return result;
      } catch (err) {
        if (controller.signal.aborted) throw err;
        const apiError = err as ApiError;
        // Offline or server trouble: keep showing the cached copy. A 404 means it is gone.
        if (hasFallback && apiError.status !== 404) {
          return JSON.parse(shownJson as string) as T;
        }
        if (apiError.status === 404) {
          setData(null);
          shownRef.current = null;
        }
        setError(apiError);
        throw apiError;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [apiFunc, cacheName]
  );

  const executeRef = useRef(execute);
  executeRef.current = execute;

  // A write elsewhere dropped the cache: refetch what this component shows.
  useEffect(
    () =>
      subscribeCache(() => {
        const args = lastArgsRef.current;
        if (args) executeRef.current(...args).catch(() => undefined);
      }),
    []
  );

  const initialArgsString = JSON.stringify(initialArgs ?? []);

  useEffect(() => {
    if (immediate) {
      const args = JSON.parse(initialArgsString) as TArgs;
      execute(...args).catch(() => undefined);
    }
  }, [immediate, execute, initialArgsString]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, loading, error, execute };
};

export default useCachedApi;
