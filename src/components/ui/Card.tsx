import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  allowOverflow?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
  allowOverflow = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };

  const hoverClasses = hoverable
    ? 'transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer'
    : '';

  const clickableProps = onClick
    ? { onClick, role: 'button', tabIndex: 0 }
    : {};

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md ${allowOverflow ? '' : 'overflow-hidden'}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${className}
      `}
      {...clickableProps}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-neutral-900 ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`mt-4 flex items-center justify-between ${className}`}>
    {children}
  </div>
);

export default Card;