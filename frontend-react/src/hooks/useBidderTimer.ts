import { useState, useEffect, useRef, useCallback } from 'react';
import * as timerService from '../services/timerService';

interface UseBidderTimerProps {
  initialTime: number;
}

export const useBidderTimer = ({ initialTime }: UseBidderTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerIdRef = useRef<string>(`bidder_timer_${Date.now()}`);

  // Handle timer tick
  const handleTick = useCallback((seconds: number) => {
    setTimeLeft(seconds);
  }, []);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    setTimeLeft(0);
    setIsRunning(false);
  }, []);

  // Initialize timer on mount
  useEffect(() => {
    // Store the current timer ID in a local variable to avoid
    // the ref value changing before the cleanup function runs
    const timerId = timerIdRef.current;

    // Create the timer
    timerService.createTimer(timerId, initialTime, {
      onTick: handleTick,
      onComplete: handleComplete,
      tickInterval: 1000
    });

    // Clean up on unmount
    return () => {
      timerService.stopTimer(timerId);
    };
  }, [initialTime, handleTick, handleComplete]);

  const startTimer = useCallback(() => {
    // Reset the timer to initial time and start it
    timerService.resetTimer(timerIdRef.current, initialTime, true);
    setIsRunning(true);
  }, [initialTime]);

  const stopTimer = useCallback(() => {
    timerService.pauseTimer(timerIdRef.current);
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback((newTime = initialTime) => {
    timerService.resetTimer(timerIdRef.current, newTime, false);
    setTimeLeft(newTime);
    setIsRunning(false);
  }, [initialTime]);

  return {
    timeLeft,
    isRunning,
    startTimer,
    stopTimer,
    resetTimer
  };
};
