import type React from 'react';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@extension/ui';

export interface ToastProps {
  id: number;
  message: string;
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

export const Toast: React.FC<ToastProps> = ({ message, isExiting, index }) => {
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

  return (
    <div
      className={cn(
        'absolute bottom-0 right-0',
        'bg-primary text-primary-foreground text-sm whitespace-nowrap',
        'px-4 py-2 rounded-lg shadow-lg border border-primary/20',
        'transition-all duration-200 ease-out',
      )}
      style={{
        transform: `translateX(${-x}px) translateY(${-y}px)`,
        opacity,
        zIndex: 30 - index,
      }}
      role="status"
      aria-live="polite">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        {message}
      </div>
    </div>
  );
};
