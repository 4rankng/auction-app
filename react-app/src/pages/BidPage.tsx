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
import './BidPage.css';
import { bidService } from '../services/bidService';

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
  // Get auction data from useAuction hook - removed placeBid and removeBid
  const { auction, bidders, bids, loading: dataLoading, error: dataError, updateAuction, getAuctionById } = useAuction();

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

  // Format number to currency string
  const formatCurrency = useCallback((amount: number | undefined): string => {
    return bidService.formatCurrency(amount || 0);
  }, []);

  // Calculate elapsed time in HH:MM:SS format
  const calculateElapsedTime = useCallback(() => {
    if (!auction?.startTime) return "00:00:00";

    // For ended auctions, use the stored duration from result
    if (isAuctionEnded && auction.result?.duration) {
      const durationSeconds = auction.result.duration;
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const seconds = durationSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // For ongoing auctions, calculate from startTime to now
    const elapsedSeconds = Math.floor((Date.now() - auction.startTime) / 1000);

    // Format to HH:MM:SS
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [auction?.startTime, auction?.result?.duration, isAuctionEnded]);

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
      // Use functional update to avoid capturing state in closure
      setElapsedTime((prevElapsedTime) => {
        const newElapsedTime = calculateElapsedTime();
        // Only update if time has actually changed
        return newElapsedTime !== prevElapsedTime ? newElapsedTime : prevElapsedTime;
      });
    }, 1000);

    // Clean up on unmount or when auction ends
    return () => clearInterval(intervalId);
  }, [auction?.startTime, calculateElapsedTime, isAuctionEnded]);

  // Convert bids from database to display format
  const convertBidsToDisplayFormat = useCallback((bids: Bid[]): BidHistoryDisplay[] => {
    return bidService.formatBidsForDisplay(bids, bidders) as BidHistoryDisplay[];
  }, [bidders]);

  // Define handleEndAuction function with useCallback
  const handleEndAuction = useCallback(async () => {
    if (!auction) return;

    try {
      console.log("Starting auction end process...");

      // Calculate auction duration in seconds
      const startTimeMs = auction.startTime || Date.now();
      const endTimeMs = Date.now();
      const durationSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);

      // Update auction status to ENDED and set endTime to current time
      const updatedAuction = {
        ...auction,
        status: 'ENDED' as const,
        endTime: endTimeMs,
        result: {
          startTime: startTimeMs,
          endTime: endTimeMs,
          startingPrice: auction.settings?.startingPrice || 0,
          finalPrice: auction.currentPrice || 0,
          duration: durationSeconds,
          totalBids: bids.length,
          winnerId: '',
          winnerName: ''
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

      // Log the updated auction before saving
      console.log("Saving auction with result:", JSON.stringify(updatedAuction.result, null, 2));

      // Save the updated auction with complete result object to the database
      await updateAuction(updatedAuction);

      // Fetch the updated auction to make sure we have the latest data
      if (auctionId) {
        await getAuctionById(auctionId);
        console.log("Fetched updated auction after ending");
      }

      // Update local state to reflect auction ended
      setIsAuctionEnded(true);
      console.log("isAuctionEnded set to true");

      // Take a final snapshot of the elapsed time to display
      // This will be formatted as HH:MM:SS for UI display
      const finalElapsedTime = calculateElapsedTime();
      setElapsedTime(finalElapsedTime);
      console.log("Final elapsed time set to:", finalElapsedTime);

      // The timer will automatically stop updating because isAuctionEnded is now true
      // This is handled in the useEffect with the interval

      showToast('Đấu giá kết thúc thành công', 'success', 'top-center');
    } catch (error) {
      console.error('Error ending auction:', error);
      showToast(error instanceof Error ? error.message : 'Không thể kết thúc đấu giá', 'error', 'top-center');
    }
  }, [auction, bids, bidders, updateAuction, getAuctionById, auctionId, showToast, calculateElapsedTime]);

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

      // Initialize elapsed time immediately based on auction status
      if (auction.status === 'ENDED' && auction.result?.duration) {
        // For ended auctions, set elapsed time from the saved duration
        const durationSeconds = auction.result.duration;
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        const seconds = durationSeconds % 60;
        setElapsedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } else if (auction.startTime) {
        // For ongoing auctions, calculate from start time
        setElapsedTime(calculateElapsedTime());
      }

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
  }, [auction, bidders, bids, dataLoading, dataError, auctionId, navigate, convertBidsToDisplayFormat, formatCurrency, showToast, calculateElapsedTime]);

  // Handle bidder selection and start timer
  const handleBidderSelect = useCallback((bidderId: string) => {
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
  }, [isAuctionEnded, selectedBidder, lastBidderId, auction?.settings?.bidDuration, showToast, stopBidderTimer, resetBidderTimer, startBidderTimer]);

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
      const currentPriceValue = bidService.parseCurrency(currentPrice);
      const bidIncrementValue = bidService.parseCurrency(bidIncrement);
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
      const numericAmount = bidService.parseCurrency(effectiveBidAmount);

      // Get the selected bidder's name
      const selectedBidderName = bidders.find(b => b.id === selectedBidder)?.name || '';

      // Use the bidService to place the bid
      console.log(`Placing bid: ${numericAmount} VND by bidder ${selectedBidder} (${selectedBidderName})`);
      const newBid = await bidService.placeBid(auction.id, selectedBidder, numericAmount);
      console.log('New bid placed successfully:', newBid);

      // Set this bidder as the last bidder
      setLastBidderId(selectedBidder);

      // Update the highest bidder if this is the highest bid
      const highestBid = await bidService.getHighestBid(auction.id);
      if (highestBid && highestBid.bidderId === selectedBidder) {
        setHighestBidderId(selectedBidder);
      }

      // Immediately update the current price in the UI
      setCurrentPrice(bidService.formatCurrency(numericAmount));

      // Reset and restart bidder timer
      startBidderTimer();

      // Create a new bid history entry and add it to the current bid history
      const newBidHistoryEntry: BidHistoryDisplay = {
        id: Date.now(), // Use timestamp as temporary ID
        bidder: `${selectedBidder} - ${selectedBidderName}`,
        amount: bidService.formatCurrency(numericAmount),
        timestamp: bidService.formatTimestamp(Date.now()),
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

        // Fetch the latest bid history
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

      // Get latest bids using bidService
      const latestBids = await bidService.getLatestBids(auctionId);
      console.log(`Found ${latestBids.length} bids for auction ${auctionId}`);

      if (latestBids.length === 0) {
        setBidHistory([]);
        setLastBidderId(null);
        setHighestBidderId(null);
        return;
      }

      // Set the last bidder (newest bid)
      setLastBidderId(latestBids[0].bidderId);

      // Get the highest bid
      const highestBid = await bidService.getHighestBid(auctionId);

      if (highestBid) {
        setHighestBidderId(highestBid.bidderId);

        // Get bidder name from the bidders array
        const bidderName = bidders.find(b => b.id === highestBid.bidderId)?.name || 'Unknown';
        console.log(`Highest bidder is ${bidderName} (ID: ${highestBid.bidderId}) with amount ${highestBid.amount}`);

        // Update the current price based on the highest bid
        setCurrentPrice(bidService.formatCurrency(highestBid.amount));
      } else {
        setHighestBidderId(null);

        // If no bids, reset to starting price
        if (auction?.settings) {
          setCurrentPrice(bidService.formatCurrency(auction.settings.startingPrice || 0));
        }
      }

      // Format the bids for display
      const formattedBids = bidService.formatBidsForDisplay(latestBids, bidders);

      console.log('Updated bid history from bidService:', formattedBids);
      setBidHistory(formattedBids);

      // Increment refresh trigger to force BidHistoryTable to refresh
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching latest bid history:', error);
      showToast(error instanceof Error ? error.message : 'Không thể tải lịch sử đấu giá', 'error');
    }
  }, [bidders, auction, showToast]);

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
      // Get the latest bids for this auction
      const latestBids = await bidService.getLatestBids(auction.id);

      if (latestBids.length === 0) {
        showToast('Không tìm thấy lịch sử đấu giá', 'error', 'bottom-center');
        return;
      }

      // Get the last bid
      const lastBid = latestBids[0];
      console.log('Last bid to cancel:', lastBid);

      // Use bidService to cancel the bid
      await bidService.cancelBid(auction.id, lastBid.id);
      console.log('Bid removed successfully');

      // Get updated bids after cancellation
      const updatedBids = await bidService.getLatestBids(auction.id);

      // Find the highest bid after cancellation
      const highestBid = await bidService.getHighestBid(auction.id);

      // If there are other bids, set the new last bidder and update the current price
      if (updatedBids.length > 0) {
        const newLastBidder = updatedBids[0].bidderId;
        setLastBidderId(newLastBidder);
        console.log('New last bidder set to:', newLastBidder);

        // Update the highest bidder
        if (highestBid) {
          setHighestBidderId(highestBid.bidderId);

          // Update the current price to the highest remaining bid
          setCurrentPrice(bidService.formatCurrency(highestBid.amount));
        } else {
          setHighestBidderId(null);
        }
      } else {
        // If no bids remain, reset to initial state
        setLastBidderId(null);
        setHighestBidderId(null);

        // Reset the current price to the starting price
        const startingPrice = auction.settings.startingPrice || 0;
        setCurrentPrice(bidService.formatCurrency(startingPrice));
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
  const canBidderPlaceBid = useCallback((bidderId: string) => {
    // Can't bid if this was the last bidder
    if (bidderId === lastBidderId) return false;

    // Can't bid if the auction is ended
    if (isAuctionEnded) return false;

    // Can't bid if bidder timer expired
    if (selectedBidder === bidderId && bidderTimeLeft <= 0) return false;

    return true;
  }, [lastBidderId, isAuctionEnded, selectedBidder, bidderTimeLeft]);

  // Check if cancel bid should be disabled
  const isCancelBidDisabled = useCallback(() => {
    // Can't cancel if there are no bids
    if (bidHistory.length === 0) return true;

    // Can't cancel if no bidder is selected and we're not the last bidder
    if (!selectedBidder && !lastBidderId) return true;

    return false;
  }, [bidHistory.length, selectedBidder, lastBidderId]);

  // Get disabled bidders based on current action
  const getDisabledBidders = useCallback(() => {
    // If the auction is ended, disable all bidders
    if (isAuctionEnded) {
      return bidders.map(bidder => bidder.id);
    }

    // Otherwise, we don't disable any bidders from being selected
    // The bid button will be disabled based on canBidderPlaceBid
    return [];
  }, [isAuctionEnded, bidders]);

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
        ['Giá thắng cuộc', bidService.formatCurrency(parseInt(currentPrice.replace(/[^\d]/g, '')))],
        ['Thời gian bắt đầu', auction.startTime ? bidService.formatTimestamp(auction.startTime) : bidService.formatTimestamp(Date.now())],
        ['Thời gian kết thúc', bidService.formatTimestamp(auction.endTime || Date.now())],
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
            bidService.formatCurrency(bid.amount),
            bidService.formatTimestamp(bid.timestamp)
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
            <>
              <AuctionResult
                result={auction.result}
                totalBids={bidHistory.length}
              />
            </>
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

              {/* Bid Controls Component */}
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
