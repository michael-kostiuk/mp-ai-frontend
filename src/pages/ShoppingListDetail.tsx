import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, ArrowLeft, Calendar, CloudOff, RefreshCw } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import ExportShoppingListModal from '../components/shoppingLists/ExportShoppingListModal';
import { ShoppingList, ShoppingListItem as ShoppingListItemType } from '../types';
import useApi from '../hooks/useApi';
import useShoppingListSync from '../hooks/useShoppingListSync';
import { getShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import { formatMealPlanRange } from '../utils/mealPlanUtils';

// Helper function to normalize category name (capitalize first letter)
const normalizeCategory = (category: string): string => {
  if (!category) return 'Other';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

// Helper function to group items by category (case-insensitive)
const groupItemsByCategory = (items: ShoppingListItemType[]): Record<string, ShoppingListItemType[]> => {
  return items.reduce((acc, item) => {
    const category = normalizeCategory(item.category || 'other');
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItemType[]>);
};

const ShoppingListDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalTitle, setExportModalTitle] = useState('');
  const [exportModalContent, setExportModalContent] = useState('');
  const [exporting, setExporting] = useState(false);

  const shoppingListId = id ? parseInt(id, 10) : null;

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
  const purchasedCount = shoppingList?.items.filter((item) => statuses[item.id] === 'purchased').length ?? 0;

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

      setExportModalTitle(`${t('shoppingLists.shoppingListNumber', { id: shoppingList.id })} - ${t('common.export')}`);
      setExportModalContent(text);
      setExportModalOpen(true);
    } catch (err) {
      console.error('Failed to export shopping list:', err);
      alert(t('shoppingLists.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!shoppingList?.items) return {};
    return groupItemsByCategory(shoppingList.items);
  }, [shoppingList?.items]);

  // Sort categories alphabetically
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
  }, [groupedItems]);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              {t('shoppingLists.shoppingListNumber', { id: shoppingListId })}
            </h1>
            {shoppingList && (
              <p className="text-neutral-500 mt-1">
                {t('shoppingLists.createdOn')} {new Date(shoppingList.created_at).toLocaleDateString(getLocaleFromLanguage(i18n.language))}
              </p>
            )}
            {shoppingList?.meal_plan && (
              <Link
                to={`/meal-plans/${shoppingList.meal_plan.id}`}
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                {t('shoppingLists.fromMealPlan', {
                  range: formatMealPlanRange(shoppingList.meal_plan, getLocaleFromLanguage(i18n.language)),
                })}
              </Link>
            )}
          </div>

          {shoppingList && (
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              isLoading={exporting}
            >
              {t('shoppingLists.exportList')}
            </Button>
          )}
        </div>
      </div>

      {loading && !shoppingList && (
        <div className="py-12">
          <Loader centered label={t('shoppingLists.loadingShoppingList')} />
        </div>
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
                {t('shoppingLists.items')} ({purchasedCount}/{shoppingList.items.length})
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
                {sortedCategories.map((category) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3 pb-2 border-b border-neutral-200">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {groupedItems[category].map((item) => (
                        <ShoppingListItem
                          key={item.id}
                          item={item}
                          checked={statuses[item.id] === 'purchased'}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
