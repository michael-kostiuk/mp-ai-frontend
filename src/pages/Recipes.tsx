import React, { useState, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import RecipeList from '../components/recipes/RecipeList';
import CreateRecipeModal from '../components/recipes/CreateRecipeModal';
import RecipeDetailModal from '../components/recipes/RecipeDetailModal';
import Button from '../components/ui/Button';
import { Recipe } from '../types';

const Recipes: React.FC = () => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const handleCreateSuccess = useCallback(() => {
    // Refresh the recipe list
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleEditRecipe = (recipe: Recipe) => {
    // Close detail modal and open edit modal with recipe data
    setIsDetailModalOpen(false);
    setEditingRecipe(recipe);
    setIsCreateModalOpen(true);
  };

  const handleDeleteSuccess = useCallback(() => {
    // Refresh the recipe list and close detail modal
    setRefreshKey(prev => prev + 1);
    setIsDetailModalOpen(false);
    setSelectedRecipe(null);
  }, []);

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingRecipe(null); // Clear editing recipe when closing
  };
  
  return (
    <Container className="py-8">
      <PageHeader
        title="Recipes"
        description="Browse, search, and manage your recipes"
        actions={
          <Button 
            leftIcon={<PlusCircle size={18} />}
            onClick={() => {
              setEditingRecipe(null); // Ensure we're creating, not editing
              setIsCreateModalOpen(true);
            }}
          >
            Add Recipe
          </Button>
        }
      />
      
      <RecipeList 
        key={refreshKey}
        onSelectRecipe={handleSelectRecipe} 
      />

      {/* Create/Edit Recipe Modal */}
      <CreateRecipeModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateSuccess}
        editingRecipe={editingRecipe}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecipe(null);
        }}
        recipeId={selectedRecipe?.id || null}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteSuccess}
      />
    </Container>
  );
};

export default Recipes;