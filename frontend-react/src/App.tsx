import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import SetupPage from './pages/SetupPage';
import BidPage from './pages/BidPage';
import ResultPage from './pages/ResultPage';
import NotFoundPage from './pages/NotFoundPage';
import { ROUTES } from './models/constants';
import databaseService from './services/databaseService';

const App: React.FC = () => {
  // Initialize the database with sample data
  useEffect(() => {
    // Check if this is the first time the app is run
    const isFirstRun = !localStorage.getItem('auction_app_initialized');

    if (isFirstRun) {
      // Generate sample data
      databaseService.utility.generateSampleData();

      // Mark as initialized
      localStorage.setItem('auction_app_initialized', 'true');
    }
  }, []);

  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path={ROUTES.SETUP} element={<SetupPage />} />
            <Route path={`${ROUTES.SETUP}/:id`} element={<SetupPage />} />
            <Route path={ROUTES.BID} element={<BidPage />} />
            <Route path={`${ROUTES.BID}/:id`} element={<BidPage />} />
            <Route path={ROUTES.RESULT} element={<ResultPage />} />
            <Route path={`${ROUTES.RESULT}/:id`} element={<ResultPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </Router>
  );
};

export default App;
