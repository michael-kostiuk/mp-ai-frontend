import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <div className={`mb-6 sm:mb-8 lg:mb-10 ${className}`}>
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 lg:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:truncate sm:text-3xl lg:text-4xl xl:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500 sm:mt-2 sm:text-base lg:text-lg max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;