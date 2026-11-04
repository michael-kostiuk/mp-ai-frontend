import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, LanguageCode } from '../../i18n';
import { getLanguageBase } from '../../utils/i18nUtils';

const SHORT_LABELS: Record<LanguageCode, string> = { uk: 'УКР', en: 'ENG' };

// Both languages are always visible as a two-button switch, so it's obvious the site has them.
// `compact` (the phone header) shows only the current one; tapping it opens the list.
const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { i18n } = useTranslation();
  const current = getLanguageBase(i18n.language);
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-0.5 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700"
        >
          {SHORT_LABELS[current]}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <ul role="listbox" className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
              {LANGUAGES.map((language) => (
                <li key={language.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={language.code === current}
                    lang={language.code}
                    onClick={() => {
                      setOpen(false);
                      i18n.changeLanguage(language.code);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    {language.name}
                    {language.code === current && <Check className="h-4 w-4 text-primary-600" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

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
