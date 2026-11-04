import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Merge, PlusCircle, Search, Sparkles, X } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import CreateIngredientModal from '../components/ingredients/CreateIngredientModal';
import MergeIngredientsModal from '../components/ingredients/MergeIngredientsModal';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import { useIngredientContext } from '../context/IngredientContext';
import useApi from '../hooks/useApi';
import { estimateIngredientNutrition, estimateMissingIngredientNutrition } from '../api/ingredientApi';
import { ApiError, Ingredient, IngredientNutritionBulkResponse } from '../types';
import { ZERO_CALORIE_CATEGORIES, getNutritionWarning } from '../utils/nutritionUtils';
import { formatUnitLabel } from '../utils/unitUtils';
import { ingredientCategoryLabel } from '../utils/categoryUtils';

const isMissingNutrition = (ingredient: Ingredient): boolean => {
  const values = [ingredient.calories, ingredient.protein, ingredient.carbs, ingredient.fats];
  const hasMissingValue = values.some((value) => value === null || value === undefined);
  // Zero is a real value for salt, water and seasoning mixes (matches the server's bulk estimate)
  if (ZERO_CALORIE_CATEGORIES.includes(ingredient.category.toLowerCase())) return hasMissingValue;
  const allZero = values.every((value) => value === 0);
  return hasMissingValue || allZero;
};

const Ingredients: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const formatEstimateError = useCallback((error: ApiError): string => {
    if (error.status === 429) {
      return t('ingredients.errors.rateLimitReached');
    }
    if (error.status === 503) {
      return t('ingredients.errors.serviceUnavailable');
    }
    return error.message || t('ingredients.errors.genericEstimateError');
  }, [t]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<IngredientNutritionBulkResponse | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [estimatingId, setEstimatingId] = useState<number | null>(null);
  const lastBulkRunRef = useRef(0);
  
  const { ingredients, loading, error, fetchIngredients } = useIngredientContext();

  const { loading: bulkEstimating, execute: runBulkEstimate } = useApi(estimateMissingIngredientNutrition);
  const { loading: rowEstimating, execute: runSingleEstimate } = useApi(estimateIngredientNutrition);

  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter(
        (ingredient) =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ingredient.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ingredientCategoryLabel(ingredient.category, t).toLowerCase().includes(searchQuery.toLowerCase())
      )
      // Alphabetical regardless of capital letters ("Greek yogurt" no longer jumps to the top)
      .sort((a, b) => a.name.localeCompare(b.name, i18n.language, { sensitivity: 'base' }));
  }, [ingredients, searchQuery, i18n.language, t]);

  const per100 = (ingredient: Ingredient) =>
    t('ingredients.table.per100', { unit: formatUnitLabel(ingredient.base_unit, t) });

  const renderWarning = (ingredient: Ingredient) => {
    const warning = getNutritionWarning(ingredient);
    if (!warning) return null;
    const message = t(`ingredients.warnings.${warning}`);
    return (
      <span className="inline-flex shrink-0 text-warning-600" title={message}>
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{message}</span>
      </span>
    );
  };

  const renderEstimate = (ingredient: Ingredient) =>
    isMissingNutrition(ingredient) ? (
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Sparkles size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          handleSingleEstimate(ingredient);
        }}
        isLoading={estimatingId === ingredient.id}
        disabled={bulkEstimating || rowEstimating || (estimatingId !== null && estimatingId !== ingredient.id)}
        title={estimatingId === ingredient.id ? t('ingredients.estimatingNutrition') : t('ingredients.fillMissingNutrition')}
      >
        {t('ingredients.estimate')}
      </Button>
    ) : null;

  const missingIngredients = useMemo(() => {
    return ingredients.filter(isMissingNutrition);
  }, [ingredients]);

  const missingCount = missingIngredients.length;

  const handleCreateSuccess = () => {
    // Refresh the ingredients list
    fetchIngredients();
  };

  const handleMergeSuccess = () => {
    // Refresh the ingredients list
    fetchIngredients();
  };

  const handleDismissBanner = useCallback(() => {
    setBulkSummary(null);
    setBulkError(null);
    setRowError(null);
  }, []);

  const handleOpenBulkModal = useCallback(() => {
    setBulkError(null);
    setRowError(null);
    setIsBulkModalOpen(true);
  }, []);

  const handleBulkEstimate = useCallback(async () => {
    if (bulkEstimating || rowEstimating || estimatingId !== null) return;
    if (missingCount === 0) {
      setIsBulkModalOpen(false);
      return;
    }

    const now = Date.now();
    if (now - lastBulkRunRef.current < 1000) return;
    lastBulkRunRef.current = now;

    setBulkError(null);
    setRowError(null);
    setBulkSummary(null);

    try {
      const summary = await runBulkEstimate();
      setBulkSummary(summary);
      setIsBulkModalOpen(false);
      fetchIngredients();
    } catch (err) {
      const error = err as ApiError;
      setBulkError(formatEstimateError(error));
    }
  }, [bulkEstimating, rowEstimating, estimatingId, missingCount, runBulkEstimate, fetchIngredients]);

  const handleSingleEstimate = useCallback(async (ingredient: Ingredient) => {
    if (bulkEstimating || rowEstimating || estimatingId !== null) return;
    if (!isMissingNutrition(ingredient)) return;

    setBulkError(null);
    setRowError(null);
    setBulkSummary(null);
    setEstimatingId(ingredient.id);

    try {
      await runSingleEstimate(ingredient.id);
      fetchIngredients();
    } catch (err) {
      const error = err as ApiError;
      setRowError(`Unable to estimate nutrition for ${ingredient.name}. ${formatEstimateError(error)}`);
    } finally {
      setEstimatingId(null);
    }
  }, [bulkEstimating, rowEstimating, estimatingId, runSingleEstimate, fetchIngredients]);
  
  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <PageHeader
        title={t('ingredients.title')}
        description={t('ingredients.description')}
        actions={
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="outline"
              leftIcon={<Sparkles size={18} />}
              onClick={handleOpenBulkModal}
              disabled={bulkEstimating || rowEstimating || estimatingId !== null || missingCount === 0}
              className="w-full sm:w-auto"
              title={missingCount === 0 ? t('ingredients.bulk.allHaveNutrition') : t('ingredients.fillMissingNutrition')}
            >
              {t('ingredients.fillMissingNutrition')}
            </Button>
            <Button 
              variant="outline"
              leftIcon={<Merge size={18} />}
              onClick={() => setIsMergeModalOpen(true)}
              className="w-full sm:w-auto"
            >
              {t('ingredients.mergeIngredients')}
            </Button>
            <Button 
              leftIcon={<PlusCircle size={18} />}
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto"
            >
              {t('ingredients.addIngredient')}
            </Button>
          </div>
        }
      />
      
      <div className="mb-6 lg:mb-8">
        <Input
          placeholder={t('ingredients.searchIngredients')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5" />}
          fullWidth
          className="max-w-md"
        />
      </div>

      {(bulkSummary || bulkError || rowError) && (
        <div className="mb-6 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {bulkError && (
                <p className="font-medium text-error-700">{bulkError}</p>
              )}
              {rowError && (
                <p className="font-medium text-error-700">{rowError}</p>
              )}
              {bulkSummary && (
                <>
                  <p className="font-medium text-neutral-900">
                    {t('ingredients.bulk.filledMissing', { count: bulkSummary.updated })}
                  </p>
                  <p className="text-neutral-600">
                    {t('ingredients.bulk.skippedFailed', { skipped: bulkSummary.skipped, failed: bulkSummary.failed.length })}
                  </p>
                  <p className="text-neutral-500">{t('ingredients.bulk.aiEstimatesBestEffort')}</p>
                </>
              )}
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {loading && ingredients === null && (
        <div className="py-12 lg:py-16">
          <Loader centered label={t('ingredients.loadingIngredients')} />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title={t('ingredients.failedToLoad')} 
          message={error.message}
          onRetry={fetchIngredients} 
        />
      )}
      
      {ingredients && filteredIngredients.length === 0 && (
        <div className="py-12 lg:py-16 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
          {searchQuery ? (
            <p className="text-neutral-500 text-sm sm:text-base">{t('ingredients.noIngredientsMatching', { query: searchQuery })}</p>
          ) : (
            <div className="max-w-md mx-auto">
              <p className="text-neutral-500 mb-4 text-sm sm:text-base">{t('ingredients.noIngredients')}</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<PlusCircle size={18} />}
                className="w-full sm:w-auto"
              >
                {t('ingredients.addFirstIngredient')}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {ingredients && filteredIngredients.length > 0 && (
        <>
        {/* Phones: one card per ingredient so calories stay visible */}
        <ul className="sm:hidden space-y-2">
          {filteredIngredients.map((ingredient) => (
            <li key={ingredient.id}>
              <div
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/ingredients/${ingredient.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/ingredients/${ingredient.id}`)}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white p-3 active:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-900">
                    <span className="first-letter:uppercase">{ingredient.name}</span>
                    {renderWarning(ingredient)}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {Math.round(ingredient.calories)} {t('common.cal')} {per100(ingredient)}
                  </div>
                  <div className="text-xs text-neutral-400">
                    <span>{ingredientCategoryLabel(ingredient.category, t)}</span>
                    {' · '}
                    {t('ingredients.table.macrosShort', {
                      protein: Math.round(ingredient.protein),
                      carbs: Math.round(ingredient.carbs),
                      fats: Math.round(ingredient.fats),
                    })}
                  </div>
                </div>
                {renderEstimate(ingredient)}
              </div>
            </li>
          ))}
        </ul>

        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.name')}
                    </th>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.category')}
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.unit')}
                    </th>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.calories')}
                    </th>
                    <th scope="col" className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.macros')}
                    </th>
                    <th scope="col" className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {t('ingredients.table.ai')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredIngredients.map((ingredient) => (
                    <tr
                      key={ingredient.id}
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ingredients/${ingredient.id}`)}
                    >
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-neutral-900">
                        <div className="flex items-center gap-1.5">
                          <span className="first-letter:uppercase">{ingredient.name}</span>
                          {renderWarning(ingredient)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 capitalize">
                          {ingredientCategoryLabel(ingredient.category, t)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {per100(ingredient)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {Math.round(ingredient.calories)} {t('common.cal')}
                      </td>
                      <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {t('ingredients.table.macrosShort', {
                          protein: Math.round(ingredient.protein),
                          carbs: Math.round(ingredient.carbs),
                          fats: Math.round(ingredient.fats),
                        })}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-neutral-500 text-right">
                        {renderEstimate(ingredient) ?? <span className="text-xs text-neutral-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Modals */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">{t('ingredients.bulk.title')}</h2>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={t('common.close')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-neutral-600">
              {missingCount === 0 ? (
                <p>{t('ingredients.bulk.allHaveNutrition')}</p>
              ) : (
                <>
                  <p>
                    {t('ingredients.bulk.willBeUpdated', { count: missingCount })}
                  </p>
                  <div className="rounded-md bg-neutral-50 border border-neutral-200 p-3">
                    <p className="font-medium text-neutral-900">{t('ingredients.bulk.aiEstimatesWarning')}</p>
                    <p className="text-neutral-500 mt-1">
                      {t('ingredients.bulk.valuesStoredPer100')}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-6 border-t border-neutral-200">
              <Button
                variant="ghost"
                onClick={() => setIsBulkModalOpen(false)}
                disabled={bulkEstimating}
              >
                {t('common.cancel')}
              </Button>
              <Button
                leftIcon={<Sparkles size={18} />}
                onClick={handleBulkEstimate}
                isLoading={bulkEstimating}
                disabled={bulkEstimating || rowEstimating || estimatingId !== null || missingCount === 0}
              >
                {t('ingredients.fillMissingNutrition')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateIngredientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <MergeIngredientsModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onSuccess={handleMergeSuccess}
      />
    </Container>
  );
};

export default Ingredients;
