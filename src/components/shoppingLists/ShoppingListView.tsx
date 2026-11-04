import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChefHat, ChevronDown, Home } from 'lucide-react';
import { Recipe, ShoppingListItemStatus } from '../../types';
import { ShoppingLine, isLineBought } from '../../utils/shoppingListUtils';
import { getShoppingListItemRecipes } from '../../api/shoppingListApi';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatQuantity } from '../../utils/unitUtils';

interface ShoppingListViewProps {
  listId: number;
  lines: ShoppingLine[];
  pantryLines: ShoppingLine[];
  statuses: Record<number, ShoppingListItemStatus>;
  quantityOf: (line: ShoppingLine) => string;
  onToggle: (line: ShoppingLine) => void;
}

// Which dishes a product goes into, loaded when the line is opened
const LineDishes: React.FC<{ line: ShoppingLine; listId: number }> = ({ line, listId }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    getShoppingListItemRecipes(line.items[0].id).then(setRecipes).catch(() => setFailed(true));
  }, [line]);

  if (failed) return <p className="px-4 pb-3 pl-16 text-sm text-error-600">{t('shoppingListItem.failedToLoadRecipes')}</p>;
  if (!recipes) return <p className="px-4 pb-3 pl-16 text-sm text-neutral-400">{t('common.loading')}</p>;
  if (recipes.length === 0) return <p className="px-4 pb-3 pl-16 text-sm text-neutral-500">{t('shoppingListItem.noRecipesFound')}</p>;

  const ingredientId = line.items[0].ingredient_id;
  return (
    <ul className="space-y-1 px-4 pb-3 pl-16">
      {recipes.map((recipe) => {
        const use = recipe.ingredients.find((ing) => ing.ingredient_id === ingredientId);
        return (
          <li key={recipe.id} className="flex items-baseline justify-between gap-3 text-sm">
            <Link
              to={`/recipes/${recipe.id}?fromShoppingList=${listId}`}
              className="text-primary-700 hover:underline"
            >
              {recipe.name}
            </Link>
            {use && (
              <span className="shrink-0 text-neutral-500">{formatQuantity(use.quantity, use.unit, t, locale)}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

// The shopping list, made for use in the store: big tap targets, bought products drop to
// the bottom, staples to check at home apart. Each product can be opened to see the
// dishes it is for.
const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  listId,
  lines,
  pantryLines,
  statuses,
  quantityOf,
  onToggle,
}) => {
  const { t } = useTranslation();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toBuy = lines.filter((line) => !isLineBought(line, statuses));
  const bought = lines.filter((line) => isLineBought(line, statuses));

  const renderLine = (line: ShoppingLine) => {
    const checked = isLineBought(line, statuses);
    const open = openKey === line.key;
    return (
      <li key={line.key}>
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => onToggle(line)}
            aria-pressed={checked}
            className="flex min-h-[56px] flex-1 items-center gap-4 py-3 pl-4 pr-2 text-left active:bg-neutral-100"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-300 bg-white'
              }`}
            >
              {checked && <Check className="h-5 w-5" />}
            </span>
            <span className={`flex-1 text-lg ${checked ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
              {line.name}
            </span>
            <span className={`text-base text-right ${checked ? 'text-neutral-400 line-through' : 'text-neutral-600'}`}>
              {quantityOf(line)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpenKey(open ? null : line.key)}
            aria-expanded={open}
            aria-label={t('shoppingListItem.recipes')}
            title={t('shoppingListItem.recipes')}
            className="flex w-12 shrink-0 items-center justify-center gap-0.5 text-neutral-400 hover:text-primary-600"
          >
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {open && <LineDishes line={line} listId={listId} />}
      </li>
    );
  };

  const sectionHeading = 'sticky top-14 sm:top-16 z-10 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600';

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {toBuy.length === 0 && (
        <p className="px-4 py-8 text-center text-lg text-success-600">{t('shoppingLists.storeMode.allDone')}</p>
      )}
      {toBuy.length > 0 && <ul className="divide-y divide-neutral-100">{toBuy.map(renderLine)}</ul>}
      {bought.length > 0 && (
        <section>
          <h3 className={sectionHeading}>{t('shoppingLists.storeMode.bought')}</h3>
          <ul className="divide-y divide-neutral-100">{bought.map(renderLine)}</ul>
        </section>
      )}
      {pantryLines.length > 0 && (
        <section>
          <h3 className={`${sectionHeading} flex items-center gap-1.5`}>
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            {t('shoppingLists.pantry.title')}
          </h3>
          <p className="px-4 pt-2 text-sm text-neutral-500">{t('shoppingLists.pantry.hint')}</p>
          <ul className="divide-y divide-neutral-100">{pantryLines.map(renderLine)}</ul>
        </section>
      )}
    </div>
  );
};

export default ShoppingListView;
