import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SetupPage from './pages/SetupPage';
import { BidPage } from './pages/BidPage';
import { ResultPage } from './pages/ResultPage';

import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/bid" element={<BidPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/" element={<Navigate to="/setup" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
