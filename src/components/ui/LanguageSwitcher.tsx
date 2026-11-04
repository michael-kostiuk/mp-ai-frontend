import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LanguageCode } from '../../i18n';
import { getLanguageBase } from '../../utils/i18nUtils';

const SHORT_LABELS: Record<LanguageCode, string> = { uk: 'УКР', en: 'ENG' };

// Both languages are always visible as a two-button switch, so it's obvious the site has them
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const current = getLanguageBase(i18n.language);

  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-white p-0.5 text-xs font-semibold" role="group">
      {LANGUAGES.map((language) => {
        const active = language.code === current;
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            onClick={() => i18n.changeLanguage(language.code)}
            aria-pressed={active}
            title={language.name}
            className={`rounded px-2 py-1 transition-colors ${
              active ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {SHORT_LABELS[language.code]}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
