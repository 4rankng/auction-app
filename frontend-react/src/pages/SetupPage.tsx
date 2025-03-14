import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import { Bidder, Auction } from '../types';
import './SetupPage.css';
import AuctionDetails from '../components/AuctionDetails';
import PricingAndDuration from '../components/PricingAndDuration';
import BidderManagement from '../components/BidderManagement';
import { parseBiddersFromExcel } from '../utils/excelParser';
import { Modal, Button, ListGroup } from 'react-bootstrap';

export default function SetupPage() {
  const navigate = useNavigate();
  const { createAuction, createBidder, bidders, refreshData, clearBidders } = useAuction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newBidder, setNewBidder] = useState<Omit<Bidder, 'id'>>({
    name: '',
    nric: '',
    issuingAuthority: '',
    address: '',
  });
  const [bidderId, setBidderId] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);
  const [isStartingAuction, setIsStartingAuction] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImporting(false);
      return;
    }

    try {
      // Parse the Excel file
      const bidderData = await parseBiddersFromExcel(file);

      // Clear existing bidders
      await clearBidders();

      // Add each bidder from the Excel file
      for (const bidder of bidderData) {
        await createBidder(bidder);
      }

      showToast(`Successfully imported ${bidderData.length} bidders`, 'success');
    } catch (error) {
      console.error('Error importing bidders:', error);
      handleError(error instanceof Error ? error.message : 'Failed to import bidders');
    } finally {
      setImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      handleError(error instanceof Error ? error.message : 'Failed to add bidder');
    }
  };

  const validateAuctionSetup = (): { isValid: boolean; errorMessage?: string } => {
    // Validate auction title
    if (!auctionDetails.title.trim()) {
      return { isValid: false, errorMessage: 'Please provide an auction title' };
    }

    // Validate starting price
    if (!auctionDetails.startingPrice || auctionDetails.startingPrice <= 0) {
      return { isValid: false, errorMessage: 'Starting price must be a positive number' };
    }

    // Validate price increment
    if (!auctionDetails.priceIncrement || auctionDetails.priceIncrement <= 0) {
      return { isValid: false, errorMessage: 'Minimum bid increment must be a positive number' };
    }

    // Validate duration
    if (!auctionDetails.duration || auctionDetails.duration <= 0) {
      return { isValid: false, errorMessage: 'Auction duration must be a positive number' };
    }

    // Validate bidder list
    if (bidders.length < 2) {
      return { isValid: false, errorMessage: 'At least 2 bidders are required to start an auction' };
    }

    return { isValid: true };
  };

  const handleConfirmAuction = () => {
    const validation = validateAuctionSetup();

    if (!validation.isValid) {
      handleError(validation.errorMessage || 'Invalid auction setup');
      return;
    }

    setShowConfirmation(true);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false);
  };

  const handleStartAuction = async () => {
    try {
      setIsStartingAuction(true);

      const validation = validateAuctionSetup();
      if (!validation.isValid) {
        handleError(validation.errorMessage || 'Invalid auction setup');
        setIsStartingAuction(false);
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

      const newAuction = await createAuction(auctionData);
      showToast('Auction started successfully!', 'success');
      setShowConfirmation(false);

      // Navigate to the bidding page with the auction ID
      navigate(`/bid?id=${newAuction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      handleError('Failed to start the auction. Please try again.');
      setShowConfirmation(false);
    } finally {
      setIsStartingAuction(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    setAuctionDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="setup-page-container">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="container py-4 mb-5">
        {/* Top section: Auction Details (left) and Pricing & Duration (right) */}
        <div className="row g-4 mb-4 setup-page-row">
          <div className="col-md-6">
            <AuctionDetails
              title={auctionDetails.title}
              description={auctionDetails.description}
              onTitleChange={(e) => setAuctionDetails(prev => ({ ...prev, title: e.target.value }))}
              onDescriptionChange={(e) => setAuctionDetails(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <PricingAndDuration
              startingPrice={auctionDetails.startingPrice}
              priceIncrement={auctionDetails.priceIncrement}
              duration={auctionDetails.duration}
              onPriceChange={handlePriceChange}
              onDurationChange={(e) => setAuctionDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 300 }))}
            />
          </div>
        </div>

        {/* Middle section: Bidder Management (full width) */}
        <div className="row mb-5">
          <div className="col-12">
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
              onFileChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom section: Start Auction button (full width) */}
      <div className="start-auction-container">
        <div className="container">
          <button
            className="btn btn-success btn-lg w-100"
            onClick={handleConfirmAuction}
            disabled={bidders.length === 0 || isStartingAuction}
          >
            {isStartingAuction ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Starting Auction...
              </>
            ) : (
              'Start Auction'
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal using React Bootstrap */}
      <Modal show={showConfirmation} onHide={handleCloseModal} centered backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Auction Start</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to start the auction with the following details?</p>
          <ListGroup className="mb-3">
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Title:</span>
              <strong>{auctionDetails.title}</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Starting Price:</span>
              <strong>{auctionDetails.startingPrice.toLocaleString('vi-VN')} VND</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Bid Increment:</span>
              <strong>{auctionDetails.priceIncrement.toLocaleString('vi-VN')} VND</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Duration:</span>
              <strong>{auctionDetails.duration} seconds</strong>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex justify-content-between">
              <span>Number of Bidders:</span>
              <strong>{bidders.length}</strong>
            </ListGroup.Item>
          </ListGroup>
          <p className="text-muted small">Once started, the auction cannot be modified.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={isStartingAuction}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleStartAuction}
            disabled={isStartingAuction}
          >
            {isStartingAuction ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Starting...
              </>
            ) : (
              'Start Auction'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
