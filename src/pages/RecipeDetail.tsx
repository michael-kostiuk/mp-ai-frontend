import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import CreateRecipeModal from '../components/recipes/CreateRecipeModal';
import { Recipe } from '../types';

const RecipeDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const recipeId = id ? parseInt(id, 10) : null;
  const searchParams = new URLSearchParams(location.search);
  const isValidId = (value: number) => Number.isFinite(value) && value > 0;
  const fromMealPlanId = Number(searchParams.get('fromMealPlan'));
  const fromShoppingListId = Number(searchParams.get('fromShoppingList'));
  const returnPath = isValidId(fromMealPlanId)
    ? `/meal-plans/${fromMealPlanId}`
    : isValidId(fromShoppingListId)
      ? `/shopping-lists/${fromShoppingListId}`
      : null;
  const backLabel = isValidId(fromMealPlanId)
    ? t('recipes.backToMealPlan')
    : isValidId(fromShoppingListId)
      ? t('recipes.backToShoppingList')
      : t('recipes.backToRecipes');

  useEffect(() => {
    // If no valid ID, redirect to recipes list
    if (!recipeId || isNaN(recipeId)) {
      navigate('/recipes', { replace: true });
    }
  }, [recipeId, navigate]);

  const handleClose = () => {
    navigate(returnPath || '/recipes');
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingRecipe(null);
    // Remount the detail view so it reloads the updated recipe
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = () => {
    navigate(returnPath || '/recipes');
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingRecipe(null);
  };

  if (!recipeId) {
    return null;
  }

  return (
    <>
      <RecipeDetailModal
        key={refreshKey}
        asPage
        isOpen={true}
        onClose={handleClose}
        recipeId={recipeId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        backTo={returnPath || '/recipes'}
        backLabel={backLabel}
      />

      <CreateRecipeModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        editingRecipe={editingRecipe}
      />
    </>
  );
};

export default RecipeDetail;
