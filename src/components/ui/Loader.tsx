import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  label?: string;
  centered?: boolean;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  label,
  centered = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-500',
    accent: 'text-accent-500',
    white: 'text-white',
  };
  
  const containerClasses = centered
    ? 'flex flex-col items-center justify-center'
    : 'inline-flex flex-col items-center';
  
  return (
    <div className={`${containerClasses} ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        data-testid="loader"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      
      {label && (
        <span className="mt-2 text-sm text-neutral-700">{label}</span>
      )}
    </div>
  );
};

export default Loader;