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
import { formatDate, formatDuration } from '../../utils/dateUtils';
import { formatQuantity } from '../../utils/unitUtils';
import { useAuth } from '../../context/AuthContext';
import DemoEditHint from '../auth/DemoEditHint';
import RecipeImagePlaceholder from './RecipeImagePlaceholder';
import { ingredientCategoryLabel, recipeCategoryLabel } from '../../utils/categoryUtils';

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

  const getTotalTime = () => {
    if (!recipe) return 0;
    return recipe.prep_time + recipe.cook_time;
  };

  const groupIngredientsByCategory = () => {
    if (!recipe?.ingredients) return {};
    
    return recipe.ingredients.reduce((groups, ingredient) => {
      const category = ingredientCategoryLabel(ingredient.ingredient.category, t);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(ingredient);
      return groups;
    }, {} as Record<string, typeof recipe.ingredients>);
  };

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
            <div className="space-y-6">
              {/* Recipe Header */}
              <div className="text-center">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-40 sm:h-64 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <RecipeImagePlaceholder category={recipe.category} className="h-28 sm:h-48 rounded-lg mb-4" />
                )}
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">{recipe.name}</h1>
                <p className="text-lg text-neutral-600">{recipeCategoryLabel(recipe.category, t)}</p>
              </div>

              {/* Quick Stats: times are left out when the recipe doesn't have them (0) */}
              {(() => {
                const stats = [
                  { icon: <Users className="h-6 w-6 md:h-8 md:w-8 text-primary-600 mx-auto mb-2" />, value: String(recipe.servings), label: t('recipes.detail.servings') },
                  ...(recipe.prep_time > 0 ? [{ icon: <Clock className="h-6 w-6 md:h-8 md:w-8 text-accent-600 mx-auto mb-2" />, value: formatTime(recipe.prep_time), label: t('recipes.detail.prepTime') }] : []),
                  ...(recipe.cook_time > 0 ? [{ icon: <Clock className="h-6 w-6 md:h-8 md:w-8 text-secondary-600 mx-auto mb-2" />, value: formatTime(recipe.cook_time), label: t('recipes.detail.cookTime') }] : []),
                  ...(recipe.prep_time > 0 && recipe.cook_time > 0 ? [{ icon: <Timer className="h-6 w-6 md:h-8 md:w-8 text-warning-600 mx-auto mb-2" />, value: formatTime(getTotalTime()), label: t('recipes.detail.totalTime') }] : []),
                ];
                const columns = ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4'][stats.length - 1];
                return (
                  <div className={`grid ${columns} gap-2 md:gap-4`}>
                    {stats.map((stat) => (
                      <Card key={stat.label} padding="none">
                        <CardContent className="px-1 py-3 md:p-9 text-center">
                          {stat.icon}
                          <div className="text-base md:text-2xl font-bold leading-tight text-neutral-900">{stat.value}</div>
                          <div className="text-xs md:text-sm leading-tight text-neutral-500 [overflow-wrap:anywhere]">{stat.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                );
              })()}

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

              {/* Nutrition Information */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipes.detail.nutritionPerServing')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 md:gap-6">
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-neutral-900">{Math.round(recipe.calories)}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.calories')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-primary-600">{Math.round(recipe.protein)} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.protein')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-accent-600">{Math.round(recipe.carbs)} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.carbs')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-secondary-600">{Math.round(recipe.fats)} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.fats')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>{t('recipes.detail.ingredients')}</CardTitle>
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
                </CardHeader>
                <CardContent>
                  {Object.keys(groupIngredientsByCategory()).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      {t('recipes.noIngredientsListed')}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupIngredientsByCategory()).map(([category, ingredients]) => (
                        <div key={category}>
                          <h4 className="font-medium text-neutral-900 mb-3 capitalize text-lg">
                            {category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ingredients.map((ingredient, index) => (
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
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipes.detail.instructions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.instructions ? (
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
                </CardContent>
              </Card>

              {/* Recipe Meta */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recipes.detail.recipeInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {getTotalTime() > 0 && (
                      <div>
                        <span className="font-medium text-neutral-700">{t('recipes.detail.totalTime')}:</span>
                        <span className="ml-2 text-neutral-600">{formatTime(getTotalTime())}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-neutral-700">{t('recipes.detail.category')}:</span>
                      <span className="ml-2 text-neutral-600">{recipeCategoryLabel(recipe.category, t)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">{t('recipes.detail.created')}:</span>
                      <span className="ml-2 text-neutral-600">
                        {formatDate(recipe.created_at, locale)}
                      </span>
                    </div>
                  </div>
                </CardContent>
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
            className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
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
