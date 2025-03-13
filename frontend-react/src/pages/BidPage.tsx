import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card as BsCard, Button as BsButton, Spinner } from 'react-bootstrap';
import Timer from '../components/auctions/Timer';
import BidderList from '../components/bidders/BidderList';
import BidForm from '../components/bids/BidForm';
import BidHistory from '../components/bids/BidHistory';
import Modal from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import databaseService from '../services/databaseService';
import { Auction, Bidder, Bid } from '../models/types';
import { AUCTION_STATUS, ROUTES } from '../models/constants';

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
  const [timeLeft, setTimeLeft] = useState(0);

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

  // Handle timer expiration
  const handleTimeUp = useCallback(async () => {
    if (!auction) return;

    try {
      // End the auction
      const highestBid = await databaseService.bid.getHighestBid(auction.id);
      const winnerId = highestBid?.bidderId;

      await databaseService.auction.end(auction.id, winnerId);

      showToast('Auction has ended', 'info');
      navigate(`${ROUTES.RESULT}/${auction.id}`);
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast('Failed to end auction', 'error');
    }
  }, [auction, navigate, showToast]);

  // Handle manual end auction
  const handleEndAuction = async () => {
    if (!auction) return;

    setIsEnding(true);

    try {
      // End the auction
      const highestBid = await databaseService.bid.getHighestBid(auction.id);
      const winnerId = highestBid?.bidderId;

      await databaseService.auction.end(auction.id, winnerId);

      showToast('Auction ended successfully', 'success');
      navigate(`${ROUTES.RESULT}/${auction.id}`);
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast('Failed to end auction', 'error');
      setIsEnding(false);
    }
  };

  // Handle bid placed
  const handleBidPlaced = async () => {
    await loadAuctionData();
    showToast('Bid placed successfully', 'success');
  };

  // Handle bidder selection
  const handleSelectBidder = (bidder: Bidder) => {
    setSelectedBidder(bidder);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-2">Loading auction...</span>
      </div>
    );
  }

  if (!auction) {
    return (
      <Container className="py-5 text-center">
        <h2 className="mb-3">Auction Not Found</h2>
        <p className="text-muted mb-4">The auction you're looking for doesn't exist</p>
        <BsButton variant="primary" onClick={() => navigate(ROUTES.HOME)}>
          Go to Home
        </BsButton>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4 align-items-center">
        <Col md={8}>
          <h1 className="mb-1">{auction.title}</h1>
          <p className="text-muted">{auction.description}</p>
        </Col>
        <Col md={4} className="d-flex justify-content-md-end mt-3 mt-md-0">
          <div className="text-center me-3">
            <p className="mb-1 small text-muted">Time Remaining</p>
            <Timer
              initialSeconds={timeLeft}
              onTimeUp={handleTimeUp}
              size="lg"
            />
          </div>
          <BsButton
            variant="danger"
            onClick={() => setShowConfirmEndModal(true)}
          >
            End Auction
          </BsButton>
        </Col>
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
          <BsCard className="shadow-sm mb-4">
            <BsCard.Header className="bg-white">
              <h5 className="mb-0">Current Price</h5>
            </BsCard.Header>
            <BsCard.Body className="text-center py-4">
              <p className="small text-muted mb-1">Current Price</p>
              <h2 className="text-success mb-0">
                {databaseService.formatCurrency(auction.currentPrice)}
              </h2>
              <p className="small text-muted mt-2">
                Starting Price: {databaseService.formatCurrency(auction.startingPrice)}
              </p>
            </BsCard.Body>
          </BsCard>

          <BsCard className="shadow-sm">
            <BsCard.Header className="bg-white">
              <h5 className="mb-0">Bid History</h5>
            </BsCard.Header>
            <BsCard.Body>
              <BidHistory bids={bids} />
            </BsCard.Body>
          </BsCard>
        </Col>

        <Col lg={4}>
          <BsCard className="shadow-sm mb-4">
            <BsCard.Header className="bg-white">
              <h5 className="mb-0">Place Bid</h5>
            </BsCard.Header>
            <BsCard.Body>
              <BidForm
                auction={auction}
                selectedBidder={selectedBidder}
                onBidPlaced={handleBidPlaced}
              />
            </BsCard.Body>
          </BsCard>

          <BsCard className="shadow-sm">
            <BsCard.Header className="bg-white">
              <h5 className="mb-0">Bidders</h5>
            </BsCard.Header>
            <BsCard.Body>
              <BidderList
                bidders={bidders}
                selectedBidderId={selectedBidder?.id}
                highestBidderId={highestBidder?.id}
                onSelectBidder={handleSelectBidder}
              />
            </BsCard.Body>
          </BsCard>
        </Col>
      </Row>

      {/* Confirm End Auction Modal */}
      <Modal
        isOpen={showConfirmEndModal}
        onClose={() => setShowConfirmEndModal(false)}
        title="End Auction"
        footer={
          <>
            <BsButton
              variant="secondary"
              onClick={() => setShowConfirmEndModal(false)}
              disabled={isEnding}
            >
              Cancel
            </BsButton>
            <BsButton
              variant="danger"
              onClick={handleEndAuction}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Auction'}
            </BsButton>
          </>
        }
      >
        <div className="py-3">
          <p className="mb-4">Are you sure you want to end this auction?</p>

          {highestBidder ? (
            <div className="bg-light p-3 rounded">
              <p className="fw-medium mb-2">Current highest bidder:</p>
              <div className="d-flex align-items-center">
                <div style={{ width: '40px', height: '40px' }}>
                  <img
                    className="rounded-circle w-100 h-100"
                    src={highestBidder.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(highestBidder.name)}&background=random&size=40`}
                    alt={highestBidder.name}
                  />
                </div>
                <div className="ms-3">
                  <div className="fw-medium">
                    {highestBidder.name}
                  </div>
                  <div className="small text-muted">
                    Bid: {databaseService.formatCurrency(auction.currentPrice)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-warning">There are no bids yet.</p>
          )}
        </div>
      </Modal>
    </Container>
  );
};

export default BidPage;
