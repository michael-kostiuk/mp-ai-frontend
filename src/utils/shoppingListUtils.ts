import { ShoppingList, ShoppingListItem, ShoppingListItemStatus } from '../types';
import { formatDate } from './dateUtils';
import { formatMealPlanRange } from './mealPlanUtils';
import { formatQuantity, normalizeUnit } from './unitUtils';

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

// Order a store is walked in: fresh produce first, spices and drinks last. Lines follow it
// (no headings are shown); unknown categories go to the end.
const CATEGORY_ORDER = [
  'vegetables', 'herbs', 'fresh herbs', 'fruits', 'meat', 'meat & poultry', 'seafood', 'proteins',
  'eggs, tofu & protein', 'dairy', 'frozen', 'grains', 'grains & cereals', 'legumes', 'baking',
  'baking ingredients', 'canned', 'canned goods', 'condiments', 'condiments & sauces', 'fats',
  'fats & oils', 'nuts', 'nuts & seeds', 'snacks', 'beverages', 'spices',
];

const categoryRank = (category: string) => {
  const rank = CATEGORY_ORDER.indexOf(category.trim().toLowerCase());
  return rank === -1 ? CATEGORY_ORDER.length : rank;
};

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
  return [...lines.values()].sort(
    (a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name)
  );
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

// Summing like with like: kg counts as 1000 g, l as 1000 ml
const TO_SMALL_UNIT: Record<string, [string, number]> = { kg: ['g', 1000], l: ['ml', 1000] };
const TO_LARGE_UNIT: Record<string, string> = { g: 'kg', ml: 'l' };

// Amount for a line: the same unit is added up ("100 g + 160 g" -> "260 g"), and an amount
// of 0 ("0 g" of pepper) reads "to taste" instead of a number nobody can buy
export const formatLineQuantity = (
  line: ShoppingLine,
  t: (key: string, fallback: string) => string,
  locale: string
): string => {
  const totals = new Map<string, number>();
  let hasNoAmount = false;
  line.items.forEach((item) => {
    if (!(item.quantity > 0)) {
      hasNoAmount = true;
      return;
    }
    const unit = normalizeUnit(item.unit) ?? (item.unit || '').trim().toLowerCase();
    const [small, factor] = TO_SMALL_UNIT[unit] ?? [unit, 1];
    totals.set(small, (totals.get(small) ?? 0) + item.quantity * factor);
  });
  const parts = [...totals].map(([unit, quantity]) =>
    TO_LARGE_UNIT[unit] && quantity >= 1000
      ? formatQuantity(Math.round(quantity / 100) / 10, TO_LARGE_UNIT[unit], t, locale)
      : formatQuantity(quantity, unit, t, locale)
  );
  if (parts.length === 0 && hasNoAmount) parts.push(t('units.short.toTaste', 'to taste'));
  return parts.join(' + ');
};

// Products to buy (pantry staples left out) and how many are ticked off. Every screen counts
// the same way, so the list page and the list itself never disagree.
export const getListProgress = (
  items: ShoppingListItem[],
  statuses?: Record<number, ShoppingListItemStatus>
) => {
  const lines = groupShoppingLines(items).filter((line) => !line.items.every(isPantryItem));
  const current = statuses ?? Object.fromEntries(items.map((item) => [item.id, item.status]));
  return { lines, bought: lines.filter((line) => isLineBought(line, current)).length, total: lines.length };
};
