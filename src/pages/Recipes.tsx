import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, ImageUp } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import RecipeList from '../components/recipes/RecipeList';
import CreateRecipeModal from '../components/recipes/CreateRecipeModal';
import RecipeFromImageModal from '../components/recipes/RecipeFromImageModal';
import Button from '../components/ui/Button';
import { Recipe, RecipeCreate } from '../types';

const Recipes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFromImageModalOpen, setIsFromImageModalOpen] = useState(false);
  const [initialRecipe, setInitialRecipe] = useState<Partial<RecipeCreate> | null>(null);
  const [initialIngredientNotes, setInitialIngredientNotes] = useState<string[] | null>(null);
  
  const handleSelectRecipe = (recipe: Recipe) => {
    navigate(`/recipes/${recipe.id}`);
  };

  const handleCreateSuccess = useCallback(() => {
    // Refresh the recipe list
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingRecipe(null); // Clear editing recipe when closing
    setInitialRecipe(null);
    setInitialIngredientNotes(null);
  };
  
  return (
    <Container className="py-8">
      <PageHeader
        title={t('recipes.title')}
        description={t('recipes.description')}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              leftIcon={<ImageUp size={18} />}
              onClick={() => setIsFromImageModalOpen(true)}
            >
              {t('recipes.addFromImage')}
            </Button>
            <Button
              leftIcon={<PlusCircle size={18} />}
              onClick={() => {
                setEditingRecipe(null);
                setInitialRecipe(null);
                setInitialIngredientNotes(null);
                setIsCreateModalOpen(true);
              }}
            >
              {t('recipes.addRecipe')}
            </Button>
          </div>
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
        initialRecipe={initialRecipe}
        initialIngredientNotes={initialIngredientNotes}
      />
      
      <RecipeFromImageModal
        isOpen={isFromImageModalOpen}
        onClose={() => setIsFromImageModalOpen(false)}
        onUseDraft={(draft, ingredientNotes) => {
          setIsFromImageModalOpen(false);
          setEditingRecipe(null);
          setInitialRecipe(draft);
          setInitialIngredientNotes(ingredientNotes);
          setIsCreateModalOpen(true);
        }}
      />
    </Container>
  );
};

export default Recipes;
