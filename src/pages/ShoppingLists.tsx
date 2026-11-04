import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Calendar, ChevronDown, Download, ExternalLink, MoreHorizontal, ShoppingBasket, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import ExportShoppingListModal from '../components/shoppingLists/ExportShoppingListModal';
import { ShoppingList as ShoppingListType, ShoppingListItem as ShoppingListItemType } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingLists, deleteShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import { formatMealPlanRange } from '../utils/mealPlanUtils';
import { formatDate } from '../utils/dateUtils';
import { formatLineQuantity, getListProgress, getShoppingListTitle } from '../utils/shoppingListUtils';
import { toDateKey } from '../utils/mealPlanUtils';
import { useAuth } from '../context/AuthContext';

// Preview: the first few products still to buy (salt, water and spices are left out)
const ShoppingListPreview: React.FC<{ items: ShoppingListItemType[] }> = ({ items }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);
  const toBuy = useMemo(
    () => getListProgress(items).lines.filter((line) => !line.items.every((item) => item.status === 'purchased')),
    [items]
  );

  const MAX_PREVIEW_ITEMS = 5;

  if (toBuy.length === 0) {
    return <p className="py-2 text-sm font-medium text-success-600">{t('shoppingLists.storeMode.allDone')}</p>;
  }

  return (
    <div className="space-y-1">
      {toBuy.slice(0, MAX_PREVIEW_ITEMS).map((line) => (
        <ShoppingListItem
          key={line.key}
          item={line.items[0]}
          checked={false}
          quantityText={formatLineQuantity(line, t, locale)}
        />
      ))}
      {toBuy.length > MAX_PREVIEW_ITEMS && (
        <div className="text-center py-2 text-sm text-neutral-500 border-t border-neutral-200">
          {t('shoppingLists.moreToBuy', { count: toBuy.length - MAX_PREVIEW_ITEMS })}
        </div>
      )}
    </div>
  );
};

