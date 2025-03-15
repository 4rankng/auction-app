import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import SetupPage from './pages/SetupPage';
import { BidPage } from './pages/BidPage';
import AuctioneerManagement from './pages/AuctioneerManagement';
import ErrorBoundary from './components/ErrorBoundary';

// Import ManageAuctioneer if it exists, otherwise comment it out
// import ManageAuctioneer from './pages/ManageAuctioneer';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/bid" element={<BidPage />} />
            <Route path="/auctioneers" element={<AuctioneerManagement />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
