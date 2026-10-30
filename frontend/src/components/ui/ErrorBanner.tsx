import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-red-800 my-4"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          icon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}
          className="bg-white border-red-200 text-red-700 hover:bg-red-50"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

