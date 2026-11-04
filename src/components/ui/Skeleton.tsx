import React from 'react';

// Grey placeholder block shown while content loads, so the page doesn't jump when it arrives
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-neutral-200 ${className}`} aria-hidden="true" />
);

export default Skeleton;
