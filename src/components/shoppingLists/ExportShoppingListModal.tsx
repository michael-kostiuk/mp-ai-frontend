import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Share2, X } from 'lucide-react';
import Button from '../ui/Button';
import { copyTextToClipboard } from '../../utils/clipboardUtils';

interface ExportShoppingListModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

const ExportShoppingListModal: React.FC<ExportShoppingListModalProps> = ({
  isOpen,
  title,
  content,
  onClose,
}) => {
  const { t } = useTranslation();

  const canShare = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
  }, []);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(content);
    if (ok) {
      alert(t('common.copiedToClipboard'));
      return;
    }

    alert(t('common.copyFailed'));
  };

  const handleShare = async () => {
    if (!canShare) return;

    try {
      await (navigator as any).share({
        title,
        text: content,
      });
    } catch {
      // User cancelled or share failed; keep modal open.
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            readOnly
            value={content}
            className="w-full h-64 p-3 text-sm font-mono border border-neutral-200 rounded-md bg-neutral-50 text-neutral-900"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCopy} leftIcon={<Copy className="h-4 w-4" />}>
              {t('common.copy')}
            </Button>

            {canShare && (
              <Button variant="outline" onClick={handleShare} leftIcon={<Share2 className="h-4 w-4" />}>
                {t('common.share')}
              </Button>
            )}

            <Button variant="ghost" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportShoppingListModal;
