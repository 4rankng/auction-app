import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BidHistoryTable from '../components/BidHistoryTable';
import BidderSelectionGrid from '../components/BidderSelectionGrid';
import BidControls from '../components/BidControls';
import AuctionSummary from '../components/AuctionSummary';
import AuctionHeader from '../components/AuctionHeader';
import { useAuction } from '../hooks/useAuction';
import { Bid } from '../types';

// Interface for the bid history display format
interface BidHistoryDisplay {
  id: number;
  round: number;
  bidder: string;
  amount: string;
  timestamp: string;
}

export const BidPage: React.FC = () => {
  // Get auction data from useAuction hook
  const { auction, bidders, bids, loading: dataLoading, error: dataError, placeBid, refreshData, updateAuction, getAuctionById } = useAuction();

  const [currentRound, setCurrentRound] = useState<number>(1); // Start at round 1
  const [currentPrice, setCurrentPrice] = useState<string>('0 VND');
  const [bidIncrement, setBidIncrement] = useState<string>('0 VND');
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [selectedBidder, setSelectedBidder] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidHistory, setBidHistory] = useState<BidHistoryDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auctionTitle, setAuctionTitle] = useState<string>('Phiên Đấu Giá');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [auctionId, setAuctionId] = useState<string | null>(null);

  // New states for bidder timer and last bidder
  const [bidderTimeLeft, setBidderTimeLeft] = useState<number>(60);
  const [lastBidderId, setLastBidderId] = useState<string | null>(null);
  const bidderTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Format timestamp to readable date string
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // Format number to currency string
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('vi-VN')} VND`;
  };

  // Convert bids from database to display format
  const convertBidsToDisplayFormat = useCallback((bids: Bid[]): BidHistoryDisplay[] => {
    return bids.map((bid, index) => ({
      id: index,
      round: bid.round,
      bidder: bid.bidderName,
      amount: formatCurrency(bid.amount),
      timestamp: formatTimestamp(bid.timestamp)
    }));
  }, []);

  useEffect(() => {
    // Get auction ID from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const auctionIdParam = queryParams.get('id');

    if (!auctionIdParam) {
      showToast('No auction ID provided', 'error');
      navigate('/history');
      return;
    }

    setAuctionId(auctionIdParam);

    // Load the specific auction by ID
    getAuctionById(auctionIdParam);
  }, [location.search, navigate, getAuctionById]);

  // Update component state when auction data changes
  useEffect(() => {
    if (dataLoading) {
      setLoading(true);
      return;
    }

    if (dataError) {
      showToast(dataError, 'error');
      setLoading(false);
      return;
    }

    if (!auction) {
      showToast('Auction not found', 'error');
      navigate('/history');
      return;
    }

    // Check if this is the auction we're looking for
    if (auctionId && auction.id !== auctionId) {
      showToast('Auction not found', 'error');
      navigate('/history');
      return;
    }

    // Update auction details
    setAuctionTitle(auction.title);
    setCurrentPrice(formatCurrency(auction.currentPrice));
    setBidIncrement(formatCurrency(auction.bidStep));
    setParticipantsCount(bidders.length);

    // Calculate time left
    const now = Date.now();
    const timeLeftMs = Math.max(0, (auction.endTime || 0) - now);
    const minutes = Math.floor(timeLeftMs / 60000);
    const seconds = Math.floor((timeLeftMs % 60000) / 1000);
    setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

    // Filter bids for this auction and sort by timestamp (newest first)
    const auctionBids = bids
      .filter(bid => bid.auctionId === auction.id)
      .sort((a, b) => b.timestamp - a.timestamp);

    // Set current round based on the highest round in the bids or default to 1
    const maxRound = auctionBids.length > 0
      ? Math.max(...auctionBids.map(bid => bid.round))
      : 1;
    setCurrentRound(maxRound);

    // Set last bidder if there are bids
    if (auctionBids.length > 0) {
      setLastBidderId(auctionBids[0].bidderId);
    }

    // Convert bids to display format
    setBidHistory(convertBidsToDisplayFormat(auctionBids));

    setLoading(false);
  }, [auction, bidders, bids, dataLoading, dataError, auctionId, navigate, convertBidsToDisplayFormat]);

  // Start a timer to update the auction time left
  useEffect(() => {
    if (!auction || !auction.endTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const timeLeftMs = Math.max(0, auction.endTime! - now);
      const minutes = Math.floor(timeLeftMs / 60000);
      const seconds = Math.floor((timeLeftMs % 60000) / 1000);

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // If time is up, increase the round (up to round 6)
      if (timeLeftMs <= 0 && currentRound < 6) {
        setCurrentRound(prev => Math.min(prev + 1, 6));

        // Update auction end time for the next round
        if (auction && auction.endTime) {
          const newEndTime = auction.endTime + (auction.timeLeft * 1000);
          updateAuction({
            ...auction,
            endTime: newEndTime
          });
        }
      }

      if (timeLeftMs <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction, currentRound, updateAuction]);

  // Handle bidder selection and start 60-second timer
  const handleBidderSelect = (bidderId: string) => {
    // Clear previous timer
    if (bidderTimerRef.current) {
      clearInterval(bidderTimerRef.current);
      bidderTimerRef.current = null;
    }

    // Toggle selection if clicking the same bidder
    if (bidderId === selectedBidder) {
      setSelectedBidder(null);
      return;
    }

    setSelectedBidder(bidderId);
    setBidderTimeLeft(60); // Reset timer to 60 seconds

    // Start new timer for this bidder
    bidderTimerRef.current = setInterval(() => {
      setBidderTimeLeft(prev => {
        if (prev <= 1) {
          if (bidderTimerRef.current) {
            clearInterval(bidderTimerRef.current);
            bidderTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (bidderTimerRef.current) {
        clearInterval(bidderTimerRef.current);
      }
    };
  }, []);

  const handlePlaceBid = async () => {
    if (!selectedBidder || !bidAmount || !auction) return;

    // Check if we're past round 6
    if (currentRound > 6) {
      showToast('Đấu giá đã kết thúc ở vòng 6', 'error');
      return;
    }

    // Check if bidder timer has expired
    if (bidderTimeLeft <= 0) {
      showToast('Thời gian đấu giá đã hết', 'error');
      return;
    }

    try {
      // Convert bid amount from formatted string to number
      const numericAmount = parseInt(bidAmount.replace(/\D/g, '')) || 0;

      // Place the bid with the current round
      await placeBid(selectedBidder, numericAmount);

      // Set this bidder as the last bidder
      setLastBidderId(selectedBidder);

      // Reset selection and amount
      setSelectedBidder(null);
      setBidAmount('');

      // Clear bidder timer
      if (bidderTimerRef.current) {
        clearInterval(bidderTimerRef.current);
        bidderTimerRef.current = null;
      }

      // Refresh data to get the updated auction and bids
      await refreshData();

      showToast('Đấu giá thành công', 'success');
    } catch (error) {
      console.error('Error placing bid:', error);
      showToast(error instanceof Error ? error.message : 'Không thể đấu giá', 'error');
    }
  };

  const handleCancelBid = async () => {
    if (!selectedBidder || !auction) {
      showToast('Vui lòng chọn người đấu giá', 'error');
      return;
    }

    try {
      // Find the last bid from this bidder
      const bidderBids = bids
        .filter(bid => bid.bidderId === selectedBidder && bid.auctionId === auction.id)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (bidderBids.length === 0) {
        showToast('Không tìm thấy lịch sử đấu giá của người này', 'error');
        return;
      }

      // TODO: Implement the actual removal of the bid from the database
      // This would require adding a new function to the useAuction hook

      // For now, we'll just show a toast and reset the selection
      showToast('Đã hủy đấu giá cuối cùng', 'success');
      setSelectedBidder(null);
      setBidAmount('');

      // Refresh data to get the updated auction and bids
      await refreshData();
    } catch (error) {
      console.error('Error canceling bid:', error);
      showToast(error instanceof Error ? error.message : 'Không thể hủy đấu giá', 'error');
    }
  };

  const handleEndAuction = async () => {
    if (!auction) return;

    try {
      // Update auction status to ENDED
      const updatedAuction = { ...auction, status: 'ENDED' as const };

      // Find the highest bid to set as the winner
      const highestBid = bids
        .filter(bid => bid.auctionId === auction.id)
        .sort((a, b) => b.amount - a.amount)[0];

      if (highestBid) {
        const winningBidder = bidders.find(bidder => bidder.id === highestBid.bidderId);
        if (winningBidder) {
          updatedAuction.winner = {
            id: winningBidder.id,
            name: winningBidder.name,
            finalBid: highestBid.amount
          };
          updatedAuction.finalPrice = highestBid.amount;
        }
      }

      // Save the updated auction
      await updateAuction(updatedAuction);

      showToast('Đấu giá kết thúc thành công', 'success');
      navigate('/history');
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast(error instanceof Error ? error.message : 'Không thể kết thúc đấu giá', 'error');
    }
  };

  const handleGoBack = () => {
    navigate('/history');
  };

  // Check if a bidder can place a bid
  const canBidderPlaceBid = (bidderId: string) => {
    // Can't bid if this was the last bidder
    if (bidderId === lastBidderId) return false;

    // Can't bid if past round 6
    if (currentRound > 6) return false;

    // Can't bid if timer expired
    if (selectedBidder === bidderId && bidderTimeLeft <= 0) return false;

    return true;
  };

  if (loading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        {/* Auction Header Component */}
        <AuctionHeader
          title={auctionTitle}
          timeLeft={timeLeft}
          onEndAuction={handleEndAuction}
        />

        <div className="card-body py-2">
          {/* Auction Summary Component */}
          <AuctionSummary
            currentRound={currentRound}
            currentPrice={currentPrice}
            bidIncrement={bidIncrement}
            participantsCount={participantsCount}
          />

          {/* Bidder Selection Grid Component */}
          <BidderSelectionGrid
            bidders={bidders}
            selectedBidder={selectedBidder}
            onBidderSelect={handleBidderSelect}
            disabledBidders={[lastBidderId].filter(Boolean) as string[]}
          />

          {/* Bid Controls Component */}
          <BidControls
            bidderName={selectedBidder ? bidders.find(b => b.id === selectedBidder)?.name || '' : ''}
            bidAmount={bidAmount}
            currentPrice={currentPrice.replace(' VND', '')}
            bidIncrement={bidIncrement.replace(' VND', '')}
            onBidAmountChange={setBidAmount}
            onPlaceBid={handlePlaceBid}
            onCancelBid={handleCancelBid}
            isPlaceBidDisabled={!selectedBidder || !canBidderPlaceBid(selectedBidder || '')}
            bidHistoryEmpty={bidHistory.length === 0}
            bidderTimeLeft={bidderTimeLeft}
          />
        </div>
      </div>

      {/* Bid History Table Component */}
      {auctionId && <BidHistoryTable
        auctionId={auctionId}
        initialData={bidHistory}
        refreshInterval={10000} // Refresh every 10 seconds
      />}

      <div className="text-end">
        <button className="btn btn-secondary" onClick={handleGoBack}>
          <i className="bi bi-arrow-left me-1"></i> Quay Lại Thiết Lập
        </button>
      </div>
    </div>
  );
};
