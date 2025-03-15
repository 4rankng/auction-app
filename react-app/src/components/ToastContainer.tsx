import React, { useEffect, useState } from 'react';
import { Toast as ToastType, toastService } from '../services/toastService';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right' }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    // Subscribe to toast updates
    const unsubscribe = toastService.addToastListener(currentToasts => {
      setToasts(currentToasts);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Generate position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'position-fixed top-0 end-0 p-3';
      case 'top-left':
        return 'position-fixed top-0 start-0 p-3';
      case 'bottom-right':
        return 'position-fixed bottom-0 end-0 p-3';
      case 'bottom-left':
        return 'position-fixed bottom-0 start-0 p-3';
      case 'top-center':
        return 'position-fixed top-0 start-50 translate-middle-x p-3';
      case 'bottom-center':
        return 'position-fixed bottom-0 start-50 translate-middle-x p-3';
      default:
        return 'position-fixed top-0 end-0 p-3';
    }
  };

  // Get bootstrap background class based on toast type
  const getToastBgClass = (type: ToastType['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'error':
        return 'bg-danger';
      case 'warning':
        return 'bg-warning';
      case 'info':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  // Don't render if no toasts
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container ${getPositionClasses()}`}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast show ${getToastBgClass(toast.type)} text-white`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <strong className="me-auto">Thông báo</strong>
            <button
              type="button"
              className="btn-close"
              onClick={() => toastService.removeToast(toast.id)}
              aria-label="Close"
            ></button>
          </div>
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
