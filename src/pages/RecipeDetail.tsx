import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import CreateRecipeModal from '../components/recipes/CreateRecipeModal';
import { Recipe } from '../types';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const recipeId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    // If no valid ID, redirect to recipes list
    if (!recipeId || isNaN(recipeId)) {
      navigate('/recipes', { replace: true });
    }
  }, [recipeId, navigate]);

  const handleClose = () => {
    navigate('/recipes');
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
    navigate('/recipes');
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