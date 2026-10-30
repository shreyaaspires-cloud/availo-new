import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  ref?: React.Ref<HTMLInputElement>;
}

// React 19: ref passed directly as standard prop (no forwardRef)
export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  ref,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 disabled:bg-gray-50 disabled:text-gray-500 ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

