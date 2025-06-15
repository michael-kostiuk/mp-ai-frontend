import React, { useState, useEffect, useCallback } from 'react';
import { X, Clock, Users, Target, Edit, Trash2, ChefHat } from 'lucide-react';
import { Recipe } from '../../types';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import Loader from '../ui/Loader';
import ErrorMessage from '../ui/ErrorMessage';
import useApi from '../../hooks/useApi';
import { getRecipe, deleteRecipe } from '../../api/recipeApi';

interface RecipeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number | null;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: () => void;
}

const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  onClose,
  recipeId,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { data: recipe, loading, error, execute: fetchRecipe } = useApi<Recipe>(getRecipe);
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

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTotalTime = () => {
    if (!recipe) return 0;
    return recipe.prep_time + recipe.cook_time;
  };

  const groupIngredientsByCategory = () => {
    if (!recipe?.ingredients) return {};
    
    return recipe.ingredients.reduce((groups, ingredient) => {
      const category = ingredient.ingredient.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(ingredient);
      return groups;
    }, {} as Record<string, typeof recipe.ingredients>);
  };

  const formatInstructions = (instructions: string) => {
    // Split by numbered steps or line breaks
    const steps = instructions
      .split(/\n+|\d+\.\s*/)
      .filter(step => step.trim().length > 0)
      .map(step => step.trim());
    
    return steps;
  };

  const handleDelete = async () => {
    if (!recipeId) return;
    
    try {
      await deleteRecipeById(recipeId);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Recipe Details</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="py-12">
              <Loader centered label="Loading recipe..." />
            </div>
          )}

          {error && (
            <ErrorMessage 
              title="Failed to load recipe" 
              message={error.message}
              onRetry={loadRecipe} 
            />
          )}

          {recipe && (
            <div className="space-y-6">
              {/* Recipe Header */}
              <div className="text-center">
                <div className="bg-secondary-100 h-48 rounded-lg flex items-center justify-center mb-4">
                  <ChefHat className="h-16 w-16 text-secondary-600" />
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">{recipe.name}</h1>
                <p className="text-lg text-neutral-600 capitalize">{recipe.category}</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{recipe.servings}</div>
                    <div className="text-sm text-neutral-500">Servings</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-accent-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{formatTime(recipe.prep_time)}</div>
                    <div className="text-sm text-neutral-500">Prep Time</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{formatTime(recipe.cook_time)}</div>
                    <div className="text-sm text-neutral-500">Cook Time</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-warning-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-neutral-900">{recipe.calories}</div>
                    <div className="text-sm text-neutral-500">Calories</div>
                  </CardContent>
                </Card>
              </div>

              {/* Dietary Tags */}
              {recipe.dietary_tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dietary Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recipe.dietary_tags.map((tag) => (
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
                  <CardTitle>Nutrition (per serving)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-900">{recipe.calories}</div>
                      <div className="text-sm text-neutral-500">Calories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{recipe.protein}g</div>
                      <div className="text-sm text-neutral-500">Protein</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-600">{recipe.carbs}g</div>
                      <div className="text-sm text-neutral-500">Carbs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary-600">{recipe.fats}g</div>
                      <div className="text-sm text-neutral-500">Fats</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(groupIngredientsByCategory()).length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      No ingredients listed for this recipe.
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
                                <span className="font-medium text-neutral-900">
                                  {ingredient.ingredient.name}
                                </span>
                                <span className="text-neutral-600">
                                  {ingredient.quantity} {ingredient.unit}
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
                  <CardTitle>Instructions</CardTitle>
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
                      No instructions provided for this recipe.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recipe Meta */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-neutral-700">Total Time:</span>
                      <span className="ml-2 text-neutral-600">{formatTime(getTotalTime())}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Category:</span>
                      <span className="ml-2 text-neutral-600 capitalize">{recipe.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Created:</span>
                      <span className="ml-2 text-neutral-600">
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Meal Type Weights (for developers/advanced users) */}
              <Card>
                <CardHeader>
                  <CardTitle>Meal Planning Weights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-neutral-900">
                        {(recipe.breakfast_weight * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-neutral-500">Breakfast</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-neutral-900">
                        {(recipe.lunch_weight * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-neutral-500">Lunch</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-neutral-900">
                        {(recipe.dinner_weight * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-neutral-500">Dinner</div>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-3 text-center">
                    Likelihood of this recipe being selected for each meal type during auto-generation
                  </p>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-neutral-200">
                <div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      className="text-error-600 border-error-300 hover:bg-error-50"
                    >
                      Delete Recipe
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDelete}
                        isLoading={deleting}
                        className="text-error-600 border-error-300 hover:bg-error-50"
                      >
                        Confirm Delete
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(recipe)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Edit Recipe
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetailModal;