import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onRetry,
  className = '',
}) => {
  const { t } = useTranslation();
  const displayTitle = title || t('errors.anErrorOccurred');
  return (
    <div className={`rounded-md bg-error-50 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-error-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-error-800">{displayTitle}</h3>
          <div className="mt-2 text-sm text-error-700">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-transparent bg-error-100 px-3 py-2 text-sm font-medium text-error-700 hover:bg-error-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                onClick={onRetry}
              >
                {t('common.tryAgain')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;