import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, ArrowLeft } from 'lucide-react';
import Container from '../components/layout/Container';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import { ShoppingList } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingList, exportShoppingList } from '../api/shoppingListApi';
import { getLocaleFromLanguage } from '../utils/i18nUtils';

const ShoppingListDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const shoppingListId = id ? parseInt(id, 10) : null;

  const { data: shoppingList, loading, error, execute: fetchShoppingList } = useApi<ShoppingList>(getShoppingList);

  // Load shopping list when component mounts
  const loadShoppingList = useCallback(() => {
    if (shoppingListId) {
      fetchShoppingList(shoppingListId);
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

  const handleBack = () => {
    navigate('/shopping-lists');
  };

  const handleExport = () => {
    if (shoppingList) {
      exportShoppingList(shoppingList.id)
        .then(async (result) => {
          const text = typeof (result as any)?.content === 'string' ? (result as any).content : JSON.stringify(result, null, 2);
          await navigator.clipboard.writeText(text);
          alert(t('common.copiedToClipboard'));
        })
        .catch((err) => {
          console.error('Failed to export shopping list:', err);
          alert(t('shoppingLists.exportFailed'));
        });
    }
  };

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
          </div>

          {shoppingList && (
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              {t('shoppingLists.exportList')}
            </Button>
          )}
        </div>
      </div>

      {loading && (
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
            <CardTitle>
              {t('shoppingLists.items')} ({shoppingList.items.length})
            </CardTitle>
          </CardHeader>

          <CardContent>
            {shoppingList.items.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                {t('shoppingLists.emptyList')}
              </div>
            ) : (
              <div className="space-y-2">
                {shoppingList.items.map((item) => (
                  <ShoppingListItem
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default ShoppingListDetail;
