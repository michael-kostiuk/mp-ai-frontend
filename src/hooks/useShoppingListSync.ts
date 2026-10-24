import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, ShoppingListItem, ShoppingListItemStatus } from '../types';
import { updateShoppingListItemsStatus } from '../api/shoppingListApi';

// Checkbox changes not yet confirmed by the server, per list. Survives refreshes
// and closed tabs; whatever is left here is re-sent the next time the list opens.
const STORAGE_PREFIX = 'mp:shopping-list-pending:';
// Batch quick taps into one request
const FLUSH_DELAY_MS = 800;
const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000];

type StatusMap = Record<number, ShoppingListItemStatus>;

const readPending = (listId: number): StatusMap => {
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${listId}`);
    return raw ? (JSON.parse(raw) as StatusMap) : {};
  } catch {
    return {};
  }
};

const writePending = (listId: number, pending: StatusMap) => {
  try {
    const key = `${STORAGE_PREFIX}${listId}`;
    if (Object.keys(pending).length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(pending));
    }
  } catch {
    // Storage unavailable (private mode, quota): sync still works while the page is open
  }
};

const toUpdates = (statuses: StatusMap) =>
  Object.entries(statuses).map(([id, status]) => ({ id: Number(id), status }));

// Entries toggled again while a request was in flight are kept
const withoutSent = (current: StatusMap, sent: StatusMap): StatusMap => {
  const next = { ...current };
  for (const [id, status] of Object.entries(sent)) {
    if (next[Number(id)] === status) delete next[Number(id)];
  }
  return next;
};

// Client errors other than timeouts/rate limits will never succeed on retry
const isPermanentFailure = (error: unknown) => {
  const status = (error as ApiError)?.status;
  return typeof status === 'number' && status >= 400 && status < 500 && status !== 408 && status !== 429;
};

interface UseShoppingListSyncResult {
  statuses: StatusMap;
  toggle: (itemId: number) => void;
  hasPending: boolean;
  syncFailed: boolean;
}

/**
 * Optimistic, non-blocking checkbox state for one shopping list.
 *
 * A toggle updates the UI and localStorage immediately, then is sent to the
 * server in a debounced batch. Unsent changes are flushed with `keepalive` when
 * the page is hidden or closed, retried with backoff on failure, and re-applied
 * on top of fresh server data so a refresh never loses them.
 *
 * `fetchedAt` is when the request that produced `serverItems` started: a change
 * the server confirmed after that moment is newer than the response.
 */
const useShoppingListSync = (
  listId: number | null,
  serverItems: ShoppingListItem[] | undefined,
  fetchedAt: number
): UseShoppingListSyncResult => {
  const pendingRef = useRef<StatusMap>({});
  const [pending, setPending] = useState<StatusMap>({});
  // Server state as far as we know it: the last response plus changes it has confirmed since
  const [confirmed, setConfirmed] = useState<StatusMap>({});
  const ackedAtRef = useRef<Record<number, { status: ShoppingListItemStatus; at: number }>>({});
  const [syncFailed, setSyncFailed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const retryIndexRef = useRef(0);

  const commitPending = useCallback((next: StatusMap) => {
    pendingRef.current = next;
    setPending(next);
    if (listId) writePending(listId, next);
  }, [listId]);

  const flushRef = useRef<(keepalive?: boolean) => Promise<void>>(async () => undefined);

  const schedule = useCallback((delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void flushRef.current();
    }, delay);
  }, []);

  const flush = useCallback(async (keepalive = false) => {
    if (!listId) return;
    const snapshot = pendingRef.current;
    if (Object.keys(snapshot).length === 0) return;
    // A page being hidden must not wait for an in-flight request
    if (inFlightRef.current && !keepalive) {
      schedule(FLUSH_DELAY_MS);
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    inFlightRef.current = true;
    try {
      await updateShoppingListItemsStatus(listId, toUpdates(snapshot), { keepalive });
      retryIndexRef.current = 0;
      setSyncFailed(false);
      const at = Date.now();
      for (const [id, status] of Object.entries(snapshot)) {
        ackedAtRef.current[Number(id)] = { status, at };
      }
      setConfirmed((prev) => ({ ...prev, ...snapshot }));
      commitPending(withoutSent(pendingRef.current, snapshot));
    } catch (error) {
      if (isPermanentFailure(error)) {
        // List or items are gone; keeping them would retry forever
        commitPending(withoutSent(pendingRef.current, snapshot));
      } else {
        setSyncFailed(true);
        const delay = RETRY_DELAYS_MS[Math.min(retryIndexRef.current, RETRY_DELAYS_MS.length - 1)];
        retryIndexRef.current += 1;
        schedule(delay);
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [listId, schedule, commitPending]);

  flushRef.current = flush;

  // Load changes left over from an earlier visit and send them
  useEffect(() => {
    if (!listId) return;
    const stored = readPending(listId);
    pendingRef.current = stored;
    setPending(stored);
    retryIndexRef.current = 0;
    if (Object.keys(stored).length > 0) schedule(0);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      // Leaving this list within the debounce window: send now. Uses the captured
      // id, as flushRef may already point at the next list.
      const leftover = pendingRef.current;
      if (Object.keys(leftover).length === 0) return;
      updateShoppingListItemsStatus(listId, toUpdates(leftover), { keepalive: true })
        .then(() => writePending(listId, withoutSent(readPending(listId), leftover)))
        .catch(() => undefined); // still in storage, re-sent on the next visit
    };
  }, [listId, schedule]);

  useEffect(() => {
    const flushNow = () => void flushRef.current(true);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    const onOnline = () => {
      retryIndexRef.current = 0;
      void flushRef.current();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushNow);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    const fromServer: StatusMap = {};
    for (const item of serverItems ?? []) {
      const acked = ackedAtRef.current[item.id];
      if (acked && acked.at >= fetchedAt) {
        // Response was requested before the server confirmed our change
        fromServer[item.id] = acked.status;
      } else {
        delete ackedAtRef.current[item.id];
        fromServer[item.id] = item.status === 'purchased' ? 'purchased' : 'pending';
      }
    }
    setConfirmed(fromServer);
  }, [serverItems, fetchedAt]);

  // Unsent local changes on top of server state
  const statuses = useMemo(() => ({ ...confirmed, ...pending }), [confirmed, pending]);

  const toggle = useCallback((itemId: number) => {
    const current = pendingRef.current[itemId] ?? confirmed[itemId] ?? 'pending';
    const nextStatus: ShoppingListItemStatus = current === 'purchased' ? 'pending' : 'purchased';
    commitPending({ ...pendingRef.current, [itemId]: nextStatus });
    schedule(FLUSH_DELAY_MS);
  }, [confirmed, commitPending, schedule]);

  return {
    statuses,
    toggle,
    hasPending: Object.keys(pending).length > 0,
    syncFailed,
  };
};

export default useShoppingListSync;
