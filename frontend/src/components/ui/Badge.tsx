import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({
  variant = 'neutral',
  size = 'sm',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 border',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 border',
    error: 'bg-red-50 text-red-700 border-red-200 border',
    info: 'bg-blue-50 text-blue-700 border-blue-200 border',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 border',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 border',
  };

  const dotClasses = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
    neutral: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`}
        />
      )}
      {children}
    </span>
  );
}

