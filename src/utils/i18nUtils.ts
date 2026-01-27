export const getLanguageBase = (language: string | undefined | null): string => {
  if (!language) return 'en';
  return language.split('-')[0];
};

export const getLocaleFromLanguage = (language: string | undefined | null): string => {
  const base = getLanguageBase(language);
  if (base === 'uk') return 'uk-UA';
  if (base === 'en') return 'en-US';
  return 'en-US';
};
