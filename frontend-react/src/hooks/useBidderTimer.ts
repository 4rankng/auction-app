import { useState, useEffect, useRef, useCallback } from 'react';

interface UseBidderTimerProps {
  initialTime: number;
}

export const useBidderTimer = ({ initialTime }: UseBidderTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const startTimer = useCallback(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset time and start new timer
    setTimeLeft(initialTime);
    isRunningRef.current = true;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Stop timer when it reaches 0
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            isRunningRef.current = false;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialTime]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      isRunningRef.current = false;
    }
  }, []);

  const resetTimer = useCallback((newTime = initialTime) => {
    stopTimer();
    setTimeLeft(newTime);
  }, [initialTime, stopTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    timeLeft,
    isRunning: isRunningRef.current,
    startTimer,
    stopTimer,
    resetTimer
  };
};
