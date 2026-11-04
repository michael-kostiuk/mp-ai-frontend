import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, ArrowLeft, Calendar, CloudOff, Home, RefreshCw, ShoppingBasket } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import ExportShoppingListModal from '../components/shoppingLists/ExportShoppingListModal';
import ShoppingModeView from '../components/shoppingLists/ShoppingModeView';
import { ShoppingList } from '../types';
import useApi from '../hooks/useApi';
import useShoppingListSync from '../hooks/useShoppingListSync';
import { getShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import { formatMealPlanRange } from '../utils/mealPlanUtils';
import { formatDate } from '../utils/dateUtils';
import {
  ShoppingLine,
  formatLineQuantity,
  getShoppingListTitle,
  groupShoppingLines,
  isLineBought,
  isPantryItem,
  toggleLine,
} from '../utils/shoppingListUtils';

const ShoppingListDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalTitle, setExportModalTitle] = useState('');
  const [exportModalContent, setExportModalContent] = useState('');
  const [exporting, setExporting] = useState(false);
  // "In the store" button on the lists page opens this page straight in store mode
  const [storeMode, setStoreMode] = useState(() => new URLSearchParams(location.search).get('store') === '1');

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

  const handleExport = async () => {
    if (!shoppingList) return;

    setExporting(true);
    try {
      const result = await exportShoppingList(shoppingList.id);
      const text = typeof (result as any)?.content === 'string' ? (result as any).content : JSON.stringify(result, null, 2);
      const copied = await copyTextToClipboard(text);
      if (copied) {
        alert(t('common.copiedToClipboard'));
        return;
      }

      setExportModalTitle(`${getShoppingListTitle(shoppingList, t, locale)} - ${t('common.export')}`);
      setExportModalContent(text);
      setExportModalOpen(true);
    } catch (err) {
      console.error('Failed to export shopping list:', err);
      alert(t('shoppingLists.exportFailed'));
    } finally {
      setExporting(false);
    }
  };


  const renderLine = (line: ShoppingLine) => (
    <ShoppingListItem
      key={line.key}
      item={line.items[0]}
      quantityText={quantityOf(line)}
      checked={isLineBought(line, statuses)}
      onToggle={() => onToggleLine(line)}
    />
  );

  if (!shoppingListId) {
    return null;
  }

  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <div className="mb-6 sm:mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          {t('shoppingLists.backToShoppingLists')}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {shoppingList ? (
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                {getShoppingListTitle(shoppingList, t, locale)}
              </h1>
            ) : (
              <Skeleton className="h-8 w-64" />
            )}
            {shoppingList && (
              <p className="text-neutral-500 mt-1">
                {t('shoppingLists.createdOn')} {formatDate(shoppingList.created_at, locale)}
              </p>
            )}
            {shoppingList?.meal_plan && (
              <Link
                to={`/meal-plans/${shoppingList.meal_plan.id}`}
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                {t('shoppingLists.fromMealPlan', {
                  range: formatMealPlanRange(shoppingList.meal_plan, locale),
                })}
              </Link>
            )}
          </div>

          {shoppingList && (
            <div className="flex flex-col sm:flex-row gap-2">
              {shoppingList.items.length > 0 && (
                <Button leftIcon={<ShoppingBasket className="h-4 w-4" />} onClick={() => setStoreMode(true)}>
                  {t('shoppingLists.storeMode.open')}
                </Button>
              )}
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExport}
                isLoading={exporting}
              >
                {t('shoppingLists.exportList')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading && !shoppingList && (
        <Card aria-busy="true" aria-label={t('shoppingLists.loadingShoppingList')}>
          <CardContent className="space-y-3 py-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <ErrorMessage
          title={t('shoppingLists.failedToLoadSingle')}
          message={error.message}
          onRetry={loadShoppingList}
        />
      )}

      {shoppingList && (
        <Card className="animate-fadeIn">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {t('shoppingLists.items')} ({purchasedCount}/{lines.length})
              </CardTitle>
              {syncFailed ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-warning-600">
                  <CloudOff className="h-3.5 w-3.5" />
                  {t('shoppingLists.syncOffline')}
                </span>
              ) : hasPending ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t('shoppingLists.syncSaving')}
                </span>
              ) : null}
            </div>
          </CardHeader>

          <CardContent>
            {shoppingList.items.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {t('shoppingLists.emptyList')}
              </div>
            ) : (
              <div className="space-y-6">
                {/* One plain alphabetical list, no category headings */}
                <div className="space-y-2">{lines.map(renderLine)}</div>
                {pantryLines.length > 0 && (
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      {t('shoppingLists.pantry.title')}
                    </h3>
                    <p className="mt-1 mb-3 text-sm text-neutral-500">{t('shoppingLists.pantry.hint')}</p>
                    <div className="space-y-2">{pantryLines.map(renderLine)}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {storeMode && shoppingList && (
        <ShoppingModeView
          title={getShoppingListTitle(shoppingList, t, locale)}
          lines={lines}
          pantryLines={pantryLines}
          statuses={statuses}
          quantityOf={quantityOf}
          onToggle={onToggleLine}
          onClose={() => {
            setStoreMode(false);
            if (location.search) navigate(location.pathname, { replace: true });
          }}
        />
      )}

      <ExportShoppingListModal
        isOpen={exportModalOpen}
        title={exportModalTitle}
        content={exportModalContent}
        onClose={() => setExportModalOpen(false)}
      />
    </Container>
  );
};

export default ShoppingListDetail;
