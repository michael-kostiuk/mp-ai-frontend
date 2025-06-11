import React, { useState, useEffect } from 'react';
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
  const [filters, setFilters] = useState<RecipeFilterParams>({
    skip: 0,
    limit: 20
  });
  
  const { data: recipes, loading, error, execute: fetchRecipes } = useApi<Recipe[]>(getRecipes);
  
  useEffect(() => {
    fetchRecipes(filters);
  }, [filters, fetchRecipes]);
  
  const handleFilterChange = (newFilters: RecipeFilterParams) => {
    setFilters({
      ...filters,
      ...newFilters,
      // Reset pagination when filters change
      skip: 0
    });
  };
  
  const handleLoadMore = () => {
    setFilters({
      ...filters,
      skip: (filters.skip || 0) + (filters.limit || 20)
    });
  };
  
  return (
    <div className="space-y-6 lg:space-y-8">
      <RecipeSearchFilters onFilterChange={handleFilterChange} />
      
      {loading && recipes === null && (
        <div className="py-12 lg:py-16">
          <Loader centered label="Loading recipes..." />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title="Failed to load recipes" 
          message={error.message}
          onRetry={() => fetchRecipes(filters)} 
        />
      )}
      
      {recipes && recipes.length === 0 && (
        <div className="py-12 lg:py-16 text-center">
          <p className="text-neutral-500 text-sm sm:text-base">No recipes found matching your criteria.</p>
        </div>
      )}
      
      {recipes && recipes.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 animate-fadeIn">
            {recipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                onClick={() => onSelectRecipe && onSelectRecipe(recipe)}
              />
            ))}
          </div>
          
          {recipes.length >= (filters.limit || 20) && (
            <div className="flex justify-center mt-8 lg:mt-12">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 text-sm sm:text-base text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecipeList;