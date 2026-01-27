import React, { useEffect } from 'react';
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
import { ShoppingList as ShoppingListType } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingLists, deleteShoppingList, exportShoppingList } from '../api/shoppingListApi';

const ShoppingLists: React.FC = () => {
  const { t } = useTranslation();
  const { data: shoppingLists, loading, error, execute: fetchShoppingLists } = useApi<ShoppingListType[]>(getShoppingLists);

  // Load shopping lists only once on mount
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);

  const handleExportList = async (id: number) => {
    try {
      const result = await exportShoppingList(id);
      const text = typeof (result as any)?.content === 'string' ? (result as any).content : JSON.stringify(result, null, 2);
      await navigator.clipboard.writeText(text);
      alert(t('common.copiedToClipboard'));
    } catch (err) {
      console.error('Failed to export shopping list:', err);
      alert(t('shoppingLists.exportFailed'));
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {list.items.slice(0, 5).map((item) => (
                    <ShoppingListItem
                      key={item.id}
                      item={item}
                    />
                  ))}
                  {list.items.length > 5 && (
                    <div className="text-center py-2 text-sm text-neutral-500 border-t border-neutral-200">
                      {t('common.moreItems', { count: list.items.length - 5 })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default ShoppingLists;
