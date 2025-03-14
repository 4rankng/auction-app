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
  rawTimestamp?: number; // Add raw timestamp for sorting
  rawAmount?: number; // Add raw amount for secondary sorting
}

export const BidPage: React.FC = () => {
  // Get auction data from useAuction hook
  const { auction, bidders, bids, loading: dataLoading, error: dataError, placeBid, updateAuction, getAuctionById, removeBid } = useAuction();

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
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0); // Add refresh trigger state

  // Add a ref to track if we've already loaded the auction
  const auctionLoadedRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Format timestamp to readable date string
  const formatTimestamp = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN');
  }, []);

  // Format number to currency string
  const formatCurrency = useCallback((amount: number): string => {
    return `${amount.toLocaleString('vi-VN')} VND`;
  }, []);

  // Convert bids from database to display format
  const convertBidsToDisplayFormat = useCallback((bids: Bid[]): BidHistoryDisplay[] => {
    // Map bids to display format
    const formattedBids = bids.map((bid, index) => ({
      id: index,
      round: bid.round,
      bidder: bid.bidderName,
      amount: formatCurrency(bid.amount),
      timestamp: formatTimestamp(bid.timestamp),
      rawTimestamp: bid.timestamp,
      rawAmount: bid.amount
    }));

    // Sort bids by timestamp (newest first) and then by amount (highest first)
    return formattedBids.sort((a, b) => {
      // Primary sort by timestamp
      if (a.rawTimestamp !== b.rawTimestamp) {
        return b.rawTimestamp - a.rawTimestamp;
      }

      // Secondary sort by amount
      return b.rawAmount - a.rawAmount;
    });
  }, [formatCurrency, formatTimestamp]);

  // Define handleEndAuction function with useCallback
  const handleEndAuction = useCallback(async () => {
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

          console.log(`Auction ended. Winner: ${winningBidder.name} with final bid: ${highestBid.amount.toLocaleString('vi-VN')} VND`);
        }
      } else {
        console.log('Auction ended with no bids.');
      }

      // Save the updated auction
      await updateAuction(updatedAuction);

      showToast('Đấu giá kết thúc thành công', 'success');


    } catch (error) {
      console.error('Error ending auction:', error);
      showToast(error instanceof Error ? error.message : 'Không thể kết thúc đấu giá', 'error');
    }
  }, [auction, bids, bidders, updateAuction]);

  useEffect(() => {
    // Get auction ID from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const auctionIdParam = queryParams.get('id');

    if (!auctionIdParam) {
      showToast('Không tìm thấy ID phiên đấu giá', 'error');
      return;
    }

    // Only set the auction ID if it's different or not set yet
    if (auctionId !== auctionIdParam) {
      setAuctionId(auctionIdParam);
      auctionLoadedRef.current = false; // Reset the flag when auction ID changes
    }

    // Only load the auction if we haven't loaded it yet
    if (!auctionLoadedRef.current) {
      console.log(`Loading auction with ID: ${auctionIdParam}`);
      getAuctionById(auctionIdParam);
      auctionLoadedRef.current = true;
    }
  }, [location.search, getAuctionById, auctionId]);

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
      showToast('Không tìm thấy phiên đấu giá', 'error');
      // Don't navigate away, just show the error
      setLoading(false);
      return;
    }

    // Check if this is the auction we're looking for
    if (auctionId && auction.id !== auctionId) {
      showToast(`Phiên đấu giá với ID ${auctionId} không tồn tại`, 'error');
      // Don't navigate away, just show the error
      setLoading(false);
      return;
    }

    // Update auction details
    setAuctionTitle(auction.title);
    setCurrentPrice(formatCurrency(auction.currentPrice));
    setBidIncrement(formatCurrency(auction.bidStep));

    // Log the bidders loaded from the database
    console.log(`Loaded ${bidders.length} bidders from database:`, bidders);
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

    // Convert bids to display format and ensure they are sorted by timestamp (newest first)
    const sortedBidHistory = convertBidsToDisplayFormat(auctionBids);
    console.log('Sorted bid history on initial load:', sortedBidHistory);
    setBidHistory(sortedBidHistory);

    setLoading(false);
  }, [auction, bidders, bids, dataLoading, dataError, auctionId, navigate, convertBidsToDisplayFormat, formatCurrency]);

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
        console.log(`Round ${currentRound} ended. Starting round ${currentRound + 1}`);

        // Increase the round
        const newRound = currentRound + 1;
        setCurrentRound(newRound);

        // Update auction end time for the next round - reset to original duration
        if (auction) {
          const newEndTime = Date.now() + (auction.timeLeft * 1000);
          const updatedAuction = {
            ...auction,
            endTime: newEndTime,
            currentRound: newRound // Add the current round to the auction object
          };

          console.log(`Resetting auction duration to ${auction.timeLeft} seconds for round ${newRound}`);
          updateAuction(updatedAuction)
            .then(() => {
              console.log(`Auction updated for round ${newRound}, new end time: ${new Date(newEndTime).toLocaleString()}`);
              // Reset the auction loaded flag to force a refresh
              auctionLoadedRef.current = false;
              // Reload the auction data
              if (auctionId) {
                getAuctionById(auctionId);
              }

              // Show a toast notification about the new round
              showToast(`Vòng ${newRound} bắt đầu!`, 'success');
            })
            .catch(error => {
              console.error('Error updating auction for next round:', error);
              showToast('Lỗi khi cập nhật vòng đấu giá', 'error');
            });
        }
      }

      // If we've reached round 6 and time is up, end the auction
      if (timeLeftMs <= 0 && currentRound >= 6) {
        console.log('Final round (6) has ended. Auction should be completed.');
        clearInterval(timer);

        // Automatically end the auction
        handleEndAuction();
        showToast('Đấu giá đã kết thúc sau 6 vòng!', 'success');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction, currentRound, updateAuction, auctionId, getAuctionById, handleEndAuction]);

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

    // If this is the last bidder, set timer to 0
    if (bidderId === lastBidderId) {
      setBidderTimeLeft(0);
      return;
    }

    // Otherwise, reset timer to 60 seconds
    setBidderTimeLeft(60);

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
    console.log('handlePlaceBid called with bidAmount:', bidAmount);

    // Ensure we have a selected bidder and auction
    if (!selectedBidder || !auction) {
      showToast('Vui lòng chọn người đấu giá', 'error');
      return;
    }

    // Calculate default bid amount if not provided
    let effectiveBidAmount = bidAmount;
    if (!effectiveBidAmount) {
      // If bid amount is empty, calculate it from current price + bid increment
      const currentPriceValue = parseInt(currentPrice.replace(/\D/g, '')) || 0;
      const bidIncrementValue = parseInt(bidIncrement.replace(/\D/g, '')) || 0;
      effectiveBidAmount = (currentPriceValue + bidIncrementValue).toString();
      console.log('Using calculated bid amount:', effectiveBidAmount);
    }

    // Check if we still don't have a bid amount
    if (!effectiveBidAmount) {
      showToast('Vui lòng nhập số tiền đấu giá', 'error');
      return;
    }

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
      const numericAmount = parseInt(effectiveBidAmount.replace(/\D/g, '')) || 0;
      const currentPriceValue = parseInt(currentPrice.replace(/\D/g, '')) || 0;
      const bidIncrementValue = parseInt(bidIncrement.replace(/\D/g, '')) || 0;

      // Validate bid amount based on bid history
      const bidHistoryEmpty = bidHistory.length === 0;

      // Debug logs to help diagnose the issue
      console.log('Bid validation:', {
        numericAmount,
        currentPriceValue,
        bidIncrementValue,
        bidHistoryEmpty,
        currentRound,
        effectiveBidAmount
      });

      // Check if the bid meets the minimum increment requirement
      if (numericAmount < currentPriceValue + bidIncrementValue) {
        showToast(`Giá trả phải cao hơn giá hiện tại ít nhất ${bidIncrement}`, 'error');
        return;
      }

      // Place the bid with the current round
      console.log(`Placing bid: ${numericAmount} VND by bidder ${selectedBidder} in round ${currentRound}`);
      const newBid = await placeBid(selectedBidder, numericAmount);
      console.log('New bid placed successfully:', newBid);

      // Set this bidder as the last bidder
      setLastBidderId(selectedBidder);

      // Immediately update the current price in the UI
      setCurrentPrice(formatCurrency(numericAmount));

      // Reset selection and amount
      setSelectedBidder(null);
      setBidAmount('');

      // Clear bidder timer
      if (bidderTimerRef.current) {
        clearInterval(bidderTimerRef.current);
        bidderTimerRef.current = null;
      }

      // Reset the auction loaded flag to force a refresh
      auctionLoadedRef.current = false;

      // Increment refresh trigger to force BidHistoryTable to refresh
      setRefreshTrigger(prev => prev + 1);

      // Refresh data to get the updated auction and bids
      if (auctionId) {
        await getAuctionById(auctionId);

        // Immediately fetch the latest bid history from the database
        // This ensures the bid history is updated with the new bid
        await fetchLatestBidHistory(auctionId);
      }

      showToast('Đấu giá thành công', 'success');
    } catch (error) {
      console.error('Error placing bid:', error);
      showToast(error instanceof Error ? error.message : 'Không thể đấu giá', 'error');
    }
  };

  // Function to fetch the latest bid history from the database
  const fetchLatestBidHistory = useCallback(async (auctionId: string) => {
    try {
      console.log(`Fetching latest bid history for auction ${auctionId}`);

      // Get the database from localStorage
      const storedDatabase = localStorage.getItem('auction_app_db');
      if (!storedDatabase) {
        console.log('No database found in localStorage');
        setBidHistory([]);
        return;
      }

      const database = JSON.parse(storedDatabase);

      // Get all bids for this auction
      const allBids = Object.values(database.bids || {}).filter((bid: any) => bid.auctionId === auctionId);
      console.log(`Found ${allBids.length} bids for auction ${auctionId}`);

      // Format the bids for display
      const formattedBids = allBids.map((bid: any, index: number) => ({
        id: bid.id || index,
        round: bid.round,
        bidder: bid.bidderName,
        amount: formatCurrency(bid.amount),
        timestamp: formatTimestamp(bid.timestamp),
        rawTimestamp: bid.timestamp,
        rawAmount: bid.amount
      }));

      // Sort bids by timestamp (newest first) and then by amount (highest first)
      const sortedBids = formattedBids.sort((a, b) => {
        // Primary sort by timestamp (newest first)
        if (a.rawTimestamp !== b.rawTimestamp) {
          return b.rawTimestamp - a.rawTimestamp;
        }

        // Secondary sort by amount (highest first) if timestamps are identical
        return b.rawAmount - a.rawAmount;
      });

      console.log('Updated bid history from database:', sortedBids);
      setBidHistory(sortedBids);
    } catch (error) {
      console.error('Error fetching latest bid history:', error);
    }
  }, [formatCurrency, formatTimestamp]);

  const handleCancelBid = async () => {
    console.log('handleCancelBid called');

    if (!auction) {
      showToast('Không tìm thấy phiên đấu giá', 'error');
      return;
    }

    // If no bidder is selected, use the last bidder
    const bidderToCancel = selectedBidder || lastBidderId;
    console.log('Bidder to cancel:', bidderToCancel, 'Selected bidder:', selectedBidder, 'Last bidder:', lastBidderId);

    if (!bidderToCancel) {
      showToast('Không có người đấu giá để hủy', 'error');
      return;
    }

    // Check if the selected bidder is the last bidder
    if (selectedBidder && selectedBidder !== lastBidderId) {
      // If a bidder is selected but they're not the last bidder, show an error
      showToast('Chỉ có thể hủy đấu giá cuối cùng', 'error');
      return;
    }

    try {
      // Find the last bid from this bidder
      const bidderBids = bids
        .filter(bid => bid.bidderId === bidderToCancel && bid.auctionId === auction.id)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log('Bidder bids found:', bidderBids.length);

      if (bidderBids.length === 0) {
        showToast('Không tìm thấy lịch sử đấu giá của người này', 'error');
        return;
      }

      // Get the last bid from this bidder
      const lastBid = bidderBids[0];
      console.log('Last bid to cancel:', lastBid);

      // Use the removeBid function to remove the bid
      await removeBid(lastBid.id);
      console.log('Bid removed successfully');

      // Find all bids for this auction except the one we're canceling
      const otherBids = bids
        .filter(bid => bid.id !== lastBid.id && bid.auctionId === auction.id)
        .sort((a, b) => b.amount - a.amount);

      console.log('Other bids after cancellation:', otherBids.length);

      // If there are other bids, set the new last bidder
      if (otherBids.length > 0) {
        setLastBidderId(otherBids[0].bidderId);
        console.log('New last bidder set to:', otherBids[0].bidderId);
      } else {
        setLastBidderId(null);
        console.log('No last bidder (all bids canceled)');
      }

      showToast('Đã hủy đấu giá cuối cùng', 'success');
      setSelectedBidder(null);
      setBidAmount('');

      // Reset the auction loaded flag to force a refresh
      auctionLoadedRef.current = false;

      // Increment refresh trigger to force BidHistoryTable to refresh
      setRefreshTrigger(prev => prev + 1);
      console.log('Refresh trigger incremented to force UI update');

      // Refresh data to get the updated auction and bids
      if (auctionId) {
        await getAuctionById(auctionId);
        console.log('Auction data refreshed');

        // Immediately fetch the latest bid history to update the UI
        await fetchLatestBidHistory(auctionId);
        console.log('Bid history refreshed');
      }
    } catch (error) {
      console.error('Error canceling bid:', error);
      showToast(error instanceof Error ? error.message : 'Không thể hủy đấu giá', 'error');
    }
  };

  const handleGoBack = () => {
    navigate('/');
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

  // Check if cancel bid should be disabled
  const isCancelBidDisabled = () => {
    // Can't cancel if there are no bids
    if (bidHistory.length === 0) return true;

    // Can't cancel if no bidder is selected and we're not the last bidder
    if (!selectedBidder && !lastBidderId) return true;

    return false;
  };

  // Get disabled bidders based on current action
  const getDisabledBidders = () => {
    // We don't disable any bidders from being selected
    // The bid button will be disabled based on canBidderPlaceBid
    return [];
  };

  // Add a useEffect to refresh bid history when auction or bids change
  useEffect(() => {
    if (auctionId && auction) {
      console.log('Auction or bids changed, refreshing bid history');
      fetchLatestBidHistory(auctionId);
    }
  }, [auction, bids, auctionId, fetchLatestBidHistory]);

  // Create a wrapper for setBidAmount to add logging
  const handleBidAmountChange = (amount: string) => {
    console.log('Bid amount changed to:', amount);
    setBidAmount(amount);
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

  // Show a user-friendly error message when no auction is found
  if (!auction) {
    return (
      <div className="container py-4">
        <div className="card">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">Lỗi</h5>
          </div>
          <div className="card-body text-center py-5">
            <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3 mb-3">Không tìm thấy phiên đấu giá</h4>
            <p className="mb-4">Phiên đấu giá không tồn tại hoặc đã kết thúc.</p>
            <button className="btn btn-primary" onClick={handleGoBack}>
              <i className="bi bi-arrow-left me-1"></i> Quay Lại Trang Thiết Lập
            </button>
          </div>
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
            disabledBidders={getDisabledBidders()}
            lastBidderId={lastBidderId}
          />

          {/* Bid Controls Component */}
          <BidControls
            bidderName={selectedBidder ? bidders.find(b => b.id === selectedBidder)?.name || '' : ''}
            bidAmount={bidAmount}
            currentPrice={currentPrice.replace(' VND', '')}
            bidIncrement={bidIncrement.replace(' VND', '')}
            onBidAmountChange={handleBidAmountChange}
            onPlaceBid={handlePlaceBid}
            onCancelBid={handleCancelBid}
            isPlaceBidDisabled={!selectedBidder || !canBidderPlaceBid(selectedBidder || '')}
            isCancelBidDisabled={isCancelBidDisabled()}
            bidHistoryEmpty={bidHistory.length === 0}
            bidderTimeLeft={bidderTimeLeft}
            isLastBidder={selectedBidder === lastBidderId}
          />
                </div>
                  </div>

      {/* Bid History Table Component */}
      {auctionId && <BidHistoryTable
        auctionId={auctionId}
        initialData={bidHistory}
        refreshTrigger={refreshTrigger}
      />}

      <div className="text-end">
        <button className="btn btn-secondary" onClick={handleGoBack}>
          <i className="bi bi-arrow-left me-1"></i> Quay Lại Thiết Lập
        </button>
              </div>
            </div>
  );
};
