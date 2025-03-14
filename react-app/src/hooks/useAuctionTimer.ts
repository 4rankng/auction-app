import { useState, useEffect, useRef, useCallback } from 'react';
import * as timerService from '../services/timerService';
import { formatCountdown } from '../utils/timeUtils';

interface UseAuctionTimerProps {
  endTime: number | undefined;
  onTimerEnd: () => void;
}

export const useAuctionTimer = ({
  endTime,
  onTimerEnd
}: UseAuctionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isTimerEnded, setIsTimerEnded] = useState<boolean>(false);

  // Store callbacks in refs to avoid re-creating the interval on every callback change
  const onTimerEndRef = useRef<() => void>(onTimerEnd);
  const timerEndMessageShownRef = useRef<boolean>(false);
  const timerIdRef = useRef<string>(`auction_timer_${Date.now()}`);

  // Update refs when callbacks change
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  const handleComplete = useCallback(() => {
    setTimeLeft('00:00');
    setIsTimerEnded(true);

    if (!timerEndMessageShownRef.current) {
      timerEndMessageShownRef.current = true;
      console.log('Timer ended');

      // Use setTimeout to break synchronous update chain
      setTimeout(() => {
        console.log('Auction time ended. Waiting for user to manually end the auction.');
        onTimerEndRef.current();
      }, 0);
    }
  }, []);

  // Handle timer tick
  const handleTick = useCallback((seconds: number) => {
    setTimeLeft(formatCountdown(seconds));
    setIsTimerEnded(seconds <= 0);
  }, []);

  // Initialize or update timer when endTime changes
  useEffect(() => {
    if (!endTime) return;

    // Reset flags when dependencies change
    timerEndMessageShownRef.current = false;
    setIsTimerEnded(false);

    // Calculate remaining time in seconds
    const now = Date.now();
    const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

    // Create or update the timer
    timerService.createTimer(timerIdRef.current, remainingSeconds, {
      onTick: handleTick,
      onComplete: handleComplete,
      tickInterval: 1000
    });

    // Start the timer
    timerService.startTimer(timerIdRef.current);

    // Initial update
    handleTick(remainingSeconds);

    // Clean up on unmount or when dependencies change
    return () => {
      timerService.stopTimer(timerIdRef.current);
      timerEndMessageShownRef.current = false;
    };
  }, [endTime, handleTick, handleComplete]);

  // Reset timer function
  const resetTimer = useCallback(() => {
    timerEndMessageShownRef.current = false;
    setIsTimerEnded(false);

    if (endTime) {
      // Calculate new remaining time
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

      // Reset the timer with the new duration
      timerService.resetTimer(timerIdRef.current, remainingSeconds, true);
    }
  }, [endTime]);

  // Sync timer with server
  const syncWithServer = useCallback((serverEndTime: number) => {
    if (serverEndTime) {
      timerService.syncTimerWithServer(timerIdRef.current, serverEndTime);
    }
  }, []);

  return {
    timeLeft,
    isTimerEnded,
    resetTimer,
    syncWithServer
  };
};
