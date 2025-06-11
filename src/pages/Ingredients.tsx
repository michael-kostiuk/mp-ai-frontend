import React, { useState, useEffect } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import CreateIngredientModal from '../components/ingredients/CreateIngredientModal';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import { Ingredient } from '../types';
import useApi from '../hooks/useApi';
import { getIngredients } from '../api/ingredientApi';

const Ingredients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: ingredients, loading, error, execute: fetchIngredients } = useApi<Ingredient[]>(getIngredients);
  
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients, refreshKey]);
  
  const filteredIngredients = ingredients
    ? ingredients.filter(
        (ingredient) =>
          ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ingredient.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCreateSuccess = () => {
    // Refresh the ingredients list
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <PageHeader
        title="Ingredients"
        description="Browse and manage ingredients"
        actions={
          <Button 
            leftIcon={<PlusCircle size={18} />}
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          >
            Add Ingredient
          </Button>
        }
      />
      
      <div className="mb-6 lg:mb-8">
        <Input
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-5 w-5" />}
          fullWidth
          className="max-w-md"
        />
      </div>
      
      {loading && ingredients === null && (
        <div className="py-12 lg:py-16">
          <Loader centered label="Loading ingredients..." />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title="Failed to load ingredients" 
          message={error.message}
          onRetry={fetchIngredients} 
        />
      )}
      
      {ingredients && filteredIngredients.length === 0 && (
        <div className="py-12 lg:py-16 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
          {searchQuery ? (
            <p className="text-neutral-500 text-sm sm:text-base">No ingredients found matching "{searchQuery}".</p>
          ) : (
            <div className="max-w-md mx-auto">
              <p className="text-neutral-500 mb-4 text-sm sm:text-base">No ingredients available.</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<PlusCircle size={18} />}
                className="w-full sm:w-auto"
              >
                Add Your First Ingredient
              </Button>
            </div>
          )}
        </div>
      )}
      
      {ingredients && filteredIngredients.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Calories
                    </th>
                    <th scope="col" className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Macros (P/C/F)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredIngredients.map((ingredient) => (
                    <tr key={ingredient.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        <div className="truncate max-w-[120px] sm:max-w-none">
                          {ingredient.name}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 capitalize">
                          {ingredient.category}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        per 100{ingredient.base_unit}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span>{ingredient.calories} cal</span>
                          <span className="sm:hidden text-xs text-neutral-400 mt-1">
                            per 100{ingredient.base_unit}
                          </span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {ingredient.protein}g / {ingredient.carbs}g / {ingredient.fats}g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateIngredientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
};

export default Ingredients;