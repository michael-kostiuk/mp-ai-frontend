import { MealPlan, MealPlanEntry, ShoppingListMealPlan } from '../types';
import { formatDateRange, parseDateKey } from './dateUtils';

// "2–8 November" style label for a meal plan's dates
export const formatMealPlanRange = (plan: Pick<ShoppingListMealPlan, 'start_date' | 'end_date'>, locale: string) =>
  formatDateRange(plan.start_date, plan.end_date, locale);

// Calendar days a plan really has meals on ("2026-11-02", ...). A plan with no meals yet
// falls back to every day from its start to its end date.
export const getMealPlanDayKeys = (plan: Pick<MealPlan, 'start_date' | 'end_date' | 'entries'>): string[] => {
  const withMeals = new Set((plan.entries ?? []).map((entry) => entry.date.slice(0, 10)));
  if (withMeals.size > 0) return [...withMeals].sort();
  const days: string[] = [];
  const day = parseDateKey(plan.start_date);
  const last = plan.end_date.slice(0, 10);
  while (toDateKey(day) <= last) {
    days.push(toDateKey(day));
    day.setDate(day.getDate() + 1);
  }
  return days;
};

export const getMealPlanDayCount = (plan: Pick<MealPlan, 'start_date' | 'end_date' | 'entries'>) =>
  getMealPlanDayKeys(plan).length;

const rangeKey = (plan: Pick<MealPlan, 'start_date' | 'end_date'>) =>
  `${plan.start_date.slice(0, 10)}_${plan.end_date.slice(0, 10)}`;

// One plan per set of dates: the newest version, with how many versions there are
export const getLatestPlans = (plans: MealPlan[]): Array<{ plan: MealPlan; versionCount: number }> => {
  const groups: Record<string, MealPlan[]> = {};
  plans.forEach((plan) => (groups[rangeKey(plan)] ||= []).push(plan));
  return Object.values(groups).map((group) => ({
    plan: group.reduce((latest, plan) => (plan.created_at > latest.created_at ? plan : latest)),
    versionCount: group.length,
  }));
};

// Every version of the plan's dates, oldest first ("Version 1", "Version 2", ...)
export const getPlanVersions = (plans: MealPlan[], plan: Pick<MealPlan, 'start_date' | 'end_date'>) =>
  plans
    .filter((other) => rangeKey(other) === rangeKey(plan))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

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
