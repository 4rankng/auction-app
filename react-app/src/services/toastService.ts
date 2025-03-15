/**
 * Toast Service
 *
 * Centralized service for managing toast notifications throughout the application.
 * Provides consistent toast messaging and appearance.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  timestamp: number;
}

class ToastService {
  private toasts: Toast[] = [];
  private toastListeners: ((toasts: Toast[]) => void)[] = [];
  private idCounter = 0;

  /**
   * Show a toast notification
   */
  public showToast(
    message: string,
    type: ToastType = 'info',
    duration: number = 3000
  ): Toast {
    const id = String(++this.idCounter);

    const toast: Toast = {
      id,
      message,
      type,
      duration,
      timestamp: Date.now()
    };

    this.toasts.push(toast);

    // Notify listeners of the updated toast list
    this.notifyListeners();

    // Automatically remove the toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return toast;
  }

  /**
   * Remove a specific toast by ID
   */
  public removeToast(id: string): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all active toasts
   */
  public clearAllToasts(): void {
    this.toasts = [];
    this.notifyListeners();
  }

  /**
   * Register a listener for toast updates
   */
  public addToastListener(listener: (toasts: Toast[]) => void): () => void {
    this.toastListeners.push(listener);

    // Immediately notify with current toasts
    listener([...this.toasts]);

    // Return a function to remove this listener
    return () => {
      this.toastListeners = this.toastListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get all current active toasts
   */
  public getActiveToasts(): Toast[] {
    return [...this.toasts];
  }

  private notifyListeners(): void {
    const toastsCopy = [...this.toasts];

    this.toastListeners.forEach(listener => {
      try {
        listener(toastsCopy);
      } catch (err) {
        console.error('Error in toast listener:', err);
      }
    });
  }

  // Convenience methods for common toast types
  public success(message: string, duration: number = 3000): Toast {
    return this.showToast(message, 'success', duration);
  }

  public error(message: string, duration: number = 3000): Toast {
    return this.showToast(message, 'error', duration);
  }

  public warning(message: string, duration: number = 3000): Toast {
    return this.showToast(message, 'warning', duration);
  }

  public info(message: string, duration: number = 3000): Toast {
    return this.showToast(message, 'info', duration);
  }
}

// Create singleton instance
export const toastService = new ToastService();
