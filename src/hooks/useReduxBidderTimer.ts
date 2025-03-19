import { useEffect, useCallback, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { bidderTimerTick, bidderTimerReset } from '@store/auctionSlice';

export const useReduxBidderTimer = () => {
  const dispatch = useAppDispatch();
  // Add a state to control when the timer should be running
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get bidder timer state from Redux store
  const bidderTimeLeft = useAppSelector(state => state.auction.bidderTimeLeft);
  const selectedBidderId = useAppSelector(state => state.auction.selectedBidderId);
  const lastBidderId = useAppSelector(state => state.auction.lastBidderId);
  const status = useAppSelector(state => state.auction.status);
  // Get the auction for the timeLeft value
  const auction = useAppSelector(state => state.auction.auction);

  // Start the bidder timer only when isTimerRunning is true
  // This prevents the timer from starting automatically when a bidder is selected
  useEffect(() => {
    if (isTimerRunning && selectedBidderId && status === 'active' && selectedBidderId !== lastBidderId && bidderTimeLeft > 0) {
      const timer = setInterval(() => {
        dispatch(bidderTimerTick());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [dispatch, selectedBidderId, lastBidderId, status, isTimerRunning, bidderTimeLeft]);

  // Reset the bidder timer
  const resetBidderTimer = useCallback((seconds?: number) => {
    // Use provided seconds, or fall back to auction bidDuration setting, or default to 60
    const timerValue = seconds !== undefined
      ? seconds
      : (auction?.settings?.bidDuration || 60);
    dispatch(bidderTimerReset(timerValue));
  }, [dispatch, auction]);

  // Start the timer
  const startBidderTimer = useCallback(() => {
    setIsTimerRunning(true);
  }, []);

  // Stop the timer
  const stopBidderTimer = useCallback(() => {
    setIsTimerRunning(false);
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
    if (bidderTimeLeft <= 0) return false;

    return true;
  }, [selectedBidderId, lastBidderId, bidderTimeLeft, status]);

  return {
    bidderTimeLeft,
    resetBidderTimer,
    startBidderTimer,
    stopBidderTimer,
    canBidderPlaceBid,
    isBidderTimerRunning: isTimerRunning && selectedBidderId !== null && selectedBidderId !== lastBidderId && status === 'active' && bidderTimeLeft > 0
  };
};
