import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, Clock, Users, Target, Sparkles } from 'lucide-react';
import { Ingredient, RecipeCreate, RecipeIngredientCreate, Recipe } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import NumericInput from '../ui/NumericInput';
import Select from '../ui/Select';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import IngredientSearchSelect from './IngredientSearchSelect';
import CreateIngredientModal from '../ingredients/CreateIngredientModal';
import FileUpload from '../ui/FileUpload';
import useApi from '../../hooks/useApi';
import { useIngredientContext } from '../../context/IngredientContext';
import { createRecipe, updateRecipe, uploadRecipeImage } from '../../api/recipeApi';
import { estimateNutrition, IngredientInput } from '../../api/nutritionApi';
import { UNIT_OPTIONS, coerceUnit } from '../../utils/unitUtils';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRecipe?: Recipe | null;
  initialRecipe?: Partial<RecipeCreate> | null;
  initialIngredientNotes?: string[] | null;
}

const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingRecipe = null,
  initialRecipe = null,
  initialIngredientNotes = null
}) => {
  const { t } = useTranslation();
  const isEditing = !!editingRecipe;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  const [estimating, setEstimating] = useState(false);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [ingredientNotes, setIngredientNotes] = useState<string[]>([]);

  const { ingredients, fetchIngredients } = useIngredientContext();
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
        dietary_tags: [...(editingRecipe.dietary_tags || [])],
        calories: editingRecipe.calories,
        protein: editingRecipe.protein,
        carbs: editingRecipe.carbs,
        fats: editingRecipe.fats,
        breakfast_weight: editingRecipe.breakfast_weight,
        lunch_weight: editingRecipe.lunch_weight,
        dinner_weight: editingRecipe.dinner_weight,
        ingredients: editingRecipe.ingredients.map((ing) => ({
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: coerceUnit(ing.unit, 'piece'),
        })),
        image_url: editingRecipe.image_url,
      });
      setImagePreviewUrl(editingRecipe.image_url);
      setIngredientNotes(editingRecipe.ingredients.map(() => ''));
    } else {
      const base: RecipeCreate = {
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
        ingredients: [],
        image_url: undefined
      };

      const merged: RecipeCreate = {
        ...base,
        ...(initialRecipe || {}),
        dietary_tags: initialRecipe?.dietary_tags ?? base.dietary_tags,
        ingredients: (initialRecipe?.ingredients ?? base.ingredients).map((ing) => ({
          ...ing,
          unit: coerceUnit((ing as { unit?: unknown }).unit, 'piece'),
        })),
      };

      setFormData(merged);
      setImagePreviewUrl(undefined);
      setImageFile(undefined);
      setIngredientNotes(
        (initialIngredientNotes && initialIngredientNotes.length === (merged.ingredients?.length || 0))
          ? initialIngredientNotes
          : (merged.ingredients || []).map(() => '')
      );
    }
  }, [editingRecipe, initialRecipe, initialIngredientNotes]);

  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
    }
  }, [isOpen, fetchIngredients]);

  useEffect(() => {
    if (!isOpen) return;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, editingRecipe, initialRecipe]);

  const categoryOptions = [
    { value: 'breakfast', label: t('categories.breakfast') },
    { value: 'lunch', label: t('categories.lunch') },
    { value: 'dinner', label: t('categories.dinner') },
    { value: 'dessert', label: t('categories.dessert') },
    { value: 'snack', label: t('categories.snack') },
    { value: 'appetizer', label: t('categories.appetizer') },
    { value: 'side', label: t('categories.side') },
    { value: 'beverage', label: t('categories.beverage') },
  ];

  const dietaryTagOptions = [
    { value: 'vegetarian', label: t('dietary.vegetarian') },
    { value: 'vegan', label: t('dietary.vegan') },
    { value: 'gluten-free', label: t('dietary.glutenFree') },
    { value: 'dairy-free', label: t('dietary.dairyFree') },
    { value: 'keto', label: t('dietary.keto') },
    { value: 'low-carb', label: t('dietary.lowCarb') },
    { value: 'high-protein', label: t('dietary.highProtein') },
    { value: 'paleo', label: t('dietary.paleo') },
    { value: 'whole30', label: t('dietary.whole30') },
    { value: 'mediterranean', label: t('dietary.mediterranean') },
  ];

  const unitOptions = UNIT_OPTIONS;

  const handleInputChange = <K extends keyof RecipeCreate>(field: K, value: RecipeCreate[K]) => {
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
    setIngredientNotes(prev => [...prev, '']);
  };

  const updateIngredient = <K extends keyof RecipeIngredientCreate>(index: number, field: K, value: RecipeIngredientCreate[K]) => {
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
    setIngredientNotes(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageSelect = (url: string, file?: File) => {
    setImagePreviewUrl(url);
    setImageFile(file);
    setImageUploadError(null);
    // Clear formData.image_url when new file is selected so backend knows to delete old image
    if (isEditing && file) {
      setFormData(prev => ({ ...prev, image_url: undefined }));
    }
  };

  const handleImageRemove = () => {
    setImagePreviewUrl(undefined);
    setImageFile(undefined);
    setImageUploadError(null);
    setFormData(prev => ({ ...prev, image_url: undefined }));
  };

  const handleCreateNewIngredient = (name: string, index: number | null) => {
    setPendingIngredientName(name);
    setPendingIngredientIndex(index);
    setIsCreateIngredientModalOpen(true);
  };

  const handleIngredientCreated = (ingredient: Ingredient) => {
    fetchIngredients();
    if (pendingIngredientIndex !== null) {
      updateIngredient(pendingIngredientIndex, 'ingredient_id', ingredient.id);
      setIngredientNotes(prev => prev.map((note, i) => (i === pendingIngredientIndex ? '' : note)));
    }
  };

  const calculateNutrition = () => {
    if (!ingredients || formData.ingredients.length === 0) return;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

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

  const estimateNutritionFromApi = async () => {
    if (!ingredients || formData.ingredients.length === 0) return;

    // Build the ingredients list for the API
    const ingredientInputs: IngredientInput[] = formData.ingredients
      .map(recipeIngredient => {
        const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredient_id);
        if (ingredient) {
          return {
            name: ingredient.name,
            quantity: recipeIngredient.quantity,
            unit: recipeIngredient.unit
          };
        }
        return null;
      })
      .filter((ing): ing is IngredientInput => ing !== null);

    if (ingredientInputs.length === 0) {
      alert(t('recipes.form.addValidIngredientsFirst'));
      return;
    }

    setEstimating(true);
    try {
      const servings = formData.servings || 1;
      const response = await estimateNutrition({
        ingredients: ingredientInputs,
        servings
      });

      // Backend now returns per-serving nutrition
      setFormData(prev => ({
        ...prev,
        calories: Math.round(response.calories),
        protein: Math.round(response.protein * 10) / 10,
        carbs: Math.round(response.carbs * 10) / 10,
        fats: Math.round(response.fats * 10) / 10,
      }));
    } catch (error) {
      console.error('Failed to estimate nutrition:', error);
      alert(t('recipes.failedToEstimate'));
    } finally {
      setEstimating(false);
    }
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
      alert(t('recipes.form.validationError'));
      return;
    }

    // Convert empty strings to 0 for numeric fields before submitting
    const cleanedFormData = {
      ...formData,
      servings: formData.servings === '' ? 0 : Number(formData.servings),
      prep_time: formData.prep_time === '' ? 0 : Number(formData.prep_time),
      cook_time: formData.cook_time === '' ? 0 : Number(formData.cook_time),
      calories: formData.calories === '' ? 0 : Number(formData.calories),
      protein: formData.protein === '' ? 0 : Number(formData.protein),
      carbs: formData.carbs === '' ? 0 : Number(formData.carbs),
      fats: formData.fats === '' ? 0 : Number(formData.fats),
      breakfast_weight: formData.breakfast_weight === '' ? 0 : Number(formData.breakfast_weight),
      lunch_weight: formData.lunch_weight === '' ? 0 : Number(formData.lunch_weight),
      dinner_weight: formData.dinner_weight === '' ? 0 : Number(formData.dinner_weight),
      ingredients: formData.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity === '' ? 0 : Number(ing.quantity)
      }))
    };

    try {
      let result: Recipe;
      if (isEditing && editingRecipe) {
        result = await updateExistingRecipe(editingRecipe.id, cleanedFormData);
      } else {
        result = await createNewRecipe(formData);
      }

      // Upload image if there's a new file selected
      if (imageFile) {
        setUploadingImage(true);
        setImageUploadError(null);
        try {
          const uploadResult = await uploadRecipeImage(result.id, imageFile);
          setFormData(prev => ({ ...prev, image_url: uploadResult.image_url }));
          setImagePreviewUrl(uploadResult.image_url);
          setImageFile(undefined);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          setImageUploadError(t('recipes.form.imageSavedButUploadFailed'));
          setUploadingImage(false);
          onSuccess();
          return;
        } finally {
          setUploadingImage(false);
        }
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
          ingredients: [],
          image_url: undefined
        });
        setIngredientNotes([]);
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
        ingredients: [],
        image_url: undefined
      });
      setImagePreviewUrl(undefined);
      setImageFile(undefined);
      setIngredientNotes([]);
    }
    setPendingIngredientName('');
    setPendingIngredientIndex(null);
    setIsCreateIngredientModalOpen(false);
  };

  if (!isOpen) return null;

  const isLoading = creating || updating || uploadingImage;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div ref={scrollContainerRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <h2 className="text-xl font-semibold text-neutral-900">
              {isEditing ? t('recipes.editRecipe') : t('recipes.createRecipe')}
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
                label={t('recipes.form.recipeName')}
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('recipes.form.enterRecipeName')}
                required
                fullWidth
              />

              <Select
                label={t('recipes.form.category')}
                options={categoryOptions}
                value={formData.category}
                onChange={(value) => handleInputChange('category', value)}
                fullWidth
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('recipes.form.recipeImage')}
              </label>
              <FileUpload
                value={imagePreviewUrl}
                onChange={handleImageSelect}
                onRemove={handleImageRemove}
                isUploading={uploadingImage}
              />
              {imageUploadError && (
                <p className="text-sm text-error-600 mt-2">{imageUploadError}</p>
              )}
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumericInput
                label={t('recipes.form.servings')}
                value={formData.servings}
                onChange={(val) => handleInputChange('servings', val)}
                leftIcon={<Users className="h-5 w-5" />}
                min={1}
                max={20}
                required
                fullWidth
              />

              <NumericInput
                label={t('recipes.form.prepTime')}
                value={formData.prep_time}
                onChange={(val) => handleInputChange('prep_time', val)}
                leftIcon={<Clock className="h-5 w-5" />}
                min={0}
                max={480}
                required
                fullWidth
              />

              <NumericInput
                label={t('recipes.form.cookTime')}
                value={formData.cook_time}
                onChange={(val) => handleInputChange('cook_time', val)}
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
                {t('recipes.form.instructions')}
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder={t('recipes.form.enterInstructions')}
                rows={6}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-300 focus:ring-primary-200 focus:ring-2 focus:outline-none"
                required
              />
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t('recipes.form.dietaryTags')}
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
                <h3 className="text-lg font-medium text-neutral-900">{t('recipes.form.ingredients')}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIngredient}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {t('recipes.form.addIngredient')}
                </Button>
              </div>

              {formData.ingredients.some(ing => ing.ingredient_id === 0) && (
                <div className="mb-4 rounded-md border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
                  {t('recipes.form.unmappedWarning')}
                </div>
              )}

              <div className="space-y-4">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                    <div className="grid grid-cols-12 gap-3 items-end">
                      {/* Ingredient - Takes up most space */}
                      <div className="col-span-12 sm:col-span-6 lg:col-span-5">
                        <IngredientSearchSelect
                          value={ingredient.ingredient_id}
                          onChange={(ingredientId) => updateIngredient(index, 'ingredient_id', ingredientId)}
                          onCreateNew={(name) => handleCreateNewIngredient(name, index)}
                          placeholder={t('recipes.form.searchIngredient')}
                          initialDisplayName={ingredientNotes[index] || ''}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-6 sm:col-span-3 lg:col-span-2">
                        <NumericInput
                          value={ingredient.quantity}
                          onChange={(val) => updateIngredient(index, 'quantity', val)}
                          min={0}
                          step={0.1}
                          placeholder={t('recipes.form.quantity')}
                          fullWidth
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-4 sm:col-span-2 lg:col-span-3">
                        <Select
                          options={unitOptions}
                          value={ingredient.unit}
                          onChange={(value) => updateIngredient(index, 'unit', value)}
                          fullWidth
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-2 sm:col-span-1 lg:col-span-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          className="text-error-600 hover:text-error-700 w-full h-[42px] px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {ingredient.ingredient_id === 0 && ingredientNotes[index] && (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2">
                        <div className="min-w-0 text-xs text-neutral-600">
                          <span className="font-medium text-neutral-700">{t('recipes.form.parsed')}:</span>{' '}
                          <span className="break-words">{ingredientNotes[index]}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateNewIngredient(ingredientNotes[index], index)}
                          className="shrink-0"
                        >
                          {t('common.create')}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {formData.ingredients.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 border-2 border-dashed border-neutral-200 rounded-lg">
                    {t('recipes.form.noIngredientsYet')}
                  </div>
                )}
              </div>

              {formData.ingredients.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculateNutrition}
                    leftIcon={<Target className="h-4 w-4" />}
                  >
                    {t('recipes.form.calculateNutrition')}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={estimateNutritionFromApi}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                    isLoading={estimating}
                    disabled={estimating}
                  >
                    {t('recipes.form.estimateWithAI')}
                  </Button>
                </div>
              )}
            </div>

            {/* Nutrition Information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('recipes.form.nutritionInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <NumericInput
                    label={t('recipes.form.calories')}
                    value={formData.calories}
                    onChange={(val) => handleInputChange('calories', val)}
                    min={0}
                    fullWidth
                  />

                  <NumericInput
                    label={t('recipes.form.protein')}
                    value={formData.protein}
                    onChange={(val) => handleInputChange('protein', val)}
                    min={0}
                    step={0.1}
                    fullWidth
                  />

                  <NumericInput
                    label={t('recipes.form.fats')}
                    value={formData.fats}
                    onChange={(val) => handleInputChange('fats', val)}
                    min={0}
                    step={0.1}
                    fullWidth
                  />

                  <NumericInput
                    label={t('recipes.form.carbs')}
                    value={formData.carbs}
                    onChange={(val) => handleInputChange('carbs', val)}
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
                <CardTitle>{t('recipes.form.mealTypeWeights')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <NumericInput
                    label={t('recipes.form.breakfastWeight')}
                    value={formData.breakfast_weight}
                    onChange={(val) => handleInputChange('breakfast_weight', val)}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText={t('recipes.form.weightHelperText')}
                    fullWidth
                  />

                  <NumericInput
                    label={t('recipes.form.lunchWeight')}
                    value={formData.lunch_weight}
                    onChange={(val) => handleInputChange('lunch_weight', val)}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText={t('recipes.form.weightHelperText')}
                    fullWidth
                  />

                  <NumericInput
                    label={t('recipes.form.dinnerWeight')}
                    value={formData.dinner_weight}
                    onChange={(val) => handleInputChange('dinner_weight', val)}
                    min={0}
                    max={1}
                    step={0.1}
                    helperText={t('recipes.form.weightHelperText')}
                    fullWidth
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-2">
                  {t('recipes.form.weightsDescription')}
                </p>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={!validateForm()}
              >
                {isEditing ? t('recipes.updateRecipe') : t('recipes.createRecipe')}
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
        onSuccess={() => {
          setPendingIngredientName('');
          setPendingIngredientIndex(null);
        }}
        onCreated={handleIngredientCreated}
        initialName={pendingIngredientName}
      />
    </>
  );
};

export default CreateRecipeModal;
