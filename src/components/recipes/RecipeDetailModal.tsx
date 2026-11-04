import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Clock, Users, Timer, Edit, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';
import { Recipe } from '../../types';
import Button from '../ui/Button';
import MoreMenu from '../ui/MoreMenu';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Loader from '../ui/Loader';
import Container from '../layout/Container';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import useCachedApi from '../../hooks/useCachedApi';
import { getRecipe, deleteRecipe } from '../../api/recipeApi';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatDuration } from '../../utils/dateUtils';
import { formatQuantity } from '../../utils/unitUtils';
import { useAuth } from '../../context/AuthContext';
import DemoEditHint from '../auth/DemoEditHint';
import RecipeImagePlaceholder from './RecipeImagePlaceholder';
import { recipeCategoryLabel } from '../../utils/categoryUtils';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number | null;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: () => void;
  backTo?: string;
  backLabel?: string;
  // Render as a full page (no overlay) instead of a pop-up
  asPage?: boolean;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  recipeId,
  onEdit,
  onDelete,
  backTo,
  backLabel,
  asPage = false
}) => {
  const { t, i18n } = useTranslation();
  // How many servings to show ingredient amounts for; null = the recipe's own count
  const [servingsShown, setServingsShown] = useState<number | null>(null);
  // Ingredients and instructions share one card; tabs switch between them
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const { mode } = useAuth();
  const canEdit = mode === 'owner';
  const locale = getLocaleFromLanguage(i18n.language);
  
  const { data: recipe, loading, error, execute: fetchRecipe } = useCachedApi<Recipe, [number]>('recipe', getRecipe, {
    initialArgs: recipeId ? [recipeId] : undefined
  });
  const { loading: deleting, execute: deleteRecipeById } = useApi(deleteRecipe);

  // Memoize the fetch function to prevent unnecessary re-renders
  const loadRecipe = useCallback(() => {
    if (recipeId) {
      fetchRecipe(recipeId);
    }
  }, [fetchRecipe, recipeId]);

  // Load recipe only when modal opens or recipeId changes
  useEffect(() => {
    if (isOpen && recipeId) {
      loadRecipe();
    }
  }, [isOpen, recipeId]); // Only depend on isOpen and recipeId, not the fetch function

  const formatTime = (minutes: number) =>
    formatDuration(minutes, { minutes: t('common.minutes'), hours: t('common.hours') });

  const formatInstructions = (instructions: string) => {
    // Split by line breaks, dropping a leading step number ("1. ") on each line
    const steps = instructions
      .split(/\n+/)
      .map(step => step.trim().replace(/^\d+\.\s*/, ''))
      .filter(step => step.length > 0);
    
    return steps;
  };

  const handleDelete = async () => {
    if (!recipeId || !window.confirm(t('recipes.deleteConfirm'))) return;

    try {
      await deleteRecipeById(recipeId);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  if (!isOpen) return null;

  const dietaryTags = Array.isArray(recipe?.dietary_tags) ? recipe.dietary_tags : [];

  const body = (
        <>
          {loading && !recipe && (
            <div className="py-12">
              <Loader centered label={t('recipes.loadingRecipe')} />
            </div>
          )}

          {error && (
            <ErrorMessage 
              title={t('recipes.failedToLoad')} 
              message={error.message}
              onRetry={loadRecipe} 
            />
          )}

          {recipe && (
            <div className="space-y-4 sm:space-y-6">
              {/* Recipe Header */}
              <div className="text-center">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-36 sm:h-64 object-cover rounded-lg mb-3 sm:mb-4"
                  />
                ) : (
                  <RecipeImagePlaceholder category={recipe.category} className="h-24 sm:h-48 rounded-lg mb-3 sm:mb-4" />
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2">{recipe.name}</h1>
                <p className="text-base sm:text-lg text-neutral-600">{recipeCategoryLabel(recipe.category, t)}</p>
              </div>

              {/* Servings, times and nutrition in one compact card, so the ingredients
                  and instructions start on the first screen; unknown times (0) are left out */}
              <Card padding="none">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary-600" aria-hidden="true" />
                      {t('common.servingsCount', { count: recipe.servings })}
                    </span>
                    {recipe.prep_time > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-accent-600" aria-hidden="true" />
                        {t('recipes.detail.prepTime')}: {formatTime(recipe.prep_time)}
                      </span>
                    )}
                    {recipe.cook_time > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Timer className="h-4 w-4 text-secondary-600" aria-hidden="true" />
                        {t('recipes.detail.cookTime')}: {formatTime(recipe.cook_time)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 border-t border-neutral-100 pt-3 text-center">
                    {[
                      { value: Math.round(recipe.calories), label: t('recipes.detail.calories'), color: 'text-neutral-900' },
                      { value: `${Math.round(recipe.protein)} ${t('units.short.g')}`, label: t('recipes.detail.protein'), color: 'text-primary-600' },
                      { value: `${Math.round(recipe.carbs)} ${t('units.short.g')}`, label: t('recipes.detail.carbs'), color: 'text-accent-600' },
                      { value: `${Math.round(recipe.fats)} ${t('units.short.g')}`, label: t('recipes.detail.fats'), color: 'text-secondary-600' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className={`text-base sm:text-lg font-semibold leading-tight ${item.color}`}>{item.value}</div>
                        <div className="text-xs text-neutral-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-center text-xs text-neutral-400">{t('recipes.detail.nutritionPerServing')}</p>
                </CardContent>
              </Card>

              {/* Dietary Tags */}
              {dietaryTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('recipes.detail.dietaryInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {dietaryTags.map((tag) => (
                        <span 
                          key={tag}
                          className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ingredients and instructions as tabs in one card */}
              <Card padding="none">
                <div className="flex border-b border-neutral-200 px-2 sm:px-4" role="tablist">
                  {(['ingredients', 'instructions'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      id={`recipe-tab-${tab}`}
                      aria-selected={activeTab === tab}
                      aria-controls="recipe-tab-panel"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 sm:flex-none -mb-px border-b-2 px-4 py-3 text-base font-medium transition-colors ${
                        activeTab === tab
                          ? 'border-primary-600 text-primary-700'
                          : 'border-transparent text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {t(`recipes.detail.${tab}`)}
                    </button>
                  ))}
                </div>
                <div id="recipe-tab-panel" role="tabpanel" aria-labelledby={`recipe-tab-${activeTab}`} className="p-4 sm:p-6">
                {activeTab === 'ingredients' ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-start gap-3">
                    {recipe.servings > 0 && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <span>{t('recipes.detail.servingsFor')}</span>
                        <div className="inline-flex rounded-md border border-neutral-200" role="group">
                          {Array.from(new Set([1, 2, 4, recipe.servings])).sort((a, b) => a - b).map((count) => {
                            const active = (servingsShown ?? recipe.servings) === count;
                            return (
                              <button
                                key={count}
                                type="button"
                                onClick={() => setServingsShown(count)}
                                aria-pressed={active}
                                className={`min-w-[2.25rem] px-2 py-1 first:rounded-l-md last:rounded-r-md ${
                                  active ? 'bg-primary-600 text-white' : 'bg-white hover:bg-neutral-50'
                                }`}
                              >
                                {count}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {!recipe.ingredients?.length ? (
                    <div className="text-center py-8 text-neutral-500">
                      {t('recipes.noIngredientsListed')}
                    </div>
                  ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recipe.ingredients.map((ingredient, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                {asPage ? (
                                  <Link
                                    to={`/ingredients/${ingredient.ingredient_id}`}
                                    className="font-medium text-neutral-900 hover:text-primary-600"
                                  >
                                    {ingredient.ingredient.name}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-neutral-900">
                                    {ingredient.ingredient.name}
                                  </span>
                                )}
                                <span className="text-neutral-600 whitespace-nowrap ml-3">
                                  {formatQuantity(
                                    ingredient.quantity * ((servingsShown ?? recipe.servings) / (recipe.servings || 1)),
                                    ingredient.unit,
                                    t,
                                    locale
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                  )}
                </>
                ) : recipe.instructions ? (
                    <div className="space-y-4">
                      {formatInstructions(recipe.instructions).map((step, index) => (
                        <div key={index} className="flex">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-800 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-neutral-700 leading-relaxed">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      {t('recipes.noInstructionsProvided')}
                    </div>
                  )}
                </div>
              </Card>

              {/* How auto-planning picks this recipe: a technical detail, folded away */}
              <details className="group rounded-lg border border-neutral-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-neutral-600 hover:text-neutral-800">
                  {t('common.advanced')}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-neutral-200">
                  <CardHeader>
                    <CardTitle>{t('recipes.detail.mealPlanningWeights')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900">
                          {(recipe.breakfast_weight * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-neutral-500">{t('recipes.detail.breakfast')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900">
                          {(recipe.lunch_weight * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-neutral-500">{t('recipes.detail.lunch')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-neutral-900">
                          {(recipe.dinner_weight * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-neutral-500">{t('recipes.detail.dinner')}</div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 mt-3 text-center">
                      {t('recipes.detail.weightDescription')}
                    </p>
                  </CardContent>
                </div>
              </details>

              {/* Actions */}
              {!canEdit && (onEdit || onDelete) && <DemoEditHint />}
              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200">
                {!asPage && (
                  <Button variant="outline" onClick={onClose}>
                    {t('common.close')}
                  </Button>
                )}
                {onEdit && canEdit && (
                  <Button
                    onClick={() => onEdit(recipe)}
                    leftIcon={<Edit className="h-4 w-4" />}
                  >
                    {t('recipes.editRecipe')}
                  </Button>
                )}
                {/* Delete is only offered where the caller handles it (not in read-only lookups) */}
                {onDelete && canEdit && (
                  <MoreMenu
                    placement="up"
                    items={[{
                      label: deleting ? t('common.loading') : t('recipes.deleteRecipe'),
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: handleDelete,
                      danger: true,
                    }]}
                  />
                )}
              </div>
            </div>
          )}
        </>
  );

  if (asPage) {
    return (
      <Container className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            to={backTo || '/recipes'}
            className="hidden lg:inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {backLabel || t('common.back')}
          </Link>
          {body}
        </div>
      </Container>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      // Clicking the backdrop closes this modal (returning to whatever is underneath)
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-4">
            {backTo && (
              <Link to={backTo}>
                <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  {backLabel || t('common.back')}
                </Button>
              </Link>
            )}
            <h2 className="text-xl font-semibold text-neutral-900">{t('recipes.recipeDetails')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {body}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;
