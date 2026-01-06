import type React from 'react';
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@extension/ui';
import type { ToastType } from './context-toast';

export interface ToastProps {
  id: number;
  message: string;
  type: ToastType;
  isExiting: boolean;
  index: number;
}

// Paper stack offset (down-right diagonal)
const getStackOffset = (index: number): { x: number; y: number } => {
  const offset = index * 4; // 4px per level
  return { x: offset, y: offset };
};

// Opacity based on stack position
const getOpacity = (index: number, isVisible: boolean, isExiting: boolean): number => {
  if (!isVisible || isExiting) return 0;
  // Gradually reduce opacity for items behind
  return Math.max(0.6, 1 - index * 0.15);
};

export const Toast: React.FC<ToastProps> = ({ message, type, isExiting, index }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger enter animation after mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const { x, y } = getStackOffset(index);
  const opacity = getOpacity(index, isVisible, isExiting);

  const Icon = type === 'error' ? X : Check;

  const getToastStyles = (toastType: ToastType) => {
    switch (toastType) {
      case 'copied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleared':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'refreshed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div
      className={cn(
        'absolute bottom-0 right-0',
        'text-sm whitespace-nowrap',
        'px-4 py-2 rounded-lg shadow-lg border',
        'transition-all duration-200 ease-out',
        getToastStyles(type),
      )}
      style={{
        transform: `translateX(${-x}px) translateY(${-y}px)`,
        opacity,
        zIndex: 30 - index,
      }}
      role="status"
      aria-live="polite">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {message}
      </div>
    </div>
  );
};
