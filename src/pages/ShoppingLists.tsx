import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, ChevronDown, ChevronRight, Download, ShoppingBasket, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import MoreMenu from '../components/ui/MoreMenu';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import ExportShoppingListModal from '../components/shoppingLists/ExportShoppingListModal';
import { ShoppingList as ShoppingListType } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingLists, deleteShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import { formatMealPlanRange, toDateKey } from '../utils/mealPlanUtils';
import { formatDate } from '../utils/dateUtils';
import { getListProgress, getShoppingListTitle } from '../utils/shoppingListUtils';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const { mode } = useAuth();
  const locale = getLocaleFromLanguage(i18n.language);
  const [showArchive, setShowArchive] = useState(false);
  // The week a list is for is its name; lists without a plan go by the day they were made
  const listName = (list: ShoppingListType) =>
    list.meal_plan ? formatMealPlanRange(list.meal_plan, locale) : formatDate(list.created_at, locale);

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
        <div className="space-y-4" aria-busy="true" aria-label={t('shoppingLists.loadingShoppingLists')}>
          {/* Same shape as the list cards: name, product count, button */}
          {[0, 1].map((i) => (
            <Card key={i} padding="none">
              <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-28" />
              </CardContent>
            </Card>
          ))}
          <Skeleton className="h-12" />
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
            <Card key={list.id} padding="none">
              <CardContent className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
                {/* The name opens the list; the products are inside, not repeated here */}
                <Link to={`/shopping-lists/${list.id}`} className="group min-w-0 flex-1">
                  <h2 className="truncate text-base sm:text-lg font-semibold text-neutral-900 first-letter:uppercase group-hover:text-primary-700">
                    {listName(list)}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {t('shoppingLists.productCount', { count: getListProgress(list.items).total })}
                  </p>
                </Link>
                <Button onClick={() => navigate(`/shopping-lists/${list.id}?store=1`)} className="shrink-0">
                  {/* No icon on phones: the list name needs the room */}
                  <ShoppingBasket size={18} className="mr-2 hidden sm:block" aria-hidden="true" />
                  {t('shoppingLists.storeMode.open')}
                </Button>
                <MoreMenu
                  items={[
                    {
                      label: exportingId === list.id ? t('common.loading') : t('common.export'),
                      icon: <Download size={16} />,
                      onClick: () => handleExportList(list),
                    },
                    ...(mode === 'owner'
                      ? [{ label: t('common.delete'), icon: <Trash2 size={16} />, onClick: () => handleDeleteList(list.id), danger: true }]
                      : []),
                  ]}
                />
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
                  {archivedLists.map((list) => (
                    <li key={list.id}>
                      <Link
                        to={`/shopping-lists/${list.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                      >
                        <span className="font-medium text-neutral-900 first-letter:uppercase">{listName(list)}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
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
