import { TFunction } from 'i18next';

// Categories are stored as lowercase keys ("breakfast", "dairy"); older rows may differ in case.
// Unknown values are shown as typed, with a capital first letter.
const label = (t: TFunction, namespaces: string[], category: string | null | undefined) => {
  const raw = (category || '').trim();
  const key = raw.toLowerCase() || 'other';
  for (const namespace of namespaces) {
    const fullKey = `${namespace}.${key}`;
    const translated = t(fullKey, { defaultValue: '' });
    if (translated) return translated;
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export const recipeCategoryLabel = (category: string | null | undefined, t: TFunction) =>
  label(t, ['categories'], category);

export const ingredientCategoryLabel = (category: string | null | undefined, t: TFunction) =>
  label(t, ['ingredientCategories', 'categories'], category);
