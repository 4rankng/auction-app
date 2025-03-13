import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const textareaClasses = `
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
        <textarea
          ref={ref}
          className={textareaClasses}
          aria-invalid={error ? 'true' : 'false'}
          rows={4}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
