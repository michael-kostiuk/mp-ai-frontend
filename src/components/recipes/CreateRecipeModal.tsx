import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Users, Target } from 'lucide-react';
import { RecipeCreate, RecipeIngredientCreate, Ingredient, Recipe } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import IngredientSearchSelect from './IngredientSearchSelect';
import CreateIngredientModal from '../ingredients/CreateIngredientModal';
import useApi from '../../hooks/useApi';
import { getIngredients } from '../../api/ingredientApi';
import { createRecipe, updateRecipe } from '../../api/recipeApi';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRecipe?: Recipe | null;
}

const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingRecipe = null
}) => {
  const isEditing = !!editingRecipe;
  
  const [formData, setFormData] = useState<RecipeCreate>({
    name: '',
    servings: 4,
    prep_time: 15,
    cook_time: 30,
    instructions: '',
    category: 'dinner',
    dietary_tags: [],
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    breakfast_weight: 0.2,
    lunch_weight: 0.3,
    dinner_weight: 0.5,
    ingredients: []
  });

  const [isCreateIngredientModalOpen, setIsCreateIngredientModalOpen] = useState(false);
  const [pendingIngredientName, setPendingIngredientName] = useState('');
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState<number | null>(null);

  // Only fetch ingredients if we're creating a new recipe or if we need to search
  const { data: ingredients, execute: fetchIngredients } = useApi<Ingredient[]>(getIngredients);
  const { loading: creating, execute: createNewRecipe } = useApi(createRecipe);
  const { loading: updating, execute: updateExistingRecipe } = useApi(updateRecipe);

  // Initialize form data when editing recipe changes
  useEffect(() => {
    if (editingRecipe) {
      setFormData({
        name: editingRecipe.name,
        servings: editingRecipe.servings,
        prep_time: editingRecipe.prep_time,
        cook_time: editingRecipe.cook_time,
        instructions: editingRecipe.instructions,
        category: editingRecipe.category,
        dietary_tags: [...editingRecipe.dietary_tags],
        calories: editingRecipe.calories,
        protein: editingRecipe.protein,
        carbs: editingRecipe.carbs,
        fats: editingRecipe.fats,
        breakfast_weight: editingRecipe.breakfast_weight,
        lunch_weight: editingRecipe.lunch_weight,
        dinner_weight: editingRecipe.dinner_weight,
        ingredients: editingRecipe.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        }))
      });
    } else {
      // Reset form for new recipe
      setFormData({
        name: '',
        servings: 4,
        prep_time: 15,
        cook_time: 30,
        instructions: '',
        category: 'dinner',
        dietary_tags: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        breakfast_weight: 0.2,
        lunch_weight: 0.3,
        dinner_weight: 0.5,
        ingredients: []
      });
    }
  }, [editingRecipe]);

  // Only fetch ingredients when modal opens for new recipes
  useEffect(() => {
    if (isOpen && !isEditing) {
      fetchIngredients();
    }
  }, [isOpen, isEditing, fetchIngredients]);

  const categoryOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'dessert', label: 'Dessert' },
    { value: 'snack', label: 'Snack' },
    { value: 'appetizer', label: 'Appetizer' },
    { value: 'side', label: 'Side Dish' },
    { value: 'beverage', label: 'Beverage' },
  ];

  const dietaryTagOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten-free', label: 'Gluten Free' },
    { value: 'dairy-free', label: 'Dairy Free' },
    { value: 'keto', label: 'Keto' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'high-protein', label: 'High Protein' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'whole30', label: 'Whole30' },
    { value: 'mediterranean', label: 'Mediterranean' },
  ];

  const unitOptions = [
    { value: 'g', label: 'grams (g)' },
    { value: 'kg', label: 'kilograms (kg)' },
    { value: 'ml', label: 'milliliters (ml)' },
    { value: 'l', label: 'liters (l)' },
    { value: 'cup', label: 'cups' },
    { value: 'tbsp', label: 'tablespoons' },
    { value: 'tsp', label: 'teaspoons' },
    { value: 'piece', label: 'pieces' },
    { value: 'slice', label: 'slices' },
    { value: 'clove', label: 'cloves' },
    { value: 'bunch', label: 'bunches' },
    { value: 'can', label: 'cans' },
    { value: 'package', label: 'packages' },
  ];

  const handleInputChange = (field: keyof RecipeCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDietaryTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  };

  const addIngredient = () => {
    const newIngredient: RecipeIngredientCreate = {
      ingredient_id: 0,
      quantity: 1,
      unit: 'g'
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredientCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleCreateNewIngredient = (name: string, index?: number) => {
    setPendingIngredientName(name);
    setPendingIngredientIndex(index ?? null);
    setIsCreateIngredientModalOpen(true);
  };

  const handleIngredientCreated = () => {
    // Refresh ingredients list
    fetchIngredients();
    
    // Reset pending state
    setPendingIngredientName('');
    setPendingIngredientIndex(null);
  };

  // Get ingredient name from editing recipe data if available
  const getIngredientName = (ingredientId: number): string => {
    if (isEditing && editingRecipe) {
      const recipeIngredient = editingRecipe.ingredients.find(ing => ing.ingredient_id === ingredientId);
      if (recipeIngredient && recipeIngredient.ingredient) {
        return recipeIngredient.ingredient.name;
      }
    }
    return '';
  };

  const calculateNutrition = () => {
    if (formData.ingredients.length === 0) return;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    // For editing mode, use the existing ingredient data
    if (isEditing && editingRecipe) {
      formData.ingredients.forEach(recipeIngredient => {
        const existingIngredient = editingRecipe.ingredients.find(
          ing => ing.ingredient_id === recipeIngredient.ingredient_id
        );
        
        if (existingIngredient && existingIngredient.ingredient) {
          const ingredient = existingIngredient.ingredient;
          // Convert quantity to base unit (assuming base unit is per 100g)
          const factor = recipeIngredient.quantity / 100;
          totalCalories += ingredient.calories * factor;
          totalProtein += ingredient.protein * factor;
          totalCarbs += ingredient.carbs * factor;
          totalFats += ingredient.fats * factor;
        }
      });
    } else if (ingredients) {
      // For new recipes, use the fetched ingredients data
      formData.ingredients.forEach(recipeIngredient => {
        const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredient_id);
        if (ingredient) {
          // Convert quantity to base unit (assuming base unit is per 100g)
          const factor = recipeIngredient.quantity / 100;
          totalCalories += ingredient.calories * factor;
          totalProtein += ingredient.protein * factor;
          totalCarbs += ingredient.carbs * factor;
          totalFats += ingredient.fats * factor;
        }
      });
    }

    // Divide by servings to get per-serving nutrition
    const servings = formData.servings || 1;
    setFormData(prev => ({
      ...prev,
      calories: Math.round(totalCalories / servings),
      protein: Math.round((totalProtein / servings) * 10) / 10,
      carbs: Math.round((totalCarbs / servings) * 10) / 10,
      fats: Math.round((totalFats / servings) * 10) / 10,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return false;
    if (formData.servings < 1) return false;
    if (formData.prep_time < 0) return false;
    if (formData.cook_time < 0) return false;
    if (!formData.instructions.trim()) return false;
    if (formData.ingredients.length === 0) return false;
    
    // Check if all ingredients are properly filled
    return formData.ingredients.every(ing => 
      ing.ingredient_id > 0 && ing.quantity > 0 && ing.unit.trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields and add at least one ingredient.');
      return;
    }

    try {
      if (isEditing && editingRecipe) {
        await updateExistingRecipe(editingRecipe.id, formData);
      } else {
        await createNewRecipe(formData);
      }
      
      onSuccess();
      onClose();
      
      // Reset form only if not editing (editing will be reset by useEffect)
      if (!isEditing) {
        setFormData({
          name: '',
          servings: 4,
          prep_time: 15,
          cook_time: 30,
          instructions: '',
          category: 'dinner',
          dietary_tags: [],
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
          breakfast_weight: 0.2,
          lunch_weight: 0.3,
          dinner_weight: 0.5,
          ingredients: []
        });
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} recipe:`, error);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (!isEditing) {
      setFormData({
        name: '',
        servings: 4,
        prep_time: 15,
        cook_time: 30,
        instructions: '',
        category: 'dinner',
        dietary_tags: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        breakfast_weight: 0.2,
        lunch_weight: 0.3,
        dinner_weight: 0.5,
        ingredients: []
      });
    }
  };

  if (!isOpen) return null;

  const isLoading = creating || updating;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Recipe Name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter recipe name"
                required
                fullWidth
              />
              
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                fullWidth
              />
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Servings"
                type="number"
                value={formData.servings}
                onChange={(e) => handleInputChange('servings', Number(e.target.value))}
                leftIcon={<Users className="h-5 w-5" />}
                min={1}
                max={20}
                required
                fullWidth
              />
              
              <Input
                label="Prep Time (minutes)"
                type="number"
                value={formData.prep_time}
                onChange={(e) => handleInputChange('prep_time', Number(e.target.value))}
                leftIcon={<Clock className="h-5 w-5" />}
                min={0}
                max={480}
                required
                fullWidth
              />
              
              <Input
                label="Cook Time (minutes)"
                type="number"
                value={formData.cook_time}
                onChange={(e) => handleInputChange('cook_time', Number(e.target.value))}
                leftIcon={<Clock className="h-5 w-5" />}
                min={0}
                max={480}
                required
                fullWidth
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Enter cooking instructions..."
                rows={6}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-300 focus:ring-primary-200 focus:ring-2 focus:outline-none"
                required
              />
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Dietary Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryTagOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDietaryTag(option.value)}
                    className={`
                      inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors
                      ${formData.dietary_tags.includes(option.value)
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900">Ingredients</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-4">
                {formData.ingredients.map((ingredient, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Ingredient
                          </label>
                          <IngredientSearchSelect
                            value={ingredient.ingredient_id}
                            onChange={(ingredientId) => updateIngredient(index, 'ingredient_id', ingredientId)}
                            onCreateNew={(name) => handleCreateNewIngredient(name, index)}
                            placeholder="Search for ingredient..."
                            initialDisplayName={getIngredientName(ingredient.ingredient_id)}
                          />
                        </div>
                        
                        <Input
                          label="Quantity"
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                          min={0}
                          step={0.1}
                          fullWidth
                        />
                        
                        <div className="flex items-end space-x-2">
                          <Select
                            label="Unit"
                            options={unitOptions}
                            value={ingredient.unit}
                            onChange={(value) => updateIngredient(index, 'unit', value)}
                            fullWidth
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeIngredient(index)}
                            className="text-error-600 hover:text-error-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {formData.ingredients.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 border-2 border-dashed border-neutral-200 rounded-lg">
                    No ingredients added yet. Click "Add Ingredient" to get started.
                  </div>
                )}
              </div>

              {formData.ingredients.length > 0 && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateNutrition}
                    leftIcon={<Target className="h-4 w-4" />}
                  >
                    Calculate Nutrition
                  </Button>
                </div>
              )}
            </div>

            {/* Nutrition Information */}
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Information (per serving)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input
                    label="Calories"
                    type="number"
                    value={formData.calories}
                    onChange={(e) => handleInputChange('calories', Number(e.target.value))}
                    min={0}
                    fullWidth
                  />
                  
                  <Input
                    label="Protein (g)"
                    type="number"
                    value={formData.protein}
                    onChange={(e) => handleInputChange('protein', Number(e.target.value))}
                    min={0}
                    step={0.1}
                    fullWidth
                  />
                  
                  <Input
                    label="Carbs (g)"
                    type="number"
                    value={formData.carbs}
                    onChange={(e) => handleInputChange('carbs', Number(e.target.value))}
                    min={0}
                    step={0.1}
                    fullWidth
                  />
                  
                  <Input
                    label="Fats (g)"
                    type="number"
                    value={formData.fats}
                    onChange={(e) => handleInputChange('fats', Number(e.target.value))}
                    min={0}
                    step={0.1}
                    fullWidth
                  />
                </div>
              </CardContent>
            </Card>

            {/* Meal Weights */}
            <Card>
              <CardHeader>
                <CardTitle>Meal Type Weights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Breakfast Weight"
                    type="number"
                    value={formData.breakfast_weight}
                    onChange={(e) => handleInputChange('breakfast_weight', Number(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText="0.0 to 1.0"
                    fullWidth
                  />
                  
                  <Input
                    label="Lunch Weight"
                    type="number"
                    value={formData.lunch_weight}
                    onChange={(e) => handleInputChange('lunch_weight', Number(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText="0.0 to 1.0"
                    fullWidth
                  />
                  
                  <Input
                    label="Dinner Weight"
                    type="number"
                    value={formData.dinner_weight}
                    onChange={(e) => handleInputChange('dinner_weight', Number(e.target.value))}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText="0.0 to 1.0"
                    fullWidth
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  Weights determine how likely this recipe is to be selected for each meal type during auto-generation.
                </p>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={isLoading}
                disabled={!validateForm()}
              >
                {isEditing ? 'Update Recipe' : 'Create Recipe'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Create Ingredient Modal */}
      <CreateIngredientModal
        isOpen={isCreateIngredientModalOpen}
        onClose={() => {
          setIsCreateIngredientModalOpen(false);
          setPendingIngredientName('');
          setPendingIngredientIndex(null);
        }}
        onSuccess={handleIngredientCreated}
      />
    </>
  );
};

export default CreateRecipeModal;