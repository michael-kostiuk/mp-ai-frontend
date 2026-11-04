import { ShoppingList, ShoppingListItem, ShoppingListItemStatus } from '../types';
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

// Things most kitchens already have: shown apart under "Check at home" instead of in the list
const PANTRY_NAMES = /^(сіль|вода|окріп|чорний перець|перець чорний|salt|water|black pepper)\b/i;

export const isPantryItem = (item: ShoppingListItem) =>
  (item.ingredient.category || item.category || '').toLowerCase() === 'spices' ||
  PANTRY_NAMES.test(item.ingredient.name.trim());

export interface ShoppingLine {
  key: string;
  name: string;
  category: string;
  items: ShoppingListItem[];
}

// One line per product: the same ingredient can come back as several items (100 g + "to taste")
export const groupShoppingLines = (items: ShoppingListItem[]): ShoppingLine[] => {
  const lines = new Map<string, ShoppingLine>();
  items.forEach((item) => {
    const key = item.ingredient.name.trim().toLowerCase();
    const line = lines.get(key);
    if (line) line.items.push(item);
    else
      lines.set(key, {
        key,
        name: item.ingredient.name.trim(),
        category: item.ingredient.category || item.category || 'other',
        items: [item],
      });
  });
  return [...lines.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const isLineBought = (line: ShoppingLine, statuses: Record<number, ShoppingListItemStatus>) =>
  line.items.every((item) => statuses[item.id] === 'purchased');

// Ticking a line ticks every item in it; unticking a fully bought line clears them all
export const toggleLine = (
  line: ShoppingLine,
  statuses: Record<number, ShoppingListItemStatus>,
  toggle: (itemId: number) => void
) => {
  const bought = isLineBought(line, statuses);
  line.items.forEach((item) => {
    if (bought || statuses[item.id] !== 'purchased') toggle(item.id);
  });
};
