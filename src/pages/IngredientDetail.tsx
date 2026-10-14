import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import useApi from '../hooks/useApi';
import { getIngredients } from '../api/ingredientApi';
import { getRecipes } from '../api/recipeApi';
import { Ingredient, Recipe, RecipeFilterParams } from '../types';

// The API has no single-ingredient or "recipes by ingredient" endpoint, so both lists are loaded once and filtered here
const ALL_RECIPES: [RecipeFilterParams] = [{ limit: 1000 }];

const IngredientDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const ingredientId = Number(id);

  const { data: ingredients, loading: loadingIngredients, error: ingredientsError } =
    useApi<Ingredient[], Parameters<typeof getIngredients>>(getIngredients, true);
  const { data: recipes, loading: loadingRecipes, error: recipesError } =
    useApi<Recipe[], [RecipeFilterParams]>(getRecipes, true, ALL_RECIPES);

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
    <Container maxWidth="4xl" className="py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-4 p-6 border-b border-neutral-200">
          <Link to="/ingredients">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              {t('ingredients.detail.backToIngredients')}
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-neutral-900">{t('ingredients.detail.title')}</h2>
        </div>

        <div className="p-6">
          {(loadingIngredients || loadingRecipes) && (
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
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">{ingredient.name}</h1>
                <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-800 capitalize">
                  {ingredient.category}
                </span>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('ingredients.detail.nutrition')} ({t('ingredients.table.per100', { unit: ingredient.base_unit })})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 md:gap-6">
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-neutral-900">{ingredient.calories}</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.calories')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-primary-600">{ingredient.protein}g</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.protein')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-accent-600">{ingredient.carbs}g</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.carbs')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-2xl font-bold text-secondary-600">{ingredient.fats}g</div>
                      <div className="text-xs md:text-sm text-neutral-500">{t('recipes.detail.fats')}</div>
                    </div>
                  </div>
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
                            {quantity} {unit}
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
    </Container>
  );
};

export default IngredientDetail;
