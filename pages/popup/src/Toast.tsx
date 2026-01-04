import type React from 'react';
import { m } from './utils';

export interface ToastProps {
  isVisible: boolean;
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ isVisible, message }) => {
  return (
    <div
      className={m(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'bg-slate-800 text-white text-sm',
        'px-4 py-2 rounded-md shadow-lg',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
      role="status"
      aria-live="polite">
      {message}
    </div>
  );
};
