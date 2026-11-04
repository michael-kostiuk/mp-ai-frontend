import { ShoppingList } from '../types';
import { formatDate } from './dateUtils';
import { formatMealPlanRange } from './mealPlanUtils';

// "Shopping list · 2–8 November" for lists from a plan, otherwise named after the day it was made
export const getShoppingListTitle = (
  list: Pick<ShoppingList, 'created_at' | 'meal_plan'>,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string
) =>
  list.meal_plan
    ? t('shoppingLists.titleForPlan', { range: formatMealPlanRange(list.meal_plan, locale) })
    : t('shoppingLists.titleFromDate', { date: formatDate(list.created_at, locale) });
