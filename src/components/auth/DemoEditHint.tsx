import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

// Shown in demo mode where editing and deleting are switched off
const DemoEditHint: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
    <p className={`flex items-center gap-2 text-sm text-neutral-500 ${className}`}>
      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('auth.loginToEdit')}
    </p>
  );
};

export default DemoEditHint;
