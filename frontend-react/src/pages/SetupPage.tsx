import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import { Bidder, Auction } from '../types';
import './SetupPage.css';
import AuctionDetails from '../components/AuctionDetails';
import PricingAndDuration from '../components/PricingAndDuration';
import BidderManagement from '../components/BidderManagement';

export default function SetupPage() {
  const navigate = useNavigate();
  const { createAuction, createBidder, bidders, refreshData } = useAuction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newBidder, setNewBidder] = useState<Omit<Bidder, 'id'>>({
    name: '',
    nric: '',
    issuingAuthority: '',
    address: '',
  });
  const [bidderId, setBidderId] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [auctionDetails, setAuctionDetails] = useState({
    title: '',
    description: '',
    startingPrice: 1000,
    priceIncrement: 100,
    duration: 300,
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev: { show: boolean; message: string; type: 'success' | 'error' }) => ({ ...prev, show: false })), 3000);
  };

  // Centralized error handling hook
  const useErrorHandling = () => {
    const [error, setError] = useState<string | null>(null);
    const handleError = (message: string) => {
      setError(message);
      showToast(message, 'error');
    };
    return { error, handleError };
  };

  const { handleError } = useErrorHandling();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleImportClick = () => {
    setImporting(true);
    fileInputRef.current?.click();
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBidderId(value);
  };

  const handleAddBidder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bidderData = {
        ...newBidder,
        id: bidderId || undefined, // If empty, let the service auto-assign
      };
      await createBidder(bidderData);
      setNewBidder({
        name: '',
        nric: '',
        issuingAuthority: '',
        address: '',
      });
      setBidderId('');
    } catch (error) {
      console.error('Error adding bidder:', error);
    }
  };

  const handleStartAuction = async () => {
    try {
      // Validate auction configuration
      if (!auctionDetails.title.trim()) {
        handleError('Please provide an auction title');
        return;
      }

      // Validate starting price is a positive number
      if (!auctionDetails.startingPrice || auctionDetails.startingPrice <= 0) {
        handleError('Starting price must be a positive number');
        return;
      }

      // Validate price increment is a positive number
      if (!auctionDetails.priceIncrement || auctionDetails.priceIncrement <= 0) {
        handleError('Minimum bid increment must be a positive number');
        return;
      }

      // Validate duration is a positive number
      if (!auctionDetails.duration || auctionDetails.duration <= 0) {
        handleError('Auction duration must be a positive number');
        return;
      }

      // Validate bidder list
      if (bidders.length < 2) {
        handleError('At least 2 bidders are required to start an auction');
        return;
      }

      const auctionData: Omit<Auction, 'id'> = {
        title: auctionDetails.title.trim(),
        description: auctionDetails.description.trim(),
        status: 'IN_PROGRESS',
        startingPrice: auctionDetails.startingPrice,
        currentPrice: auctionDetails.startingPrice,
        bidStep: auctionDetails.priceIncrement,
        timeLeft: auctionDetails.duration,
        startTime: Date.now(),
        endTime: Date.now() + (auctionDetails.duration * 1000),
        auctionItem: 'Default Item',
        auctioneer: 'Default Auctioneer',
      };

      await createAuction(auctionData);
      showToast('Auction started successfully!', 'success');
      navigate('/bid');
    } catch (error) {
      console.error('Error starting auction:', error);
      handleError('Failed to start the auction. Please try again.');
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    setAuctionDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container py-4">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col">
          <h1 className="mb-3">Thiết Lập Đấu Giá</h1>
          <p className="text-muted">Nhập thông tin chi tiết về phiên đấu giá và thêm người tham gia.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6">
          <AuctionDetails
            title={auctionDetails.title}
            description={auctionDetails.description}
            onTitleChange={(e) => setAuctionDetails(prev => ({ ...prev, title: e.target.value }))}
            onDescriptionChange={(e) => setAuctionDetails(prev => ({ ...prev, description: e.target.value }))}
          />

          <PricingAndDuration
            startingPrice={auctionDetails.startingPrice}
            priceIncrement={auctionDetails.priceIncrement}
            duration={auctionDetails.duration}
            onPriceChange={handlePriceChange}
            onDurationChange={(e) => setAuctionDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 300 }))}
          />
        </div>

        <div className="col-md-6">
          <BidderManagement
            bidders={bidders}
            newBidder={newBidder}
            bidderId={bidderId}
            importing={importing}
            onIdChange={handleIdChange}
            onNewBidderChange={(field, value) => setNewBidder(prev => ({ ...prev, [field]: value }))}
            onAddBidder={handleAddBidder}
            onImportClick={handleImportClick}
            fileInputRef={fileInputRef}
          />
        </div>
      </div>

      <div className="d-grid">
        <button
          className="btn btn-success btn-lg"
          onClick={handleStartAuction}
          disabled={bidders.length === 0}
        >
          Start Auction
        </button>
      </div>
    </div>
  );
}
