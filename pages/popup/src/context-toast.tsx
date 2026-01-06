import type React from 'react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'copied' | 'cleared' | 'refreshed' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  isExiting: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 1500;
const EXIT_ANIMATION_DURATION = 200;
const MAX_TOASTS = 5;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id: number) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, isExiting: true } : t)));

    // Remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, EXIT_ANIMATION_DURATION);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'copied') => {
      const id = ++idCounter.current;
      const newToast: Toast = { id, message, type, isExiting: false };

      setToasts(prev => {
        // Limit max toasts - remove oldest if at limit
        const updated = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
        return [...updated, newToast];
      });

      // Auto-remove after duration
      setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);
    },
    [removeToast],
  );

  return <ToastContext.Provider value={{ toasts, showToast, removeToast }}>{children}</ToastContext.Provider>;
};

export function useToastContext(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
}
