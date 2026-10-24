// Persistent client cache for meal plan and recipe reads (stale-while-revalidate).
// Entries live in localStorage so a page seen once renders instantly on the next visit.
// Any write to meal plans, recipes or ingredients drops the whole cache: the client never
// patches its copy, it always refetches the server's version.

const PREFIX = 'mp-cache:v1:';
const MODE_KEY = 'mp-cache-mode';

type Listener = () => void;

const listeners = new Set<Listener>();
// Bumped on every invalidation; fetches started before the bump must not write to the cache.
let generation = 0;

const safeKeys = (): string[] => {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  } catch {
    return [];
  }
};

export const getCacheGeneration = (): number => generation;

export const readCache = <T>(key: string): T | undefined => {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
};

export const writeCache = (key: string, value: unknown, startedAt: number): void => {
  if (startedAt !== generation) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked: caching is best effort.
  }
};

const clearEntries = (): void => {
  safeKeys().forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  });
};

export const invalidateCache = (): void => {
  generation += 1;
  clearEntries();
  listeners.forEach((listener) => listener());
};

export const subscribeCache = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Demo and owner data must never mix: drop the cache when the session mode differs
// from the one the cache was filled under.
export const syncCacheMode = (mode: string): void => {
  let previous: string | null = null;
  try {
    previous = localStorage.getItem(MODE_KEY);
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    return;
  }
  if (previous !== mode) invalidateCache();
};

export const clearCacheForSessionChange = (): void => {
  try {
    localStorage.removeItem(MODE_KEY);
  } catch {
    // ignore
  }
  generation += 1;
  clearEntries();
};

// Writes that can change cached meal plans or recipes. Read-only POSTs are excluded.
const MUTATING_PATH = /^\/(meal-plans|recipes|ingredients)(\/|\?|$)/;
const READ_ONLY_PATH = /^\/(meal-plans\/suggest-meal|recipes\/parse-from-image)/;

export const isCacheMutation = (endpoint: string): boolean =>
  MUTATING_PATH.test(endpoint) && !READ_ONLY_PATH.test(endpoint);
