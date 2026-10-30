import React from 'react';

export function Skeleton({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      <Skeleton className="h-44 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

