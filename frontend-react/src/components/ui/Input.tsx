import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const inputClasses = `
      block px-4 py-2 w-full rounded-md border
      ${error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' :
        'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
      shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50
      disabled:bg-gray-100 disabled:cursor-not-allowed
      ${className}
    `;

    const containerClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={containerClasses}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
