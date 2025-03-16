import { useState, useEffect, useRef, useCallback } from 'react';
import * as timerService from '@services/timerService';

interface UseBidderTimerProps {
  initialTime: number;
}

export const useBidderTimer = ({ initialTime }: UseBidderTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Generate a unique timer ID for this instance
  const timerIdRef = useRef<string>(`bidder_timer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Track actual interval for direct countdown
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer tick - use a direct approach rather than timerService for more consistent updates
  const tick = useCallback(() => {
    setTimeLeft(prevTime => {
      const newTime = Math.max(0, prevTime - 1);

      // If time is up, stop the interval
      if (newTime === 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
      }

      return newTime;
    });
  }, []);

  // Initialize timer on mount
  useEffect(() => {
    // Store the current timer ID in a local variable to avoid
    // the ref value changing before the cleanup function runs
    const timerId = timerIdRef.current;

    // Create the timer in the service for tracking purposes only
    // but we won't use its tick callback
    timerService.createTimer(timerId, initialTime, {
      onComplete: () => {
        setIsRunning(false);
      },
      tickInterval: 1000
    });

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timerService.stopTimer(timerId);
    };
  }, [initialTime]);

  // Start the timer
  const startTimer = useCallback(() => {
    // First clear any existing interval to prevent duplicates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Start a direct interval for consistent UI updates
    intervalRef.current = setInterval(tick, 1000);

    // Update the timer service state but don't rely on its ticking
    timerService.startTimer(timerIdRef.current);

    setIsRunning(true);
  }, [tick]);

  // Stop the timer
  const stopTimer = useCallback(() => {
    // Clear the direct interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Also notify the timer service
    timerService.pauseTimer(timerIdRef.current);

    setIsRunning(false);
  }, []);

  // Reset the timer
  const resetTimer = useCallback((newTime = initialTime) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Update state immediately
    setTimeLeft(newTime);
    setIsRunning(false);

    // Also notify the timer service
    timerService.resetTimer(timerIdRef.current, newTime, false);
  }, [initialTime]);

  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer
  };
};
