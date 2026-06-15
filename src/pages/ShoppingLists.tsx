import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import ExportShoppingListModal from '../components/shoppingLists/ExportShoppingListModal';
import { ShoppingList as ShoppingListType, ShoppingListItem as ShoppingListItemType } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingLists, deleteShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { copyTextToClipboard } from '../utils/clipboardUtils';

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

// Preview component that shows grouped items with a limit
const ShoppingListPreview: React.FC<{ items: ShoppingListItemType[] }> = ({ items }) => {
  const { t } = useTranslation();
  
  const groupedItems = useMemo(() => groupItemsByCategory(items), [items]);
  const sortedCategories = useMemo(() => 
    Object.keys(groupedItems).sort((a, b) => a.localeCompare(b)), 
    [groupedItems]
  );
  
  // Limit to show first 5 items total across all categories
  const MAX_PREVIEW_ITEMS = 5;
  let itemCount = 0;
  
  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {sortedCategories.map((category) => {
        if (itemCount >= MAX_PREVIEW_ITEMS) return null;
        
        const categoryItems = groupedItems[category];
        const remainingSlots = MAX_PREVIEW_ITEMS - itemCount;
        const itemsToShow = categoryItems.slice(0, remainingSlots);
        itemCount += itemsToShow.length;
        
        return (
          <div key={category}>
            <h4 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
              {category}
            </h4>
            <div className="space-y-1">
              {itemsToShow.map((item) => (
                <ShoppingListItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          </div>
        );
      })}
      {items.length > MAX_PREVIEW_ITEMS && (
        <div className="text-center py-2 text-sm text-neutral-500 border-t border-neutral-200">
          {t('common.moreItems', { count: items.length - MAX_PREVIEW_ITEMS })}
        </div>
      )}
    </div>
  );
};

const ShoppingLists: React.FC = () => {
  const { t } = useTranslation();
  const { data: shoppingLists, loading, error, execute: fetchShoppingLists } = useApi<ShoppingListType[]>(getShoppingLists);

  const [exportingId, setExportingId] = useState<number | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportModalTitle, setExportModalTitle] = useState('');
  const [exportModalContent, setExportModalContent] = useState('');

  // Load shopping lists only once on mount
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  const handleExportList = async (id: number) => {
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
      setExportModalTitle(`${t('shoppingLists.shoppingListNumber', { id })} - ${t('common.export')}`);
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
        <div className="py-12">
          <Loader centered label={t('shoppingLists.loadingShoppingLists')} />
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
          {shoppingLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle>{t('shoppingLists.shoppingListNumber', { id: list.id })}</CardTitle>
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
                   <div className="flex items-center gap-2">
                     <Button
                       variant="outline"
                       size="sm"
                       leftIcon={<Download size={16} />}
                       onClick={() => handleExportList(list.id)}
                       isLoading={exportingId === list.id}
                     >
                       {t('common.export')}
                     </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                      onClick={() => handleDeleteList(list.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ShoppingListPreview items={list.items} />
              </CardContent>
            </Card>
          ))}
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
