import { useEffect, useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { auctionEnded } from '../store/auctionSlice';

export const useReduxAuctionTimer = () => {
  const dispatch = useAppDispatch();

  // Get auction end time from Redux store
  const endTime = useAppSelector(state => state.auction.endTime);
  const status = useAppSelector(state => state.auction.status);

  // Local state for time remaining
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimerEnded, setIsTimerEnded] = useState<boolean>(false);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Update timer
  useEffect(() => {
    // Initial calculation
    if (endTime && status === 'active') {
      const calculateTimeRemaining = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);

        // Check if timer has ended
        if (remaining <= 0 && !isTimerEnded) {
          setIsTimerEnded(true);
          dispatch(auctionEnded());
        }
      };

      // Calculate immediately
      calculateTimeRemaining();

      // Set up interval
      const interval = setInterval(calculateTimeRemaining, 1000);

      // Clean up
      return () => clearInterval(interval);
    } else if (status !== 'active') {
      setTimeRemaining(0);
      setIsTimerEnded(true);
    }
  }, [endTime, status, isTimerEnded, dispatch]);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isTimerEnded
  };
};