// Lists for a week that hasn't ended (or made in the last week) stay on top; the rest is archive
const isActiveList = (list: ShoppingListType, todayKey: string) => {
  if (list.meal_plan) return list.meal_plan.end_date.slice(0, 10) >= todayKey;
  return Date.now() - new Date(list.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
};

const ShoppingLists: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { data: shoppingLists, loading, error, execute: fetchShoppingLists } = useApi<ShoppingListType[]>(getShoppingLists);

  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalTitle, setExportModalTitle] = useState('');
  const [exportModalContent, setExportModalContent] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { mode } = useAuth();
  const locale = getLocaleFromLanguage(i18n.language);
  const [showArchive, setShowArchive] = useState(false);

  // Newest first from the API. When no list is current, the newest one still stays on top.
  const { activeLists, archivedLists } = useMemo(() => {
    const all = shoppingLists ?? [];
    const todayKey = toDateKey(new Date());
    const active = all.filter((list) => isActiveList(list, todayKey));
    const top = active.length > 0 ? active : all.slice(0, 1);
    return { activeLists: top, archivedLists: all.filter((list) => !top.includes(list)) };
  }, [shoppingLists]);

  // Load shopping lists only once on mount
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  const handleExportList = async (list: ShoppingListType) => {
    const id = list.id;
    setExportingId(id);
    try {
      const result = await exportShoppingList(id);
      const text = typeof (result as any)?.content === 'string' ? (result as any).content : JSON.stringify(result, null, 2);
      const copied = await copyTextToClipboard(text);
      if (copied) {
        alert(t('common.copiedToClipboard'));
        return;
      }

      // Mobile browsers often block clipboard writes after awaited async work.
      // Show the exported content so the user can copy/share from a direct gesture.
      setExportModalTitle(`${getShoppingListTitle(list, t, locale)} - ${t('common.export')}`);
      setExportModalContent(text);
      setExportModalOpen(true);
    } catch (err) {
      console.error('Failed to export shopping list:', err);
      alert(t('shoppingLists.exportFailed'));
    } finally {
      setExportingId(null);
    }
  };

  const handleDeleteList = async (id: number) => {
    setMenuOpenId(null);
    if (window.confirm(t('shoppingLists.deleteConfirm'))) {
      try {
        await deleteShoppingList(id);
        fetchShoppingLists();
      } catch (err) {
        console.error('Failed to delete shopping list:', err);
        alert(t('shoppingLists.deleteError'));
      }
    }
  };

  return (
    <Container className="py-8">
      <PageHeader
        title={t('shoppingLists.title')}
        description={t('shoppingLists.description')}
      />

      {loading && shoppingLists === null && (
        <div className="space-y-6" aria-busy="true" aria-label={t('shoppingLists.loadingShoppingLists')}>
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <ErrorMessage
          title={t('shoppingLists.failedToLoad')}
          message={error.message}
          onRetry={fetchShoppingLists}
        />
      )}

      {shoppingLists && shoppingLists.length === 0 && (
        <div className="py-12 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
          <p className="text-neutral-500 mb-4">{t('shoppingLists.noShoppingLists')}</p>
          <p className="text-neutral-500 text-sm mb-4">
            {t('shoppingLists.createMealPlanFirst')}
          </p>
          <Link to="/meal-plans">
            <Button>{t('shoppingLists.goToMealPlans')}</Button>
          </Link>
        </div>
      )}

      {shoppingLists && shoppingLists.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {activeLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle>{getShoppingListTitle(list, t, locale)}</CardTitle>
                      <Link to={`/shopping-lists/${list.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          rightIcon={<ExternalLink size={14} />}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {t('common.viewDetails')}
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-neutral-500">
                      <span>
                        {formatDate(list.created_at, locale)}
                      </span>
                      {list.meal_plan && (
                        <Link
                          to={`/meal-plans/${list.meal_plan.id}`}
                          className="inline-flex items-center gap-1 font-medium text-primary-600 hover:text-primary-700 transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          {t('shoppingLists.fromMealPlan', {
                            range: formatMealPlanRange(list.meal_plan, locale),
                          })}
                        </Link>
                      )}
                      <span>
                        {(() => {
                          const { bought, total } = getListProgress(list.items);
                          return t('shoppingLists.purchasedCount', { purchased: bought, total });
                        })()}
                      </span>
                    </div>
                  </div>
                   <div className="flex items-center gap-2">
                     <Button
                       size="sm"
                       leftIcon={<ShoppingBasket size={16} />}
                       onClick={() => navigate(`/shopping-lists/${list.id}?store=1`)}
                     >
                       {t('shoppingLists.storeMode.open')}
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       leftIcon={<Download size={16} />}
                       onClick={() => handleExportList(list)}
                       isLoading={exportingId === list.id}
                     >
                       {t('common.export')}
                     </Button>
                    {/* Delete sits behind a menu so it can't be tapped by accident */}
                    {mode === 'owner' && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMenuOpenId(menuOpenId === list.id ? null : list.id)}
                          aria-label={t('common.moreActions')}
                          aria-expanded={menuOpenId === list.id}
                        >
                          <MoreHorizontal size={18} />
                        </Button>
                        {menuOpenId === list.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} aria-hidden="true" />
                            <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => handleDeleteList(list.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50"
                              >
                                <Trash2 size={16} />
                                {t('common.delete')}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ShoppingListPreview items={list.items} />
              </CardContent>
            </Card>
          ))}

          {archivedLists.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowArchive(!showArchive)}
                aria-expanded={showArchive}
                className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  {t('shoppingLists.archive', { count: archivedLists.length })}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showArchive ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {showArchive && (
                <ul className="mt-2 divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                  {archivedLists.map((list) => {
                    const { bought, total } = getListProgress(list.items);
                    return (
                      <li key={list.id}>
                        <Link
                          to={`/shopping-lists/${list.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                        >
                          <span className="font-medium text-neutral-900">{getShoppingListTitle(list, t, locale)}</span>
                          <span className="shrink-0 text-sm text-neutral-500">
                            {t('shoppingLists.purchasedCount', { purchased: bought, total })}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
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

export default ShoppingLists;
