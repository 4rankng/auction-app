import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
import { BidPage } from './pages/BidPage';
import { ResultPage } from './pages/ResultPage';
import ErrorBoundary from './components/ErrorBoundary';

/* OPTIMIZATION OPPORTUNITY:
 * We should implement Error Boundaries for better error handling:
 *
 * 1. Benefits:
 *    - Prevents the entire app from crashing when errors occur
 *    - Provides graceful fallback UI for users
 *    - Helps with error logging and debugging
 *    - Works well with any state management solution
 *
 * 2. Implementation example:
 * ```
 * class ErrorBoundary extends React.Component {
 *   state = { hasError: false, error: null };
 *
 *   static getDerivedStateFromError(error) {
 *     return { hasError: true, error };
 *   }
 *
 *   componentDidCatch(error, info) {
 *     // Log error to an error reporting service
 *     console.error('Error caught by boundary:', error, info);
 *   }
 *
 *   render() {
 *     if (this.state.hasError) {
 *       return (
 *         <div className="error-container">
 *           <h2>Something went wrong</h2>
 *           <p>Please try refreshing the page or contact support if the problem persists.</p>
 *           <button onClick={() => window.location.reload()}>Refresh Page</button>
 *         </div>
 *       );
 *     }
 *     return this.props.children;
 *   }
 * }
 *
 * // Usage in App.tsx:
 * <ErrorBoundary>
 *   <Routes>
 *     <Route path="/" element={<SetupPage />} />
 *     ...
 *   </Routes>
 * </ErrorBoundary>
 * ```
 */

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/bid" element={<BidPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
