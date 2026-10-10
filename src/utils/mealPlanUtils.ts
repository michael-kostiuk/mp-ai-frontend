import { MealPlan, MealPlanEntry } from '../types';

const MEAL_TYPE_ORDER: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// 04-11 breakfast, 11-15 lunch, 15-04 dinner. After midnight (00-04) it is still the previous day's dinner.
export const getCurrentMeal = (now: Date): { dateKey: string; mealType: string } => {
  const hour = now.getHours();
  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return { dateKey: toDateKey(yesterday), mealType: 'dinner' };
  }
  return { dateKey: toDateKey(now), mealType: hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : 'dinner' };
};

export const findTodayPlan = (
  mealPlans: MealPlan[],
  dateKey: string
): { mealPlan: MealPlan; entries: MealPlanEntry[] } | null => {
  for (const mealPlan of mealPlans) {
    const entries = mealPlan.entries.filter((entry) => entry.date.slice(0, 10) === dateKey);
    if (entries.length > 0) {
      entries.sort((a, b) => (MEAL_TYPE_ORDER[a.meal_type] || 5) - (MEAL_TYPE_ORDER[b.meal_type] || 5));
      return { mealPlan, entries };
    }
  }
  return null;
};
