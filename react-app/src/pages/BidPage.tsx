import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BidHistoryTable from '../components/BidHistoryTable';
import BidderSelectionGrid from '../components/BidderSelectionGrid';
import BidControls from '../components/BidControls';
import AuctionSummary from '../components/AuctionSummary';
import AuctionHeader from '../components/AuctionHeader';
import AuctionResult from '../components/AuctionResult';
import { useAuction } from '../hooks/useAuction';
import { useBidderTimer } from '../hooks/useBidderTimer';
import { Bid } from '../types';
import * as XLSX from 'xlsx';

// Interface for the bid history display format
interface BidHistoryDisplay {
  id: number;
  bidder: string;
  amount: string;
  timestamp: string;
  rawTimestamp?: number; // Add raw timestamp for sorting
  rawAmount?: number; // Add raw amount for secondary sorting
  bidNumber?: number; // Use bidNumber instead of round for continuous bidding
}

export const BidPage: React.FC = () => {
  // Get auction data from useAuction hook
  const { auction, bidders, bids, loading: dataLoading, error: dataError, placeBid, updateAuction, getAuctionById, removeBid } = useAuction();

  const [currentPrice, setCurrentPrice] = useState<string>('0 VND');
  const [bidIncrement, setBidIncrement] = useState<string>('0 VND');
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [selectedBidder, setSelectedBidder] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidHistory, setBidHistory] = useState<BidHistoryDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auctionTitle, setAuctionTitle] = useState<string>('Phiên Đấu Giá');
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
    position?: 'top-right' | 'top-center' | 'bottom-center' | 'bottom-right'
  }>({
    show: false,
    message: '',
    type: 'success',
    position: 'bottom-center'
  });
  const [auctionId, setAuctionId] = useState<string | null>(null);

  // New states for bidder timer and last bidder
  const [lastBidderId, setLastBidderId] = useState<string | null>(null);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(null); // Add state for highest bidder
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0); // Add refresh trigger state
  const [isAuctionEnded, setIsAuctionEnded] = useState<boolean>(false);

  // Add a ref to track if we've already loaded the auction
  const auctionLoadedRef = useRef<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = useCallback((
    message: string,
    type: 'success' | 'error',
    position: 'top-right' | 'top-center' | 'bottom-center' | 'bottom-right' = 'bottom-center'
  ) => {
    setToast({ show: true, message, type, position });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  // Format timestamp to readable date string
  const formatTimestamp = useCallback((timestamp: number | undefined): string => {
    if (timestamp === undefined || timestamp === null) {
      return new Date().toLocaleString('vi-VN');
    }
    return new Date(timestamp).toLocaleString('vi-VN');
  }, []);

  // Format number to currency string
  const formatCurrency = useCallback((amount: number | undefined): string => {
    if (amount === undefined || amount === null) {
      return "0 VND";
    }
    return `${amount.toLocaleString('vi-VN')} VND`;
  }, []);

  // Calculate elapsed time in HH:MM:SS format
  const calculateElapsedTime = useCallback(() => {
    if (!auction?.startTime) return "00:00:00";

    // Calculate seconds difference between now and auction start time
    const elapsedSeconds = Math.floor((Date.now() - auction.startTime) / 1000);

    // Format to HH:MM:SS
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [auction?.startTime]);

  // Add state to track elapsed time with manual updates
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");

  // Update elapsed time every second
  useEffect(() => {
    if (!auction?.startTime) return;

    // Don't update if auction has ended
    if (isAuctionEnded) {
      // We already have the final snapshot in state, so just return
      return;
    }

    // Initial update
    setElapsedTime(calculateElapsedTime());

    // Set up interval to update every second
    const intervalId = setInterval(() => {
      setElapsedTime(calculateElapsedTime());
    }, 1000);

    // Clean up on unmount or when auction ends
    return () => clearInterval(intervalId);
  }, [auction?.startTime, calculateElapsedTime, isAuctionEnded]);

  // Convert bids from database to display format
  const convertBidsToDisplayFormat = useCallback((bids: Bid[]): BidHistoryDisplay[] => {
    // First sort bids by timestamp (newest first)
    const sortedBids = [...bids].sort((a, b) => b.timestamp - a.timestamp);

    // Then map bids to display format with sequential bidNumbers
    const formattedBids = sortedBids.map((bid, index) => {
      // Get bidder name from bidders array
      const bidder = bidders.find(b => b.id === bid.bidderId);
      const bidderName = bidder ? `${bid.bidderId} - ${bidder.name}` : bid.bidderId;

      return {
        id: index,
        bidNumber: sortedBids.length - index, // Newest bid gets highest number
        bidder: bidderName,
        amount: formatCurrency(bid.amount),
        timestamp: formatTimestamp(bid.timestamp),
        rawTimestamp: bid.timestamp,
        rawAmount: bid.amount
      };
    });

    return formattedBids;
  }, [formatCurrency, formatTimestamp, bidders]);

  // Define handleEndAuction function with useCallback
  const handleEndAuction = useCallback(async () => {
    if (!auction) return;

    try {
      // Update auction status to ENDED and set endTime to current time
      const updatedAuction = {
        ...auction,
        status: 'ENDED' as const,
        endTime: Date.now(), // Set the end time to the current timestamp
        result: {
          ...auction.result,
          endTime: Date.now(),
          finalPrice: auction.currentPrice,
          totalBids: bids.length
        }
      };

      // Find the highest bid to set as the winner
      const highestBid = bids
        .sort((a, b) => b.amount - a.amount)[0];

      if (highestBid) {
        const winningBidder = bidders.find(bidder => bidder.id === highestBid.bidderId);
        if (winningBidder) {
          // Update result with winner information
          updatedAuction.result = {
            ...updatedAuction.result,
            winnerId: winningBidder.id,
            winnerName: winningBidder.name,
            finalPrice: highestBid.amount
          };

          console.log(`Auction ended. Winner: ${winningBidder.name} with final bid: ${highestBid.amount.toLocaleString('vi-VN')} VND`);
        }
      } else {
        console.log('Auction ended with no bids.');
      }

      // Save the updated auction
      await updateAuction(updatedAuction);

      // Update local state to reflect auction ended
      setIsAuctionEnded(true);

      // Take a final snapshot of the elapsed time
      const finalElapsedTime = calculateElapsedTime();
      setElapsedTime(finalElapsedTime);

      showToast('Đấu giá kết thúc thành công', 'success', 'top-center');
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast(error instanceof Error ? error.message : 'Không thể kết thúc đấu giá', 'error', 'top-center');
    }
  }, [auction, bids, bidders, updateAuction, showToast, calculateElapsedTime]);

  // Use the bidder timer hook with improved functionality
  const {
    timeLeft: bidderTimeLeft,
    startTimer: startBidderTimer,
    stopTimer: stopBidderTimer,
    resetTimer: resetBidderTimer
  } = useBidderTimer({ initialTime: auction?.settings?.bidDuration || 60 });

  // Get auction ID from URL
  useEffect(() => {
    // Get auction ID from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const auctionIdParam = queryParams.get('id');

    if (!auctionIdParam) {
      showToast('Không tìm thấy ID phiên đấu giá', 'error', 'top-center');
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
  }, [location.search, getAuctionById, auctionId, showToast]);

  // Update component state when auction data changes
  useEffect(() => {
    if (dataLoading) {
      setLoading(true);
      return;
    }

    if (dataError) {
      showToast(dataError, 'error', 'top-center');
      setLoading(false);
      return;
    }

    if (!auction) {
      showToast('Không tìm thấy phiên đấu giá', 'error', 'top-center');
      // Don't navigate away, just show the error
      setLoading(false);
      return;
    }

    // Check if this is the auction we're looking for
    if (auctionId && auction.id !== auctionId) {
      showToast(`Phiên đấu giá với ID ${auctionId} không tồn tại`, 'error', 'top-center');
      // Don't navigate away, just show the error
      setLoading(false);
      return;
    }

    try {
      // Update auction details with safe access to properties
      setAuctionTitle(auction.title || 'Phiên Đấu Giá');
      setCurrentPrice(formatCurrency(auction.currentPrice));
      // Make sure settings exists before accessing bidStep
      if (auction.settings && auction.settings.bidStep !== undefined) {
        setBidIncrement(formatCurrency(auction.settings.bidStep));
      } else {
        setBidIncrement("0 VND");
      }

      // Log the bidders loaded from the database
      console.log(`Loaded ${bidders.length} bidders from database:`, bidders);
      setParticipantsCount(bidders.length);

      // Filter bids for this auction and sort by timestamp (newest first)
      const auctionBids = bids.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Check if auction is ended
      setIsAuctionEnded(auction.status === 'ENDED');

      // Set last bidder if there are bids
      if (auctionBids.length > 0) {
        setLastBidderId(auctionBids[0].bidderId);
      }

      // Find the highest bidder (by amount)
      if (auctionBids.length > 0) {
        const highestBid = [...auctionBids].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
        setHighestBidderId(highestBid.bidderId);
        // Get bidder name from the bidders array
        const bidderName = bidders.find(b => b.id === highestBid.bidderId)?.name || 'Unknown';
        console.log(`Highest bidder is ${bidderName} (ID: ${highestBid.bidderId}) with amount ${highestBid.amount}`);
      } else {
        setHighestBidderId(null);
      }

      // Convert bids to display format and ensure they are sorted by timestamp (newest first)
      const sortedBidHistory = convertBidsToDisplayFormat(auctionBids);
      console.log('Sorted bid history on initial load:', sortedBidHistory);
      setBidHistory(sortedBidHistory);

      setLoading(false);
    } catch (error) {
      console.error("Error updating component state:", error);
      showToast("Error loading auction data: " + (error instanceof Error ? error.message : "Unknown error"), 'error', 'top-center');
      setLoading(false);
    }
  }, [auction, bidders, bids, dataLoading, dataError, auctionId, navigate, convertBidsToDisplayFormat, formatCurrency, showToast]);

  // Handle bidder selection and start timer
  const handleBidderSelect = (bidderId: string) => {
    // Prevent selection if auction is ended
    if (isAuctionEnded) {
      showToast('Không thể chọn người tham gia khi đấu giá đã kết thúc', 'error', 'bottom-center');
      return;
    }

    // Toggle selection if clicking the same bidder
    if (bidderId === selectedBidder) {
      setSelectedBidder(null);
      stopBidderTimer();
      return;
    }

    setSelectedBidder(bidderId);

    // If this is the last bidder, set timer to 0
    if (bidderId === lastBidderId) {
      resetBidderTimer(0);
      return;
    }

    // Otherwise, reset timer to the auction's bidDuration setting and start it
    resetBidderTimer(auction?.settings?.bidDuration || 60);
    startBidderTimer();
  };

  const handlePlaceBid = async (directBidAmount?: string) => {
    console.log('handlePlaceBid called with bidAmount:', bidAmount, 'directBidAmount:', directBidAmount);

    // Ensure we have a selected bidder and auction
    if (!selectedBidder || !auction) {
      showToast('Vui lòng chọn người đấu giá', 'error', 'bottom-center');
      return;
    }

    // Check if auction is ended
    if (isAuctionEnded) {
      showToast('Đấu giá đã kết thúc', 'error', 'bottom-center');
      return;
    }

    // Use the direct bid amount if provided, otherwise use the state bidAmount
    let effectiveBidAmount = directBidAmount || bidAmount;

    // Calculate default bid amount if not provided
    if (!effectiveBidAmount) {
      // If bid amount is empty, calculate it from current price + bid increment
      const currentPriceValue = parseInt(currentPrice.replace(/\D/g, '')) || 0;
      const bidIncrementValue = parseInt(bidIncrement.replace(/\D/g, '')) || 0;
      effectiveBidAmount = (currentPriceValue + bidIncrementValue).toString();
      console.log('Using calculated bid amount:', effectiveBidAmount);
    }

    // Check if we still don't have a bid amount
    if (!effectiveBidAmount) {
      showToast('Vui lòng nhập số tiền đấu giá', 'error', 'bottom-center');
      return;
    }

    // Check if bidder timer has expired
    if (bidderTimeLeft <= 0) {
      showToast('Thời gian đấu giá đã hết', 'error', 'bottom-center');
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
        effectiveBidAmount
      });

      // Different validation for first bid vs subsequent bids
      if (bidHistoryEmpty) {
        // For the first bid, allow amount to be equal to or greater than the current price
        if (numericAmount < currentPriceValue) {
          showToast(`Giá trả đầu tiên phải bằng hoặc cao hơn giá khởi điểm ${currentPrice}`, 'error', 'bottom-center');
          return;
        }
      } else {
        // For subsequent bids, require price to be current price + increment
        if (numericAmount < currentPriceValue + bidIncrementValue) {
          showToast(`Giá trả phải cao hơn giá hiện tại ít nhất ${bidIncrement}`, 'error', 'bottom-center');
          return;
        }
      }

      // Get the selected bidder's name
      const selectedBidderName = bidders.find(b => b.id === selectedBidder)?.name || '';

      // Place the bid
      console.log(`Placing bid: ${numericAmount} VND by bidder ${selectedBidder} (${selectedBidderName})`);
      const newBid = await placeBid(selectedBidder, numericAmount);
      console.log('New bid placed successfully:', newBid);

      // Set this bidder as the last bidder
      setLastBidderId(selectedBidder);

      // Update the highest bidder if this is the highest bid
      const currentHighestBid = bids
        .sort((a, b) => b.amount - a.amount)[0];

      if (!currentHighestBid || numericAmount > currentHighestBid.amount) {
        setHighestBidderId(selectedBidder);
      }

      // Immediately update the current price in the UI
      setCurrentPrice(formatCurrency(numericAmount));

      // Update the auction's current price in the database
      const updatedAuction = {
        ...auction,
        currentPrice: numericAmount,
        // Ensure the auction status is set to IN_PROGRESS
        status: 'IN_PROGRESS' as const
      };
      await updateAuction(updatedAuction);
      console.log(`Updated auction current price to: ${numericAmount}`);

      // Reset and restart bidder timer
      startBidderTimer();

      // Create a new bid history entry and add it to the current bid history
      const newBidHistoryEntry: BidHistoryDisplay = {
        id: Date.now(), // Use timestamp as temporary ID
        bidder: `${selectedBidder} - ${selectedBidderName}`,
        amount: formatCurrency(numericAmount),
        timestamp: formatTimestamp(Date.now()),
        rawTimestamp: Date.now(),
        rawAmount: numericAmount,
        bidNumber: bidHistory.length + 1 // The new bid gets the next sequence number
      };

      // Update bid history immediately for a responsive UI
      setBidHistory(prevHistory => [newBidHistoryEntry, ...prevHistory]);

      // Increment refresh trigger to force BidHistoryTable to refresh
      setRefreshTrigger(prev => prev + 1);

      // Refresh data to get the updated auction and bids
      if (auctionId) {
        await getAuctionById(auctionId);

        // Fetch the latest bid history from the database to ensure consistency
        await fetchLatestBidHistory(auctionId);
      }
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

      // Check if the auction exists
      if (!database.auctions || !database.auctions[auctionId]) {
        console.log(`Auction with ID ${auctionId} not found in database`);
        setBidHistory([]);
        return;
      }

      const auctionFromDB = database.auctions[auctionId];

      // Get all bids for this auction - safely access bids from auction object
      const allBids = auctionFromDB.bids ? Object.values(auctionFromDB.bids) : [];
      console.log(`Found ${allBids.length} bids for auction ${auctionId}`);

      // Sort all bids by timestamp (newest first) with null safety
      const sortedAllBids = [...allBids].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

      // Find the highest bidder (by amount)
      if (allBids.length > 0) {
        const highestBid = [...allBids].sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))[0] as {
          bidderId: string;
          amount: number;
        };

        if (highestBid?.bidderId) {
          setHighestBidderId(highestBid.bidderId);
          // Get bidder name from the bidders array
          const bidderName = bidders.find(b => b.id === highestBid.bidderId)?.name || 'Unknown';
          console.log(`Highest bidder is ${bidderName} (ID: ${highestBid.bidderId}) with amount ${highestBid.amount}`);

          // Update the current price based on the highest bid
          setCurrentPrice(formatCurrency(highestBid.amount));

          // Also update the auction's current price in the database if needed
          if (auction && auction.currentPrice !== highestBid.amount) {
            const updatedAuction = {
              ...auction,
              currentPrice: highestBid.amount
            };
            await updateAuction(updatedAuction);
            console.log(`Updated auction current price to: ${highestBid.amount}`);
          }
        }
      } else {
        setHighestBidderId(null);

        // If no bids, reset to starting price
        if (auction && auction.settings) {
          const startingPrice = auction.settings.startingPrice || 0;
          setCurrentPrice(formatCurrency(startingPrice));

          // Update the auction's current price in the database
          if (auction.currentPrice !== startingPrice) {
            const updatedAuction = {
              ...auction,
              currentPrice: startingPrice
            };
            await updateAuction(updatedAuction);
            console.log(`Reset auction current price to starting price: ${startingPrice}`);
          }
        }
      }

      // Find the last bidder (by timestamp)
      if (allBids.length > 0 && sortedAllBids.length > 0) {
        const lastBid = sortedAllBids[0] as {
          bidderId: string;
          timestamp: number;
        };

        if (lastBid?.bidderId) {
          setLastBidderId(lastBid.bidderId);
          // Get bidder name from the bidders array
          const bidderName = bidders.find(b => b.id === lastBid.bidderId)?.name || 'Unknown';
          console.log(`Last bidder is ${bidderName} (ID: ${lastBid.bidderId})`);
        }
      } else {
        setLastBidderId(null);
      }

      // Format the bids for display with sequential bid numbers
      const formattedBids = sortedAllBids.map((bid: any, index: number) => {
        // Get bidder name from bidders array
        const bidder = bidders.find(b => b.id === bid.bidderId);
        const bidderName = bidder ? `${bidder.name}` : (bid.bidderId || 'Unknown');

        return {
          id: bid.id || index,
          bidNumber: sortedAllBids.length - index, // Newest bid gets highest number
          bidder: bidderName,
          amount: formatCurrency(bid.amount || 0),
          timestamp: formatTimestamp(bid.timestamp || Date.now()),
          rawTimestamp: bid.timestamp || Date.now(),
          rawAmount: bid.amount || 0
        };
      });

      console.log('Updated bid history from database:', formattedBids);
      setBidHistory(formattedBids);
    } catch (error) {
      console.error('Error fetching latest bid history:', error);
    }
  }, [formatCurrency, formatTimestamp, auction, updateAuction, bidders]);

  const handleCancelBid = async () => {
    console.log('handleCancelBid called');

    if (!auction) {
      showToast('Không tìm thấy phiên đấu giá', 'error', 'bottom-center');
      return;
    }

    // If no bidder is selected, use the last bidder
    const bidderToCancel = selectedBidder || lastBidderId;
    console.log('Bidder to cancel:', bidderToCancel, 'Selected bidder:', selectedBidder, 'Last bidder:', lastBidderId);

    if (!bidderToCancel) {
      showToast('Không có người đấu giá để hủy', 'error', 'bottom-center');
      return;
    }

    // Check if the selected bidder is the last bidder
    if (selectedBidder && selectedBidder !== lastBidderId) {
      // If a bidder is selected but they're not the last bidder, show an error
      showToast('Chỉ có thể hủy đấu giá cuối cùng', 'error', 'bottom-center');
        return;
    }

    try {
      // Find the last bid from this bidder
      const bidderBids = bids
        .filter(bid => bid.bidderId === bidderToCancel)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log('Bidder bids found:', bidderBids.length);

      if (bidderBids.length === 0) {
        showToast('Không tìm thấy lịch sử đấu giá của người này', 'error', 'bottom-center');
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
        .filter(bid => bid.id !== lastBid.id)
        .sort((a, b) => b.timestamp - a.timestamp);

      console.log('Other bids after cancellation:', otherBids.length);

      // Find the new highest bid
      const newHighestBid = bids
        .filter(bid => bid.id !== lastBid.id)
        .sort((a, b) => b.amount - a.amount)[0];

      // If there are other bids, set the new last bidder and update the current price
      if (otherBids.length > 0) {
        const newLastBidder = otherBids[0].bidderId;
        setLastBidderId(newLastBidder);
        console.log('New last bidder set to:', newLastBidder);

        // Update the highest bidder
        if (newHighestBid) {
          setHighestBidderId(newHighestBid.bidderId);

          // Update the current price to the highest remaining bid
          setCurrentPrice(formatCurrency(newHighestBid.amount));

          // Update the auction's current price in the database
          const updatedAuction = {
            ...auction,
            currentPrice: newHighestBid.amount
          };
          await updateAuction(updatedAuction);
          console.log(`Updated auction current price to: ${newHighestBid.amount}`);
        } else {
          setHighestBidderId(null);
        }
      } else {
        // If no bids remain, reset to initial state
        setLastBidderId(null);
        setHighestBidderId(null);

        // Reset the current price to the starting price
        const startingPrice = auction.settings.startingPrice || 0;
        setCurrentPrice(formatCurrency(startingPrice));

        // Update the auction's current price in the database
        const updatedAuction = {
          ...auction,
          currentPrice: startingPrice
        };
        await updateAuction(updatedAuction);
        console.log(`Reset auction current price to starting price: ${startingPrice}`);
      }

      // Immediately update the bid history by removing the canceled bid
      setBidHistory(prevHistory =>
        prevHistory.filter(bid =>
          !(bid.rawTimestamp === lastBid.timestamp &&
            bid.rawAmount === lastBid.amount)
        )
      );

      showToast('Đã hủy đấu giá cuối cùng', 'success', 'bottom-center');

      // Increment refresh trigger to force BidHistoryTable to refresh
      setRefreshTrigger(prev => prev + 1);
      console.log('Refresh trigger incremented to force UI update');

      // Refresh data to get the updated auction and bids
      if (auctionId) {
        await getAuctionById(auctionId);

        // Fetch the latest bid history to ensure consistency
        await fetchLatestBidHistory(auctionId);
      }
    } catch (error) {
      console.error('Error canceling bid:', error);
      showToast(error instanceof Error ? error.message : 'Không thể hủy đấu giá', 'error', 'bottom-center');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  // Update the canBidderPlaceBid function
  const canBidderPlaceBid = (bidderId: string) => {
    // Can't bid if this was the last bidder
    if (bidderId === lastBidderId) return false;

    // Can't bid if the auction is ended
    if (isAuctionEnded) return false;

    // Can't bid if bidder timer expired
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
    // If the auction is ended, disable all bidders
    if (isAuctionEnded) {
      return bidders.map(bidder => bidder.id);
    }

    // Otherwise, we don't disable any bidders from being selected
    // The bid button will be disabled based on canBidderPlaceBid
    return [];
  };

  // Create a wrapper for setBidAmount to add logging
  const handleBidAmountChange = (amount: string) => {
    console.log('Bid amount changed to:', amount);
    setBidAmount(amount);
  };

  // Handle exporting auction data
  const handleExportData = () => {
    if (!auction) return;

    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();

      // Create auction info data
      const auctionInfoData = [
        ['Thông tin đấu giá', 'Giá trị'],
        ['Tên phiên đấu giá', auctionTitle],
        ['Người tổ chức', auction.settings.auctioneer || 'Admin'],
        ['Người thắng cuộc', lastBidderId ? bidders.find(b => b.id === lastBidderId)?.name || 'Không có người thắng' : 'Không có người thắng'],
        ['Giá thắng cuộc', formatCurrency(parseInt(currentPrice.replace(/[^\d]/g, '')))],
        ['Thời gian bắt đầu', auction.startTime ? formatTimestamp(auction.startTime) : formatTimestamp(Date.now())],
        ['Thời gian kết thúc', formatTimestamp(auction.endTime || Date.now())],
        ['Thời gian diễn ra', elapsedTime],
        ['Tổng số lượt đặt giá', bidHistory.length]
      ];

      // Create auction info worksheet
      const wsInfo = XLSX.utils.aoa_to_sheet(auctionInfoData);

      // Set column widths for info sheet
      wsInfo['!cols'] = [
        { wch: 25 }, // Column A width
        { wch: 40 }  // Column B width
      ];

      // Add the info worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, wsInfo, "Thông tin đấu giá");

      // Format bid history data for the second sheet
      const bidHistoryHeaders = ['Người đặt giá', 'Số tiền', 'Thời gian'];

      const bidHistoryData = bids
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp (newest first)
        .map(bid => {
          // Get bidder name from bidders array
          const bidder = bidders.find(b => b.id === bid.bidderId);
          return [
            bidder ? bidder.name : bid.bidderId,
            formatCurrency(bid.amount),
            formatTimestamp(bid.timestamp)
          ];
        });

      // Add headers to bid history data
      bidHistoryData.unshift(bidHistoryHeaders);

      // Create bid history worksheet
      const wsBids = XLSX.utils.aoa_to_sheet(bidHistoryData);

      // Set column widths for bid history sheet
      wsBids['!cols'] = [
        { wch: 30 }, // Người đặt giá
        { wch: 20 }, // Số tiền
        { wch: 25 }  // Thời gian
      ];

      // Add the bid history worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, wsBids, "Lịch sử đấu giá");

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create a Blob from the buffer
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link and trigger click
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auction-data-${auction.id}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Dữ liệu đấu giá đã được xuất thành công dưới dạng Excel', 'success');
    } catch (error) {
      console.error('Error exporting data to Excel:', error);
      showToast('Không thể xuất dữ liệu Excel. Vui lòng thử lại.', 'error');
    }
  };

  // Replace with a function to manually fetch bid history
  const handleRefreshBidHistory = () => {
    if (auctionId) {
      console.log('Manually refreshing bid history');
      fetchLatestBidHistory(auctionId);
    }
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
      <div className={`toast-container position-fixed p-3 ${
        toast.position === 'top-right' ? 'top-0 end-0' :
        toast.position === 'top-center' ? 'top-0 start-50 translate-middle-x' :
        toast.position === 'bottom-center' ? 'bottom-0 start-50 translate-middle-x' :
        'bottom-0 end-0' // default to bottom-right
      }`}>
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
          elapsedTime={elapsedTime}
          onEndAuction={handleEndAuction}
          totalBids={bidHistory.length}
          isAuctionEnded={isAuctionEnded}
        />

        <div className="card-body py-2">
          {isAuctionEnded ? (
            <AuctionResult
              title={auctionTitle}
              winnerName={lastBidderId ? bidders.find(b => b.id === lastBidderId)?.name || '' : ''}
              winningPrice={parseInt(currentPrice.replace(/[^\d]/g, ''))}
              startTime={auction.startTime || Date.now()}
              endTime={auction.endTime || Date.now()}
              totalBids={bidHistory.length}
            />
          ) : (
            <>
              {/* Auction Summary Component */}
              <AuctionSummary
                totalBids={bidHistory.length}
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
                highestBidderId={highestBidderId}
                isTimerEnded={isAuctionEnded}
              />

              {/* Bid Controls Component - Only show when auction is not ended */}
              {!isAuctionEnded && (
                <BidControls
                  bidderName={selectedBidder ? `${selectedBidder} - ${bidders.find(b => b.id === selectedBidder)?.name || ''}` : ''}
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
              )}
            </>
          )}
        </div>
      </div>

      {/* Bid History Table Component */}
      {auctionId && <BidHistoryTable
        auctionId={auctionId}
        initialData={bidHistory}
        refreshTrigger={refreshTrigger}
        onRefresh={handleRefreshBidHistory}
      />}

      {/* Floating Back Button - Always visible */}
      <button className="floating-back-btn" onClick={handleGoBack}>
        <i className="bi bi-arrow-left"></i>
        Quay Lại Thiết Lập
      </button>

      {/* Floating Export Button - Only visible when auction ends */}
      {isAuctionEnded && (
        <button className="floating-export-btn" onClick={handleExportData}>
          <i className="bi bi-file-earmark-excel"></i>
          Xuất Excel
        </button>
      )}
    </div>
  );
};
