import React, { useState } from 'react';
import { X } from 'lucide-react';
import { IngredientCreate } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import useApi from '../../hooks/useApi';
import { createIngredient } from '../../api/ingredientApi';

interface CreateIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateIngredientModal: React.FC<CreateIngredientModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<IngredientCreate>({
    name: '',
    category: 'vegetables',
    base_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });

  const { loading: creating, execute: createNewIngredient } = useApi(createIngredient);

  const categoryOptions = [
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'grains', label: 'Grains & Cereals' },
    { value: 'proteins', label: 'Proteins' },
    { value: 'dairy', label: 'Dairy & Eggs' },
    { value: 'fats', label: 'Fats & Oils' },
    { value: 'herbs', label: 'Herbs & Spices' },
    { value: 'nuts', label: 'Nuts & Seeds' },
    { value: 'legumes', label: 'Legumes' },
    { value: 'seafood', label: 'Seafood' },
    { value: 'meat', label: 'Meat & Poultry' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'condiments', label: 'Condiments & Sauces' },
    { value: 'baking', label: 'Baking Ingredients' },
    { value: 'frozen', label: 'Frozen Foods' },
    { value: 'canned', label: 'Canned Goods' },
    { value: 'snacks', label: 'Snacks' },
    { value: 'other', label: 'Other' },
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

  const handleInputChange = (field: keyof IngredientCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return false;
    if (!formData.category) return false;
    if (!formData.base_unit) return false;
    if (formData.calories < 0) return false;
    if (formData.protein < 0) return false;
    if (formData.carbs < 0) return false;
    if (formData.fats < 0) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields with valid values.');
      return;
    }

    try {
      await createNewIngredient(formData);
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        category: 'vegetables',
        base_unit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      });
    } catch (error) {
      console.error('Failed to create ingredient:', error);
    }
  };

  // Common ingredient suggestions based on category
  const getCalorieSuggestion = (category: string) => {
    const suggestions: Record<string, number> = {
      vegetables: 25,
      fruits: 50,
      grains: 350,
      proteins: 200,
      dairy: 150,
      fats: 800,
      nuts: 600,
      legumes: 300,
      seafood: 150,
      meat: 250,
    };
    return suggestions[category] || 0;
  };

  const handleCategoryChange = (category: string) => {
    handleInputChange('category', category);
    
    // Auto-suggest calories based on category
    const suggestedCalories = getCalorieSuggestion(category);
    if (suggestedCalories > 0 && formData.calories === 0) {
      handleInputChange('calories', suggestedCalories);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Add New Ingredient</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Ingredient Name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Chicken Breast, Broccoli, Rice"
              required
              fullWidth
            />
            
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={handleCategoryChange}
              fullWidth
            />
          </div>

          {/* Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Base Unit"
              options={unitOptions}
              value={formData.base_unit}
              onChange={(value) => handleInputChange('base_unit', value)}
              helperText="The standard unit for measuring this ingredient"
              fullWidth
            />
            
            <div className="flex items-end">
              <div className="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-md">
                <p className="font-medium">Nutrition values should be per 100{formData.base_unit}</p>
                <p className="text-xs mt-1">
                  For example: if base unit is "g", enter nutrition per 100g
                </p>
              </div>
            </div>
          </div>

          {/* Nutrition Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Information (per 100{formData.base_unit})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => handleInputChange('calories', Number(e.target.value))}
                  min={0}
                  step={1}
                  placeholder="0"
                  fullWidth
                />
                
                <Input
                  label="Protein (g)"
                  type="number"
                  value={formData.protein}
                  onChange={(e) => handleInputChange('protein', Number(e.target.value))}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  fullWidth
                />
                
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => handleInputChange('carbs', Number(e.target.value))}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  fullWidth
                />
                
                <Input
                  label="Fats (g)"
                  type="number"
                  value={formData.fats}
                  onChange={(e) => handleInputChange('fats', Number(e.target.value))}
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  fullWidth
                />
              </div>
              
              {/* Nutrition Tips */}
              <div className="mt-4 p-3 bg-primary-50 rounded-md">
                <h4 className="text-sm font-medium text-primary-800 mb-2">💡 Nutrition Tips</h4>
                <ul className="text-xs text-primary-700 space-y-1">
                  <li>• Look up nutrition facts on food packaging or nutrition databases</li>
                  <li>• USDA FoodData Central is a reliable source for nutrition information</li>
                  <li>• Values should be for the raw/uncooked ingredient unless specified</li>
                  <li>• Round to reasonable precision (calories to whole numbers, macros to 1 decimal)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Common Ingredients Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Reference (per 100g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h5 className="font-medium text-neutral-700 mb-2">Proteins</h5>
                  <ul className="space-y-1 text-neutral-600">
                    <li>Chicken breast: 165 cal, 31g protein</li>
                    <li>Salmon: 208 cal, 20g protein, 12g fat</li>
                    <li>Eggs: 155 cal, 13g protein, 11g fat</li>
                    <li>Greek yogurt: 59 cal, 10g protein</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-neutral-700 mb-2">Carbohydrates</h5>
                  <ul className="space-y-1 text-neutral-600">
                    <li>Brown rice: 111 cal, 23g carbs</li>
                    <li>Oats: 389 cal, 66g carbs, 17g protein</li>
                    <li>Sweet potato: 86 cal, 20g carbs</li>
                    <li>Quinoa: 120 cal, 22g carbs, 4g protein</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={creating}
              disabled={!validateForm()}
            >
              Add Ingredient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIngredientModal;