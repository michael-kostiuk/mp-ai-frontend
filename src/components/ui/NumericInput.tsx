import React, { forwardRef } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** The numeric value. When 0, displays empty to allow easy input. */
  value: number;
  /** Called with the new numeric value. Empty input returns 0. */
  onChange: (value: number) => void;
}

/**
 * NumericInput - A specialized input for numeric values.
 * 
 * Handles the common issue where numeric inputs with value={0} prevent users
 * from clearing the field to type a new value. This component:
 * - Displays empty string when value is 0 (allows typing without "0" prefix)
 * - Converts empty input back to 0
 * - Validates numeric input before calling onChange
 * 
 * Usage:
 * ```tsx
 * <NumericInput
 *   label="Calories"
 *   value={formData.calories}
 *   onChange={(val) => setFormData(prev => ({ ...prev, calories: val }))}
 *   min={0}
 * />
 * ```
 */
const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  fullWidth = false,
  id,
  value,
  onChange,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const inputBaseClasses = 'appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 transition-colors';
  
  const inputStatusClasses = error
    ? 'border-error-300 focus:border-error-300 focus:ring-error-200 text-error-900 placeholder-error-300'
    : 'border-neutral-300 focus:border-primary-300 focus:ring-primary-200 text-neutral-900 placeholder-neutral-400';
  
  const paddingLeftClass = leftIcon ? 'pl-10' : '';
  const paddingRightClass = rightIcon ? 'pr-10' : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = e.target.value;
    
    if (stringValue === '') {
      onChange(0);
      return;
    }
    
    const numValue = Number(stringValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  // Display empty string when value is 0 to allow easy input
  const displayValue = value === 0 ? '' : value;
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type="number"
          className={`
            ${inputBaseClasses}
            ${inputStatusClasses}
            ${paddingLeftClass}
            ${paddingRightClass}
            ${widthClass}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          value={displayValue}
          onChange={handleChange}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral-500">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error-600">
          {error}
        </p>
      )}
      
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-neutral-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

NumericInput.displayName = 'NumericInput';

export default NumericInput;
