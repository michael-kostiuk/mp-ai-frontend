import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { ShoppingListItem, ShoppingListItemStatus } from '../../types';
import { getLocaleFromLanguage } from '../../utils/i18nUtils';
import { formatQuantity } from '../../utils/unitUtils';

interface ShoppingModeViewProps {
  title: string;
  items: ShoppingListItem[];
  statuses: Record<number, ShoppingListItemStatus>;
  categoryOf: (item: ShoppingListItem) => string;
  onToggle: (itemId: number) => void;
  onClose: () => void;
}

// Full-screen "in the store" list: big tap targets, bought items drop to the bottom
const ShoppingModeView: React.FC<ShoppingModeViewProps> = ({ title, items, statuses, categoryOf, onToggle, onClose }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocaleFromLanguage(i18n.language);

  // The page behind shouldn't scroll while this covers it; Escape closes it
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

  const isBought = (item: ShoppingListItem) => statuses[item.id] === 'purchased';
  const toBuy = items.filter((item) => !isBought(item));
  const bought = items.filter(isBought);

  const groups = toBuy.reduce((acc, item) => {
    const category = categoryOf(item);
    (acc[category] ||= []).push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const renderItem = (item: ShoppingListItem) => {
    const checked = isBought(item);
    return (
      <li key={item.id}>
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          aria-pressed={checked}
          className="w-full min-h-[56px] flex items-center gap-4 px-4 py-3 text-left active:bg-neutral-100"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
              checked ? 'border-primary-500 bg-primary-500 text-white' : 'border-neutral-300 bg-white'
            }`}
          >
            {checked && <Check className="h-5 w-5" />}
          </span>
          <span className={`flex-1 text-lg ${checked ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
            {item.ingredient.name}
          </span>
          <span className={`text-base whitespace-nowrap ${checked ? 'text-neutral-400 line-through' : 'text-neutral-600'}`}>
            {formatQuantity(item.quantity, item.unit, t, locale)}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="text-sm text-neutral-500">
            {t('shoppingLists.storeMode.progress', { bought: bought.length, total: items.length })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
          aria-label={t('common.close')}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {toBuy.length === 0 && (
          <p className="px-4 py-8 text-center text-lg text-success-600">{t('shoppingLists.storeMode.allDone')}</p>
        )}
        {Object.keys(groups)
          .sort((a, b) => a.localeCompare(b))
          .map((category) => (
            <section key={category}>
              <h3 className="sticky top-0 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                {category}
              </h3>
              <ul className="divide-y divide-neutral-100">{groups[category].map(renderItem)}</ul>
            </section>
          ))}
        {bought.length > 0 && (
          <section>
            <h3 className="sticky top-0 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">
              {t('shoppingLists.storeMode.bought')}
            </h3>
            <ul className="divide-y divide-neutral-100">{bought.map(renderItem)}</ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default ShoppingModeView;
