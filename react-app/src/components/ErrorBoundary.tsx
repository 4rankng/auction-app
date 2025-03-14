import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the child component tree,
 * log those errors, and display a fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log error to an error reporting service
    console.error('Error caught by boundary:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-container p-4 text-center" style={{ maxWidth: '500px', margin: '2rem auto', border: '1px solid #dc3545', borderRadius: '8px', backgroundColor: '#f8d7da' }}>
          <h2 className="text-danger mb-3">Something went wrong</h2>
          <p className="mb-3">Please try refreshing the page or contact support if the problem persists.</p>
          <p className="small text-muted mb-3">
            Error: {this.state.error?.message || 'Unknown error'}
          </p>
          <button
            className="btn btn-outline-danger"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
