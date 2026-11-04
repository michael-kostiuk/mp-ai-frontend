import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Minus, Plus, RefreshCw, X } from 'lucide-react';
import { MealPlan, MealPlanEntry, Recipe } from '../../types';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import RecipeImagePlaceholder from '../recipes/RecipeImagePlaceholder';
import { suggestMeal, updateMealEntry } from '../../api/mealPlanApi';

interface SwapMealModalProps {
  mealPlan: MealPlan;
  entry: MealPlanEntry;
  onClose: () => void;
  onSaved: () => void;
}

const OPTIONS_PER_ROUND = 3;

// Swap one meal of a saved plan for another recipe (a few suggestions to pick from) and/or
// change how many servings are cooked
const SwapMealModal: React.FC<SwapMealModalProps> = ({ mealPlan, entry, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<Recipe[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [selected, setSelected] = useState<Recipe>(entry.recipe);
  const [servings, setServings] = useState(entry.servings);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Suggestions use the same weighted pick as plan generation; each one excludes what was
  // already offered, so a round gives different recipes
  const loadOptions = useCallback(async (shown: Recipe[]) => {
    setLoadingOptions(true);
    setOptionsFailed(false);
    const planRecipeIds = mealPlan.entries.filter((e) => e.id !== entry.id).map((e) => e.recipe_id);
    const offered = shown.map((recipe) => recipe.id);
    const found: Recipe[] = [];
    try {
      for (let i = 0; i < OPTIONS_PER_ROUND; i++) {
        const recipe = await suggestMeal({
          meal_type: entry.meal_type,
          target_calories: mealPlan.target_calories,
          current_recipe_id: entry.recipe_id,
          plan_recipe_ids: planRecipeIds,
          exclude_recipe_ids: [...offered, ...found.map((r) => r.id)],
        });
        // The same recipe coming back means there are no more alternatives
        if (recipe.id === entry.recipe_id || offered.includes(recipe.id) || found.some((r) => r.id === recipe.id)) break;
        found.push(recipe);
      }
      setOptions(found.length > 0 ? found : shown);
      if (found.length === 0) setOptionsFailed(true);
    } catch {
      setOptionsFailed(true);
    } finally {
      setLoadingOptions(false);
    }
  }, [entry, mealPlan]);

  useEffect(() => {
    loadOptions([]);
  }, [loadOptions]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const unchanged = selected.id === entry.recipe_id && servings === entry.servings;
  // A picked recipe stays in view when "more options" brings a new round
  const shownOptions =
    selected.id !== entry.recipe_id && !options.some((recipe) => recipe.id === selected.id) ? [selected, ...options] : options;

  const handleSave = async () => {
    if (unchanged) return onClose();
    setSaving(true);
    setSaveFailed(false);
    try {
      await updateMealEntry(mealPlan.id, entry.id, {
        recipe_id: selected.id,
        date: entry.date,
        meal_type: entry.meal_type,
        servings,
      });
      onSaved();
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  };

  const renderOption = (recipe: Recipe, isCurrent = false) => {
    const isSelected = selected.id === recipe.id;
    return (
      <button
        key={recipe.id}
        type="button"
        onClick={() => setSelected(recipe)}
        aria-pressed={isSelected}
        className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
          isSelected ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-neutral-200 hover:bg-neutral-50'
        }`}
      >
        {recipe.image_url ? (
          <img src={recipe.image_url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <RecipeImagePlaceholder category={recipe.category} className="h-14 w-14 shrink-0 rounded-md" iconClassName="h-6 w-6" />
        )}
        <span className="min-w-0 flex-1">
          {isCurrent && <span className="block text-xs text-neutral-500">{t('mealPlans.swap.current')}</span>}
          <span className="block font-medium text-neutral-900 line-clamp-2">{recipe.name}</span>
          <span className="block text-sm text-neutral-500">
            {t('mealPlans.swap.calories', { count: Math.round(recipe.calories) })}
          </span>
        </span>
        {isSelected && <Check className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-meal-title"
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-lg"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 id="swap-meal-title" className="text-lg font-semibold text-neutral-900">
            {t('mealPlans.swap.title', { meal: t(`mealPlans.mealTypes.${entry.meal_type}`, entry.meal_type).toLowerCase() })}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100" aria-label={t('common.close')}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {renderOption(entry.recipe, true)}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700">{t('mealPlans.swap.alternatives')}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<RefreshCw className={`h-4 w-4 ${loadingOptions ? 'animate-spin' : ''}`} />}
                onClick={() => loadOptions(options)}
                disabled={loadingOptions}
              >
                {t('mealPlans.swap.moreOptions')}
              </Button>
            </div>
            <div className="space-y-2">
              {loadingOptions
                ? Array.from({ length: OPTIONS_PER_ROUND }, (_, i) => <Skeleton key={i} className="h-[74px] rounded-lg" />)
                : shownOptions.map((recipe) => renderOption(recipe))}
              {!loadingOptions && optionsFailed && options.length === 0 && (
                <p className="text-sm text-neutral-500">{t('mealPlans.swap.noOptions')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="text-sm font-medium text-neutral-700">{t('mealPlans.swap.servings')}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white disabled:opacity-40"
                aria-label={t('mealPlans.swap.fewerServings')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-lg font-semibold" aria-live="polite">{servings}</span>
              <button
                type="button"
                onClick={() => setServings(Math.min(20, servings + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white"
                aria-label={t('mealPlans.swap.moreServings')}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          {saveFailed && <p className="text-sm text-error-600">{t('mealPlans.swap.saveFailed')}</p>}
        </div>

        <div className="flex gap-2 border-t border-neutral-200 p-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} isLoading={saving} disabled={unchanged} className="flex-1">
            {t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwapMealModal;
