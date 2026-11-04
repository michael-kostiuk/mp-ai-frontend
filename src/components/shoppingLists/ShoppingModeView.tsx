import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Home, X } from 'lucide-react';
import { ShoppingListItemStatus } from '../../types';
import { ShoppingLine, isLineBought } from '../../utils/shoppingListUtils';

interface ShoppingModeViewProps {
  title: string;
  lines: ShoppingLine[];
  pantryLines: ShoppingLine[];
  statuses: Record<number, ShoppingListItemStatus>;
  categoryLabel: (category: string) => string;
  quantityOf: (line: ShoppingLine) => string;
  onToggle: (line: ShoppingLine) => void;
  onClose: () => void;
}

// Full-screen "in the store" list: big tap targets, bought items drop to the bottom
const ShoppingModeView: React.FC<ShoppingModeViewProps> = ({
  title,
  lines,
  pantryLines,
  statuses,
  categoryLabel,
  quantityOf,
  onToggle,
  onClose,
}) => {
  const { t } = useTranslation();

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

  const toBuy = lines.filter((line) => !isLineBought(line, statuses));
  const bought = lines.filter((line) => isLineBought(line, statuses));

  const groups = toBuy.reduce((acc, line) => {
    const category = categoryLabel(line.category);
    (acc[category] ||= []).push(line);
    return acc;
  }, {} as Record<string, ShoppingLine[]>);

  const renderLine = (line: ShoppingLine) => {
    const checked = isLineBought(line, statuses);
    return (
      <li key={line.key}>
        <button
          type="button"
          onClick={() => onToggle(line)}
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
            {line.name}
          </span>
          <span className={`text-base text-right ${checked ? 'text-neutral-400 line-through' : 'text-neutral-600'}`}>
            {quantityOf(line)}
          </span>
        </button>
      </li>
    );
  };

  const sectionHeading = 'sticky top-0 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-600';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="text-sm text-neutral-500">
            {t('shoppingLists.storeMode.progress', { bought: bought.length, total: lines.length })}
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
              <h3 className={sectionHeading}>{category}</h3>
              <ul className="divide-y divide-neutral-100">{groups[category].map(renderLine)}</ul>
            </section>
          ))}
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
    </div>
  );
};

export default ShoppingModeView;
