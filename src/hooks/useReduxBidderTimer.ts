import { useEffect, useCallback, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { bidderTimerTick, bidderTimerReset } from '@store/auctionSlice';

export const useReduxBidderTimer = () => {
  const dispatch = useAppDispatch();
  // Add a state to control when the timer should be running
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  // Add local timer state to avoid direct Redux state updates affecting components
  const [localTimeLeft, setLocalTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get bidder timer state from Redux store
  const bidderTimeLeft = useAppSelector(state => state.auction.bidderTimeLeft);
  const selectedBidderId = useAppSelector(state => state.auction.selectedBidderId);
  const lastBidderId = useAppSelector(state => state.auction.lastBidderId);
  const status = useAppSelector(state => state.auction.status);
  // Get the auction for the timeLeft value
  const auction = useAppSelector(state => state.auction.auction);

  // Initialize local time left from Redux state
  useEffect(() => {
    if (localTimeLeft === null) {
      setLocalTimeLeft(bidderTimeLeft);
    }
  }, [bidderTimeLeft, localTimeLeft]);

  // Start the bidder timer only when isTimerRunning is true
  // This prevents the timer from starting automatically when a bidder is selected
  useEffect(() => {
    if (isTimerRunning && selectedBidderId && status === 'active' && selectedBidderId !== lastBidderId && localTimeLeft && localTimeLeft > 0) {
      // Use local timer without directly dispatching on every tick
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      timerRef.current = setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev && prev > 0) {
            return prev - 1;
          }
          return 0;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [dispatch, selectedBidderId, lastBidderId, status, isTimerRunning, localTimeLeft]);

  // Only dispatch Redux actions when needed (not on every tick)
  // This reduces the effect on other components
  useEffect(() => {
    // Only update Redux state when timer completes or when it's explicitly needed
    if (localTimeLeft === 0 && isTimerRunning) {
      dispatch(bidderTimerTick());
      setIsTimerRunning(false);
    }
  }, [localTimeLeft, isTimerRunning, dispatch]);

  // Reset the bidder timer
  const resetBidderTimer = useCallback((seconds?: number) => {
    // Use provided seconds, or fall back to auction bidDuration setting, or default to 60
    const timerValue = seconds !== undefined
      ? seconds
      : (auction?.settings?.bidDuration || 60);

    // Update local state first
    setLocalTimeLeft(timerValue);

    // Then update Redux state
    dispatch(bidderTimerReset(timerValue));
  }, [dispatch, auction]);

  // Start the timer
  const startBidderTimer = useCallback(() => {
    setIsTimerRunning(true);
  }, []);

  // Stop the timer
  const stopBidderTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Check if the bidder can place a bid
  const canBidderPlaceBid = useCallback(() => {
    // Cannot bid if no bidder is selected
    if (!selectedBidderId) return false;

    // Cannot bid if auction is not active
    if (status !== 'active') return false;

    // Cannot bid if this bidder was the last to bid
    if (selectedBidderId === lastBidderId) return false;

    // Cannot bid if the bidder timer has run out
    if (localTimeLeft !== null && localTimeLeft <= 0) return false;

    return true;
  }, [selectedBidderId, lastBidderId, localTimeLeft, status]);

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    // Return localTimeLeft instead of Redux state for display purposes
    bidderTimeLeft: localTimeLeft !== null ? localTimeLeft : bidderTimeLeft,
    resetBidderTimer,
    startBidderTimer,
    stopBidderTimer,
    canBidderPlaceBid,
    isBidderTimerRunning: isTimerRunning && selectedBidderId !== null && selectedBidderId !== lastBidderId && status === 'active' && (localTimeLeft !== null ? localTimeLeft > 0 : bidderTimeLeft > 0)
  };
};
