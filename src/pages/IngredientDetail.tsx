import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft, Edit } from 'lucide-react';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import CreateIngredientModal from '../components/ingredients/CreateIngredientModal';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import useApi from '../hooks/useApi';
import useCachedApi from '../hooks/useCachedApi';
import { getIngredients } from '../api/ingredientApi';
import { getRecipes } from '../api/recipeApi';
import { Ingredient, Recipe, RecipeFilterParams } from '../types';
import { getLocaleFromLanguage } from '../utils/i18nUtils';
import { getNutritionWarning } from '../utils/nutritionUtils';
import { formatQuantity, formatUnitLabel } from '../utils/unitUtils';
import { useAuth } from '../context/AuthContext';
import { ingredientCategoryLabel } from '../utils/categoryUtils';

// The API has no single-ingredient or "recipes by ingredient" endpoint, so both lists are loaded once and filtered here
const ALL_RECIPES: [RecipeFilterParams] = [{ limit: 1000 }];

const IngredientDetail: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);
  const { mode } = useAuth();
  const { id } = useParams<{ id: string }>();
  const ingredientId = Number(id);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: ingredients, loading: loadingIngredients, error: ingredientsError, execute: fetchIngredients } =
    useApi<Ingredient[], Parameters<typeof getIngredients>>(getIngredients, true);
  const { data: recipes, loading: loadingRecipes, error: recipesError } =
    useCachedApi<Recipe[], [RecipeFilterParams]>('recipes', getRecipes, { immediate: true, initialArgs: ALL_RECIPES });

  const ingredient = ingredients?.find((item) => item.id === ingredientId) ?? null;

  const usedIn = useMemo(() => {
    if (!recipes) return [];
    return recipes.flatMap((recipe) =>
      recipe.ingredients
        .filter((item) => item.ingredient_id === ingredientId)
        .map((item) => ({ recipe, quantity: item.quantity, unit: item.unit }))
    );
  }, [recipes, ingredientId]);

  const error = ingredientsError || recipesError;

  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/ingredients"
          className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('ingredients.detail.backToIngredients')}
        </Link>
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('ingredients.detail.title')}</h1>
          {ingredient && mode === 'owner' && (
            <Button variant="outline" leftIcon={<Edit size={18} />} onClick={() => setIsEditOpen(true)}>
              {t('common.edit')}
            </Button>
          )}
        </div>

        <div>
          {((loadingIngredients && !ingredients) || loadingRecipes) && (
            <div className="py-12">
              <Loader centered label={t('ingredients.loadingIngredients')} />
            </div>
          )}

          {error && <ErrorMessage title={t('ingredients.failedToLoad')} message={error.message} />}

          {ingredients && !ingredient && (
            <div className="text-center py-8 text-neutral-500">{t('ingredients.detail.notFound')}</div>
          )}

          {ingredient && recipes && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2 first-letter:uppercase">{ingredient.name}</h1>
                <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 capitalize">
                  {ingredientCategoryLabel(ingredient.category, t)}
                </span>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('ingredients.detail.nutrition')} ({t('ingredients.table.per100', { unit: formatUnitLabel(ingredient.base_unit, t) })})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 md:gap-6">
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-neutral-900">{Math.round(ingredient.calories)}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.calories')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-primary-600">{Math.round(ingredient.protein * 10) / 10} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.protein')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-accent-600">{Math.round(ingredient.carbs * 10) / 10} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.carbs')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-secondary-600">{Math.round(ingredient.fats * 10) / 10} {t('units.short.g')}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.fats')}</div>
                    </div>
                  </div>
                  {getNutritionWarning(ingredient) && (
                    <p className="mt-4 flex items-start gap-2 rounded-md bg-warning-50 p-3 text-sm text-warning-800">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
                      {t(`ingredients.warnings.${getNutritionWarning(ingredient)}`)} {t('ingredients.warnings.fixHint')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('ingredients.detail.usedInRecipes')} ({usedIn.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usedIn.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">{t('ingredients.detail.notUsed')}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {usedIn.map(({ recipe, quantity, unit }) => (
                        <Link
                          key={recipe.id}
                          to={`/recipes/${recipe.id}`}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                        >
                          <span className="font-medium text-neutral-900">{recipe.name}</span>
                          <span className="text-neutral-600 whitespace-nowrap ml-3">
                            {formatQuantity(quantity, unit, t, locale)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {ingredient && (
        <CreateIngredientModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => fetchIngredients()}
          ingredient={ingredient}
        />
      )}
    </Container>
  );
};

export default IngredientDetail;
