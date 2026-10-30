import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverEffect?: boolean;
}

export function Card({
  children,
  padding = 'md',
  hoverEffect = false,
  className = '',
  ...props
}: CardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hoverEffect
    ? 'hover:border-blue-200 hover:shadow-md transition-all duration-200'
    : '';

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${paddingClasses[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

