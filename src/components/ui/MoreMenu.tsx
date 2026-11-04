import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import Button from './Button';

export interface MoreMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface MoreMenuProps {
  items: MoreMenuItem[];
  // Open upwards when the button sits at the bottom of the page
  placement?: 'down' | 'up';
  buttonClassName?: string;
}

// "⋯" button with rarely used actions, so destructive ones can't be tapped by accident
const MoreMenu: React.FC<MoreMenuProps> = ({ items, placement = 'down', buttonClassName = '' }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        aria-label={t('common.moreActions')}
        aria-expanded={open}
        aria-haspopup="menu"
        className={buttonClassName}
      >
        <MoreHorizontal className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className={`absolute right-0 z-20 w-52 rounded-md border border-neutral-200 bg-white py-1 shadow-lg ${
              placement === 'up' ? 'bottom-full mb-1' : 'mt-1'
            }`}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  item.danger ? 'text-error-600 hover:bg-error-50' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MoreMenu;
