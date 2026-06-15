import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Recipe, RecipeFilterParams } from '../../types';
import RecipeCard from './RecipeCard';
import RecipeSearchFilters from './RecipeSearchFilters';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import { getRecipes } from '../../api/recipeApi';

interface RecipeListProps {
  onSelectRecipe?: (recipe: Recipe) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ onSelectRecipe }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<RecipeFilterParams>({
    skip: 0,
    limit: 20
  });

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const isFirstRender = useRef(true);
  const loadedIdsRef = useRef<Set<number>>(new Set());

  const { data: recipes, loading, error, execute: fetchRecipes } = useApi<Recipe[]>(getRecipes);

  const loadRecipes = useCallback((currentFilters: RecipeFilterParams) => {
    fetchRecipes(currentFilters);
  }, [fetchRecipes]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadRecipes(filters);
      return;
    }
    loadRecipes(filters);
  }, [filters.skip, filters, loadRecipes]);

  useEffect(() => {
    if (!recipes) return;

    if (filters.skip === 0) {
      setAllRecipes(recipes);
      loadedIdsRef.current = new Set(recipes.map(r => r.id));
    } else {
      const newRecipes = recipes.filter(r => !loadedIdsRef.current.has(r.id));
      if (newRecipes.length > 0) {
        setAllRecipes(prev => [...prev, ...newRecipes]);
        newRecipes.forEach(r => loadedIdsRef.current.add(r.id));
      }
    }

    setHasMore(recipes.length >= (filters.limit || 20));
  }, [recipes, filters.skip, filters.limit]);

  const handleFilterChange = (newFilters: RecipeFilterParams) => {
    setFilters({
      skip: 0,
      limit: 20,
      ...newFilters
    });
    loadedIdsRef.current = new Set();
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      skip: (prev.skip || 0) + (prev.limit || 20)
    }));
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <RecipeSearchFilters onFilterChange={handleFilterChange} />

      {loading && allRecipes.length === 0 && (
        <div className="py-12 lg:py-16">
          <Loader centered label={t('recipes.loadingRecipes')} />
        </div>
      )}

      {error && (
        <ErrorMessage
          title={t('recipes.failedToLoadRecipes')}
          message={error.message}
          onRetry={() => loadRecipes(filters)}
        />
      )}

      {allRecipes.length === 0 && !loading && !error && (
        <div className="py-12 lg:py-16 text-center">
          <p className="text-neutral-500 text-sm sm:text-base">{t('recipes.noRecipes')}</p>
        </div>
      )}

      {allRecipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 animate-fadeIn">
            {allRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => onSelectRecipe && onSelectRecipe(recipe)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8 lg:mt-12">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 text-sm sm:text-base text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('recipes.loadMore')
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecipeList;
