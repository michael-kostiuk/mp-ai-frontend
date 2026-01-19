import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import CreateRecipeModal from '../components/recipes/CreateRecipeModal';
import { Recipe } from '../types';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const recipeId = id ? parseInt(id, 10) : null;
  const searchParams = new URLSearchParams(location.search);
  const fromMealPlanId = Number(searchParams.get('fromMealPlan'));
  const returnPath = Number.isFinite(fromMealPlanId) && fromMealPlanId > 0
    ? `/meal-plans/${fromMealPlanId}`
    : null;

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
    // The detail modal will automatically refresh when it detects changes
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
        isOpen={true}
        onClose={handleClose}
        recipeId={recipeId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        backTo={returnPath || undefined}
        backLabel="Back to Meal Plan"
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
