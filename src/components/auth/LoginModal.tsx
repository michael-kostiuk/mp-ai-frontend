import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import Input from '../ui/Input';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { login, lockedFor } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const lockedMessage = (seconds: number) => {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return minutes < 90
      ? t('auth.tooManyAttempts', { minutes })
      : t('auth.tooManyAttemptsHours', { hours: Math.ceil(minutes / 60) });
  };

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(lockedFor > 0 ? lockedMessage(lockedFor) : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trigger = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !submitting) inputRef.current?.focus();
  }, [isOpen, submitting, error]);

  if (!isOpen) return null;

  const submit = async (value: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await login(value);
      if (result === 'wrong') {
        setError(t('auth.wrongPin'));
        setPin('');
      } else if (result !== 'ok') {
        setError(lockedMessage(result.lockedFor));
        setPin('');
      }
    } catch {
      setError(t('auth.loginFailed'));
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
    if (value.length === 4) void submit(value);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('auth.loginTitle')}
        className="bg-white rounded-lg shadow-xl max-w-xs w-full"
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">{t('auth.loginTitle')}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <Input
            ref={inputRef}
            label={t('auth.pinLabel')}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            autoComplete="off"
            autoFocus
            fullWidth
            value={pin}
            onChange={handleChange}
            disabled={submitting}
            error={error ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
