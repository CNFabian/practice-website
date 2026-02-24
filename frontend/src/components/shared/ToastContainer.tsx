import React from 'react';
import { useToast, type ToastType } from '../../contexts/ToastContext';
import { OnestFont } from '../../assets';

const toastStyles: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'bg-status-green',
    border: 'border-status-green',
    text: 'text-white',
  },
  warning: {
    bg: 'bg-status-yellow',
    border: 'border-status-yellow',
    text: 'text-white',
  },
  error: {
    bg: 'bg-status-red',
    border: 'border-status-red',
    text: 'text-white',
  },
  info: {
    bg: 'bg-elegant-blue',
    border: 'border-elegant-blue',
    text: 'text-white',
  },
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  warning: '⚠',
  error: '✕',
  info: 'ℹ',
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.border} shadow-lg ${toast.exiting ? 'animate-slideOutRight' : 'animate-slideInRight'}`}
          >
            <span className={`text-lg font-bold flex-shrink-0 ${style.text}`}>
              {toastIcons[toast.type]}
            </span>
            <OnestFont weight={500} lineHeight="relaxed" className={`text-sm flex-1 ${style.text}`}>
              {toast.message}
            </OnestFont>
            <button
              onClick={() => removeToast(toast.id)}
              className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
