import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChefHat, ChevronDown, Home } from 'lucide-react';
import { Recipe, ShoppingListItemStatus } from '../../types';
import { ShoppingLine, isLineBought } from '../../utils/shoppingListUtils';
import { getShoppingListItemRecipes } from '../../api/shoppingListApi';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatQuantity } from '../../utils/unitUtils';
import RecipeImagePlaceholder from '../recipes/RecipeImagePlaceholder';

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

  // A tinted full-width panel under the product, so the dishes read as its details and not
  // as more products
  const panel = (content: React.ReactNode) => (
    <div className="border-l-2 border-primary-300 bg-neutral-50 px-4 py-2.5">
      {content}
    </div>
  );

  if (failed) return panel(<p className="text-xs text-error-600">{t('shoppingListItem.failedToLoadRecipes')}</p>);
  if (!recipes) return panel(<p className="text-xs text-neutral-400">{t('common.loading')}</p>);
  if (recipes.length === 0) return panel(<p className="text-xs text-neutral-500">{t('shoppingListItem.noRecipesFound')}</p>);

  const ingredientId = line.items[0].ingredient_id;
  return panel(
    <ul className="space-y-1.5">
      {recipes.map((recipe) => {
        const use = recipe.ingredients.find((ing) => ing.ingredient_id === ingredientId);
        return (
          <li key={recipe.id}>
            <Link
              to={`/recipes/${recipe.id}?fromShoppingList=${listId}`}
              className="flex items-center gap-2.5 rounded-md p-1 -m-1 hover:bg-white"
            >
              {recipe.image_url ? (
                <img src={recipe.image_url} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded object-cover" />
              ) : (
                <RecipeImagePlaceholder category={recipe.category} className="h-8 w-8 shrink-0 rounded" iconClassName="h-4 w-4" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-700">{recipe.name}</span>
              {use && (
                <span className="shrink-0 text-xs text-neutral-500">{formatQuantity(use.quantity, use.unit, t, locale)}</span>
              )}
            </Link>
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
            className="flex min-h-[48px] flex-1 items-center gap-3 py-2.5 pl-4 pr-1 text-left active:bg-neutral-50"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-300 bg-white'
              }`}
            >
              {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span className={`flex-1 text-[15px] leading-snug ${checked ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
              {line.name}
            </span>
            <span className={`shrink-0 text-sm tabular-nums text-right ${checked ? 'text-neutral-300 line-through' : 'text-neutral-500'}`}>
              {quantityOf(line)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpenKey(open ? null : line.key)}
            aria-expanded={open}
            aria-label={t('shoppingListItem.recipes')}
            title={t('shoppingListItem.recipes')}
            className={`flex w-11 shrink-0 items-center justify-center gap-0.5 transition-colors ${
              open ? 'text-primary-600' : 'text-neutral-300 hover:text-neutral-500'
            }`}
          >
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {open && <LineDishes line={line} listId={listId} />}
      </li>
    );
  };

  const sectionHeading = 'sticky top-14 sm:top-16 z-10 bg-neutral-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500';

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {toBuy.length === 0 && (
        <p className="px-4 py-6 text-center text-base text-success-600">{t('shoppingLists.storeMode.allDone')}</p>
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
          <p className="px-4 pt-2 text-xs text-neutral-500">{t('shoppingLists.pantry.hint')}</p>
          <ul className="divide-y divide-neutral-100">{pantryLines.map(renderLine)}</ul>
        </section>
      )}
    </div>
  );
};

export default ShoppingListView;
