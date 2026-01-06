import type React from 'react';
import { useToastContext } from './context-toast';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts } = useToastContext();

  if (toasts.length === 0) {
    return null;
  }

  // Reverse so newest is at index 0
  const reversedToasts = [...toasts].reverse();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {reversedToasts.map((toast, index) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          isExiting={toast.isExiting}
          index={index}
        />
      ))}
    </div>
  );
};
