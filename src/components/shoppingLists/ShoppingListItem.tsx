import React, { useState } from 'react';
import { Check, ShoppingBag, ChefHat, ChevronDown, ChevronUp } from 'lucide-react';
import { ShoppingListItem as ShoppingListItemType, Recipe } from '../../types';
import Button from '../ui/Button';
import Card, { CardContent } from '../ui/Card';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import { getShoppingListItemRecipes } from '../../api/shoppingListApi';

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onStatusChange?: (itemId: number, status: string) => void;
}

const ShoppingListItem: React.FC<ShoppingListItemProps> = React.memo(({
  item,
  onStatusChange
}) => {
  const [isChecked, setIsChecked] = useState(item.status === 'completed');
  const [showRecipes, setShowRecipes] = useState(false);
  
  const { data: recipes, loading, error, execute: fetchRecipes } = useApi<Recipe[]>(getShoppingListItemRecipes);
  
  const handleToggle = () => {
    const newStatus = isChecked ? 'pending' : 'completed';
    setIsChecked(!isChecked);
    if (onStatusChange) {
      onStatusChange(item.id, newStatus);
    }
  };
  
  const handleShowRecipes = async () => {
    if (!showRecipes && !recipes) {
      // Only fetch if we haven't fetched before and we're opening
      try {
        await fetchRecipes(item.id);
      } catch (error) {
        console.error('Failed to fetch recipes for item:', error);
      }
    }
    setShowRecipes(!showRecipes);
  };
  
  const getCategoryIcon = () => {
    return <ShoppingBag className="h-4 w-4 text-neutral-400" />;
  };
  
  return (
    <div className="space-y-2">
      <div className={`
        flex items-center p-3 rounded-md transition-colors
        ${isChecked ? 'bg-neutral-50' : 'bg-white hover:bg-neutral-50'}
      `}>
        <button
          type="button"
          className={`
            flex h-5 w-5 items-center justify-center rounded-full border mr-3 flex-shrink-0
            ${isChecked 
              ? 'border-primary-500 bg-primary-500 text-white' 
              : 'border-neutral-300 bg-white'}
          `}
          onClick={handleToggle}
        >
          {isChecked && <Check className="h-3 w-3" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-medium ${isChecked ? 'text-neutral-500 line-through' : 'text-neutral-900'}
          `}>
            {item.quantity} {item.unit} {item.ingredient.name}
          </p>
        </div>
        
        <div className="ml-3 flex items-center space-x-2">
          <span className={`
            inline-flex items-center rounded-full px-2 py-0.5 text-xs
            ${isChecked ? 'bg-neutral-100 text-neutral-500' : 'bg-neutral-100 text-neutral-700'}
          `}>
            {getCategoryIcon()}
            <span className="ml-1 capitalize">{item.category}</span>
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowRecipes}
            className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1"
            leftIcon={<ChefHat className="h-3 w-3" />}
            rightIcon={showRecipes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          >
            Recipes
          </Button>
        </div>
      </div>

      {/* Recipe Details */}
      {showRecipes && (
        <Card className="ml-8 animate-slideIn">
          <CardContent className="p-3">
            {loading && (
              <div className="py-4">
                <Loader size="sm" label="Loading recipes..." />
              </div>
            )}

            {error && (
              <ErrorMessage 
                title="Failed to load recipes" 
                message={error.message}
                onRetry={() => fetchRecipes(item.id)}
                className="text-sm"
              />
            )}

            {recipes && recipes.length === 0 && (
              <div className="py-4 text-center text-sm text-neutral-500">
                No recipes found using this ingredient.
              </div>
            )}

            {recipes && recipes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Used in {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}:
                </h4>
                <div className="space-y-2">
                  {recipes.map((recipe) => {
                    // Find the ingredient details in this recipe
                    const recipeIngredient = recipe.ingredients.find(
                      ing => ing.ingredient_id === item.ingredient_id
                    );
                    
                    return (
                      <div key={recipe.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded border">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {recipe.name}
                          </div>
                          <div className="text-xs text-neutral-500 capitalize">
                            {recipe.category} • {recipe.servings} servings
                          </div>
                        </div>
                        
                        {recipeIngredient && (
                          <div className="ml-2 text-right flex-shrink-0">
                            <div className="text-sm font-medium text-primary-700">
                              {recipeIngredient.quantity} {recipeIngredient.unit}
                            </div>
                            <div className="text-xs text-neutral-500">
                              per recipe
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary */}
                <div className="mt-3 pt-2 border-t border-neutral-200">
                  <div className="text-xs text-neutral-600">
                    <span className="font-medium">Total needed:</span> {item.quantity} {item.unit}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default ShoppingListItem;