import { useEffect } from 'react';

/**
 * Keeps the screen on while the calling component is mounted and the page is visible.
 * Uses the Screen Wake Lock API (iOS Safari 16.4+, installed PWAs from iOS 18.4).
 * Silently does nothing where unsupported or denied (e.g. Low Power Mode).
 * The browser drops the lock whenever the page is hidden, so it is re-requested on return.
 */
export function useWakeLock(enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        // Denied or not allowed right now; ignore.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sentinel) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void sentinel?.release();
      sentinel = null;
    };
  }, [enabled]);
}
