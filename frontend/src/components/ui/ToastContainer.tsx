'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  };

  const bgClasses = {
    success: 'bg-white border-emerald-200 text-gray-900',
    error: 'bg-white border-red-200 text-gray-900',
    info: 'bg-white border-blue-200 text-gray-900',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-center justify-between p-4 rounded-xl border shadow-lg ${bgClasses[toast.type]}`}
      >
        <div className="flex items-center gap-3">
          {icons[toast.type]}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
        <button
          onClick={clearToast}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg ml-2 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

