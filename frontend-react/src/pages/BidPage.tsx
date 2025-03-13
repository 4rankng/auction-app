import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from 'react-bootstrap';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { Auction, Bidder, Bid } from '../models/types';
import { AUCTION_STATUS, ROUTES } from '../models/constants';
import './BidPage.css';

const BidPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);
  const [highestBidder, setHighestBidder] = useState<Bidder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [showConfirmEndModal, setShowConfirmEndModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // Default 60 seconds
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [bidIncrements, setBidIncrements] = useState(1);

  // Load auction data
  const loadAuctionData = useCallback(async () => {
    if (!id) {
      navigate(ROUTES.HOME);
      return;
    }

    try {
      // Get auction
      const auctionData = await databaseService.auction.getById(id);
      if (!auctionData) {
        showToast('Auction not found', 'error');
        navigate(ROUTES.HOME);
        return;
      }

      // If auction is not in progress, redirect
      if (auctionData.status === AUCTION_STATUS.SETUP) {
        showToast('Auction is not started yet', 'warning');
        navigate(`${ROUTES.SETUP}/${id}`);
        return;
      } else if (auctionData.status === AUCTION_STATUS.ENDED) {
        showToast('Auction has already ended', 'info');
        navigate(`${ROUTES.RESULT}/${id}`);
        return;
      }

      setAuction(auctionData);
      setTimeLeft(auctionData.timeLeft || 0);

      // Get bids
      const auctionBids = await databaseService.bid.getAllForAuction(id);
      setBids(auctionBids);

      // Get bidders
      const allBidders = await databaseService.bidder.getAll();
      setBidders(allBidders);

      // Get highest bidder
      const highestBid = await databaseService.bid.getHighestBid(id);
      if (highestBid) {
        const highestBidderData = await databaseService.bidder.getById(highestBid.bidderId);
        if (highestBidderData) {
          setHighestBidder(highestBidderData);
        }
      }
    } catch (error) {
      console.error('Error loading auction data:', error);
      showToast('Failed to load auction data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  // Initial load
  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  // Set up refresh interval
  useEffect(() => {
    if (auction?.status === AUCTION_STATUS.IN_PROGRESS) {
      const interval = setInterval(() => {
        loadAuctionData();
      }, 5000); // Refresh every 5 seconds

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [auction?.status, loadAuctionData]);

  // Handle manual end auction
  const handleEndAuction = async () => {
    console.log('Starting auction end process...');
    if (!auction) {
      showToast('No auction found to end', 'error');
      return;
    }

    setIsEnding(true);
    setShowConfirmEndModal(false);
    showToast('Ending auction...', 'info');

    try {
      // Get the highest bid
      const highestBid = await databaseService.bid.getHighestBid(auction.id);
      const winnerId = highestBid?.bidderId;
      console.log('Highest bid found:', highestBid?.amount);

      // Update auction state locally to prevent further bids
      setAuction(prev => prev ? {
        ...prev,
        status: AUCTION_STATUS.ENDED,
        timeLeft: 0
      } : null);

      // Store auction ID safely
      const currentAuctionId = auction.id;
      console.log('Ending auction ID:', currentAuctionId);

      // End the auction in the database
      await databaseService.auction.end(currentAuctionId, winnerId);
      console.log('Database updated successfully');

      // Show success message
      showToast('Auction ended successfully', 'success');

      console.log('Preparing to navigate to results...');

      // Force a delay to ensure database is fully updated and UI has time to reflect changes
      await new Promise(resolve => setTimeout(resolve, 800));

      // First try to use the navigate function with replace option
      try {
        console.log(`Navigating to result page: ${ROUTES.RESULT}/${currentAuctionId}`);
        navigate(`${ROUTES.RESULT}/${currentAuctionId}`, { replace: true });

        // Add a fallback in case navigate doesn't trigger immediately
        setTimeout(() => {
          const resultUrl = `${window.location.origin}${ROUTES.RESULT}/${currentAuctionId}`;
          console.log('Fallback navigation to:', resultUrl);
          window.location.href = resultUrl;
        }, 1000);
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        // Fallback to direct URL if navigate fails
        const resultUrl = `${window.location.origin}${ROUTES.RESULT}/${currentAuctionId}`;
        console.log('Fallback navigation to:', resultUrl);
        window.location.href = resultUrl;
      }
    } catch (error) {
      console.error('Error ending auction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to end auction: ${errorMessage}`, 'error');
      setIsEnding(false);

      // Revert auction state if ending failed
      await loadAuctionData();
    }
  };

  // Handle timer expiration
  const handleTimeUp = useCallback(async () => {
    console.log('Timer expired, ending auction...');
    if (!auction) return;

    try {
      // Get the highest bid
      const highestBid = await databaseService.bid.getHighestBid(auction.id);
      const winnerId = highestBid?.bidderId;
      console.log('Highest bid found:', highestBid?.amount);

      // Update auction state locally to prevent further bids
      setAuction(prev => prev ? {
        ...prev,
        status: AUCTION_STATUS.ENDED,
        timeLeft: 0
      } : null);

      // Store auction ID safely
      const currentAuctionId = auction.id;
      console.log('Ending auction ID:', currentAuctionId);

      // End the auction in the database
      await databaseService.auction.end(currentAuctionId, winnerId);
      console.log('Database updated successfully');

      // Show success message
      showToast('Auction has ended', 'info');

      console.log('Preparing to navigate to results...');

      // Force a delay to ensure database is fully updated and UI has time to reflect changes
      await new Promise(resolve => setTimeout(resolve, 800));

      // First try to use the navigate function with replace option
      try {
        console.log(`Navigating to result page: ${ROUTES.RESULT}/${currentAuctionId}`);
        navigate(`${ROUTES.RESULT}/${currentAuctionId}`, { replace: true });

        // Add a fallback in case navigate doesn't trigger immediately
        setTimeout(() => {
          const resultUrl = `${window.location.origin}${ROUTES.RESULT}/${currentAuctionId}`;
          console.log('Fallback navigation to:', resultUrl);
          window.location.href = resultUrl;
        }, 1000);
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        // Fallback to direct URL if navigate fails
        const resultUrl = `${window.location.origin}${ROUTES.RESULT}/${currentAuctionId}`;
        console.log('Fallback navigation to:', resultUrl);
        window.location.href = resultUrl;
      }
    } catch (error) {
      console.error('Error ending auction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showToast(`Failed to end auction: ${errorMessage}`, 'error');

      // Revert auction state if ending failed
      await loadAuctionData();
    }
  }, [auction, navigate, showToast, loadAuctionData]);

  // Calculate time status for badge
  const getTimeStatus = (): 'active' | 'ending-soon' | 'ended' => {
    if (!auction) return 'ended';
    if (timeLeft <= 15) return 'ending-soon';
    return 'active';
  };

  // Calculate next bid amount based on increments
  const calculateNextBidAmount = useCallback(() => {
    if (!auction) return 0;
    return auction.currentPrice + (auction.bidStep * bidIncrements);
  }, [auction, bidIncrements]);

  // Handle bid increments change
  const handleIncrementChange = (increment: number) => {
    setBidIncrements(increment);
    setBidAmount(auction ? auction.currentPrice + (auction.bidStep * increment) : '');
  };

  // Handle bid submission
  const handleSubmitBid = async () => {
    if (!selectedBidder || !auction) return;

    const amount = typeof bidAmount === 'number' ? bidAmount : calculateNextBidAmount();

    try {
      if (!selectedBidder.id) {
        throw new Error('Selected bidder has no ID');
      }

      await databaseService.bid.create({
        auctionId: auction.id,
        bidderId: selectedBidder.id,
        amount
      });

      // Refresh auction data
      await loadAuctionData();
      showToast('Bid placed successfully!', 'success');

      // Reset form
      setBidAmount('');
      setBidIncrements(1);
    } catch (error) {
      console.error('Error placing bid:', error);
      showToast('Failed to place bid', 'error');
    }
  };

  // Handle bidder selection
  const handleSelectBidder = (bidder: Bidder) => {
    setSelectedBidder(bidder);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-3">Loading auction...</span>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <h2 className="mb-3">Auction Not Found</h2>
          <p className="text-muted mb-4">The auction you're looking for doesn't exist</p>
          <Button variant="primary" onClick={() => navigate(ROUTES.HOME)}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-page">
      <Container>
        {/* Main card with all content */}
        <div className="ds-card mb-4">
          {/* Header - Title, Status, End Button */}
          <div className="ds-card__header position-relative">
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-center">
                <h1 className="ds-card__title me-3 mb-0">{auction.title}</h1>
                <div className={`ds-status-pill-inline ${getTimeStatus()}`}>
                  <i className={`bi ${getTimeStatus() === 'active' ? 'bi-broadcast' : 'bi-hourglass-split'}`}></i>
                  {getTimeStatus() === 'active' ? 'Active' : 'Ending Soon'}
                </div>
              </div>
              <Button
                variant="outline-danger"
                className="end-auction-btn"
                onClick={() => {
                  console.log('End auction button clicked');
                  setShowConfirmEndModal(true);
                }}
                disabled={isEnding}
              >
                {isEnding ? 'Ending...' : 'End Auction'}
              </Button>
            </div>

            {/* Auctioneer Info */}
            <p className="ds-card__subtitle mt-2">
              <i className="bi bi-person me-2"></i>
              Auctioneer: {auction.auctioneer}
            </p>
          </div>

          {/* Timer Display */}
          <div className="auction-timer text-center my-3">
            <div className="timer-display" onClick={handleTimeUp}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Price Information */}
          <div className="price-info-container py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="price-item">
                <div className="price-value">{databaseService.formatCurrency(auction.currentPrice)}</div>
                <div className="price-label">Current Price</div>
              </div>
              <div className="price-item">
                <div className="price-value">{databaseService.formatCurrency(auction.startingPrice)}</div>
                <div className="price-label">Starting Price</div>
              </div>
              <div className="price-item">
                <div className="price-value">{databaseService.formatCurrency(auction.bidStep)}</div>
                <div className="price-label">Bid Step</div>
              </div>
            </div>
          </div>

          {/* Bidder Selection */}
          <div className="bidder-selection-section py-3">
            <h3 className="section-title">Select Bidder</h3>
            <div className="bidder-grid">
              {bidders.map(bidder => (
                <div
                  key={bidder.id}
                  className={`bidder-square ${selectedBidder?.id === bidder.id ? 'selected' : ''} ${highestBidder?.id === bidder.id ? 'highest' : ''}`}
                  onClick={() => handleSelectBidder(bidder)}
                  title={bidder.name}
                >
                  {bidder.id}
                </div>
              ))}
            </div>
          </div>

          {/* Bid Amount Selection */}
          <div className="bid-amount-section py-3">
            <h3 className="section-title">Select Bid Amount</h3>
            {/* Bid increment buttons */}
            <div className="bid-increments-container d-flex gap-2 mb-3">
              {[1, 2, 5, 10].map(increment => (
                <button
                  key={increment}
                  className={`btn ${bidIncrements === increment ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleIncrementChange(increment)}
                >
                  {increment}x
                </button>
              ))}
            </div>

            <div className="input-group mb-3">
              <input
                type="number"
                className="form-control"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                placeholder={`Minimum bid: ${databaseService.formatCurrency(calculateNextBidAmount())}`}
                min={calculateNextBidAmount()}
                step={auction.bidStep}
              />
              <button
                className="btn btn-success"
                onClick={handleSubmitBid}
                disabled={!selectedBidder || isEnding}
              >
                Place Bid
              </button>
            </div>
          </div>

          {/* Bid History */}
          <div className="bid-history-section py-3">
            <h3 className="section-title">Bid History</h3>
            <div className="bid-history-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>ID</th>
                    <th>Bidder</th>
                    <th>ID Number</th>
                    <th>Contact</th>
                    <th className="text-end">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid) => {
                    const bidderDetails = bidders.find(b => b.id === bid.bidderId);
                    return (
                      <tr key={bid.id}>
                        <td>{new Date(bid.timestamp).toLocaleTimeString()}</td>
                        <td>{bid.bidderId}</td>
                        <td>{bid.bidderName}</td>
                        <td>{bidderDetails?.idNumber || '-'}</td>
                        <td>
                          {bidderDetails?.phone ? (
                            <span><i className="bi bi-telephone-fill me-1"></i>{bidderDetails.phone}</span>
                          ) : bidderDetails?.email ? (
                            <span><i className="bi bi-envelope-fill me-1"></i>{bidderDetails.email}</span>
                          ) : '-'}
                        </td>
                        <td className="text-end fw-bold text-primary">{databaseService.formatCurrency(bid.amount)}</td>
                      </tr>
                    );
                  })}
                  {bids.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No bids placed yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Container>

      {/* Confirm End Modal */}
      <Modal
        show={showConfirmEndModal}
        onHide={() => setShowConfirmEndModal(false)}
        title="End Auction"
        body="Are you sure you want to end this auction? This action cannot be undone."
        confirmText="End Auction"
        confirmVariant="danger"
        onConfirm={handleEndAuction}
      />
    </div>
  );
};

export default BidPage;
