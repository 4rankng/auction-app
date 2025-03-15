/**
 * Error Management Service
 *
 * Centralized service for handling errors throughout the application.
 * Provides consistent error formatting and handling.
 */

// Define standard error types for the application
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

// Structure for consistent error objects
export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  timestamp: number;
}

class ErrorService {
  private errors: AppError[] = [];
  private errorListeners: ((error: AppError) => void)[] = [];

  /**
   * Handle an error by logging it and notifying listeners
   */
  public handleError(message: string, type: ErrorType = ErrorType.UNKNOWN, originalError?: any): AppError {
    // Create standardized error object
    const appError: AppError = {
      type,
      message,
      originalError,
      timestamp: Date.now()
    };

    // Always log to console for debugging
    console.error(`[${type}] ${message}`, originalError || '');

    // Add to internal error log
    this.errors.push(appError);

    // Notify all listeners
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * Format an error message from various error types
   */
  public formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else {
      return 'Đã xảy ra lỗi không xác định';
    }
  }

  /**
   * Register a listener for error notifications
   */
  public addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);

    // Return a function to remove this listener
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get all recent errors
   */
  public getRecentErrors(count: number = 10): AppError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear all stored errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }
}

// Create singleton instance
export const errorService = new ErrorService();
