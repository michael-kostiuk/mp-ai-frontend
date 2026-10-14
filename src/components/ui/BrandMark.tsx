import React from 'react';

interface BrandMarkProps {
  className?: string;
}

// MealMaster mark: inverted fork reading as "m"; the handle is the single accent detail.
const BrandMark: React.FC<BrandMarkProps> = ({ className = '' }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    strokeLinecap="round"
    strokeWidth={3.5}
    aria-hidden="true"
  >
    <path className="stroke-primary-600" d="M16 4v8" />
    <path stroke="currentColor" d="M6.5 27v-8.5a4.75 4.75 0 0 1 9.5 0V27m0-8.5a4.75 4.75 0 0 1 9.5 0V27" />
  </svg>
);

export default BrandMark;
