import { Ingredient } from '../types';
import { normalizeUnit } from './unitUtils';

export type NutritionWarning = 'tooManyCalories' | 'macrosOver100' | 'caloriesDontMatch';

// Flags nutrition that contradicts itself, e.g. 300 kcal with no protein, carbs or fat.
// Only checked for g/ml, where values are per 100 g and the physical limits are known.
export const getNutritionWarning = (ingredient: Ingredient): NutritionWarning | null => {
  const unit = normalizeUnit(ingredient.base_unit);
  if (unit !== 'g' && unit !== 'ml') return null;
  const { calories, protein, carbs, fats } = ingredient;
  if ([calories, protein, carbs, fats].some((value) => value === null || value === undefined)) return null;
  if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) return null; // "missing", handled separately

  // Pure fat is ~900 kcal per 100 g; a little slack for rounding (oil is 0.1 + 99.98)
  if (calories > 900) return 'tooManyCalories';
  if (protein + carbs + fats > 102) return 'macrosOver100';

  // 4 kcal per gram of protein or carbs, 9 per gram of fat. Fibre makes real calories somewhat
  // lower than this (bran, bay leaf), so only flag big gaps: calories far above what the macros
  // allow (fat missing) or far below (macros typed in the wrong boxes)
  const fromMacros = protein * 4 + carbs * 4 + fats * 9;
  if (calories > fromMacros * 1.25 + 40 || fromMacros > calories * 2 + 40) return 'caloriesDontMatch';
  return null;
};
