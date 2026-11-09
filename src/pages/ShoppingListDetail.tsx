import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CloudOff, RefreshCw } from 'lucide-react';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListView from '../components/shoppingLists/ShoppingListView';
import { ShoppingList } from '../types';
import useApi from '../hooks/useApi';
import useShoppingListSync from '../hooks/useShoppingListSync';
import { useWakeLock } from '../hooks/useWakeLock';
import { getShoppingList } from '../api/shoppingListApi';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import {
  ShoppingLine,
  formatLineQuantity,
  getShoppingListTitle,
  groupShoppingLines,
  isLineBought,
  isPantryItem,
  toggleLine,
} from '../utils/shoppingListUtils';

// How often an open list re-checks the server for changes made on other devices
const SHOPPING_LIST_POLL_MS = 10000;

const ShoppingListDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useWakeLock(); // keep the screen on while shopping

  const shoppingListId = id ? parseInt(id, 10) : null;
  const locale = getLocaleFromLanguage(i18n.language);

  const { data: shoppingList, loading, error, execute: fetchShoppingList } = useApi<ShoppingList>(getShoppingList);
  // When the request behind `shoppingList` started; lets checkbox sync tell stale responses apart
  const [fetchedAt, setFetchedAt] = useState(0);

  // Load shopping list when component mounts
  const loadShoppingList = useCallback(() => {
    if (shoppingListId) {
      const startedAt = Date.now();
      fetchShoppingList(shoppingListId)
        .then(() => setFetchedAt(startedAt))
        .catch(() => undefined); // shown through `error`
    }
  }, [fetchShoppingList, shoppingListId]);

  useEffect(() => {
    // If no valid ID, redirect to shopping lists
    if (!shoppingListId || isNaN(shoppingListId)) {
      navigate('/shopping-lists', { replace: true });
      return;
    }

    loadShoppingList();
  }, [shoppingListId, navigate, loadShoppingList]);

  // Pick up checks made on other devices when the user comes back to this tab
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadShoppingList();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [loadShoppingList]);

  // While the list stays open (and the screen on), poll so another person's checks show up
  // without any interaction. Also refresh on window focus and when the connection returns.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') loadShoppingList();
    };
    const timer = window.setInterval(refreshIfVisible, SHOPPING_LIST_POLL_MS);
    window.addEventListener('focus', refreshIfVisible);
    window.addEventListener('online', refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener('online', refreshIfVisible);
    };
  }, [loadShoppingList]);

  const { statuses, toggle, hasPending, syncFailed } = useShoppingListSync(shoppingListId, shoppingList?.items, fetchedAt);
  // One line per product; salt, water and spices go to "Check at home"
  const { lines, pantryLines } = useMemo(() => {
    const all = groupShoppingLines(shoppingList?.items ?? []);
    return {
      lines: all.filter((line) => !line.items.every(isPantryItem)),
      pantryLines: all.filter((line) => line.items.every(isPantryItem)),
    };
  }, [shoppingList?.items]);
  const purchasedCount = lines.filter((line) => isLineBought(line, statuses)).length;
  const quantityOf = useCallback(
    (line: ShoppingLine) => formatLineQuantity(line, t, locale),
    [t, locale]
  );
  const onToggleLine = useCallback((line: ShoppingLine) => toggleLine(line, statuses, toggle), [statuses, toggle]);

  const handleBack = () => {
    navigate('/shopping-lists');
  };

  if (!shoppingListId) {
    return null;
  }

  return (
    <Container className="py-6 sm:py-8 lg:py-12" maxWidth="3xl">
      <Button
        variant="ghost"
        onClick={handleBack}
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        className="mb-4 hidden lg:inline-flex"
      >
        {t('shoppingLists.backToShoppingLists')}
      </Button>

      {/* The list itself is the in-store view: one screen to shop from */}
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {shoppingList ? (
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 first-letter:uppercase">
              {getShoppingListTitle(shoppingList, t, locale)}
            </h1>
          ) : (
            <Skeleton className="h-8 w-48" />
          )}
          {shoppingList && lines.length > 0 && (
            <p className="mt-1 text-sm text-neutral-500">
              {t('shoppingLists.storeMode.progress', { bought: purchasedCount, total: lines.length })}
            </p>
          )}
        </div>
        {syncFailed ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-warning-600">
            <CloudOff className="h-3.5 w-3.5" />
            {t('shoppingLists.syncOffline')}
          </span>
        ) : hasPending ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-neutral-500">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            {t('shoppingLists.syncSaving')}
          </span>
        ) : null}
      </div>

      {loading && !shoppingList && (
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4" aria-busy="true" aria-label={t('shoppingLists.loadingShoppingList')}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}

      {error && !shoppingList && (
        <ErrorMessage
          title={t('shoppingLists.failedToLoadSingle')}
          message={error.message}
          onRetry={loadShoppingList}
        />
      )}

      {shoppingList && shoppingList.items.length === 0 && (
        <div className="rounded-lg border border-neutral-200 bg-white py-8 text-center text-neutral-500">
          {t('shoppingLists.emptyList')}
        </div>
      )}

      {shoppingList && shoppingList.items.length > 0 && (
        <ShoppingListView
          listId={shoppingList.id}
          lines={lines}
          pantryLines={pantryLines}
          statuses={statuses}
          quantityOf={quantityOf}
          onToggle={onToggleLine}
        />
      )}
    </Container>
  );
};

export default ShoppingListDetail;
