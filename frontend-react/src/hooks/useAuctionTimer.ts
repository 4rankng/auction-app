import { useState, useEffect, useRef } from 'react';

interface UseAuctionTimerProps {
  endTime: number | undefined;
  currentRound: number;
  onTimerEnd: () => void;
  onFinalRoundEnd: () => void;
}

export const useAuctionTimer = ({
  endTime,
  currentRound,
  onTimerEnd,
  onFinalRoundEnd
}: UseAuctionTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00');
  const [isTimerEnded, setIsTimerEnded] = useState<boolean>(false);
  const timerEndMessageShownRef = useRef<boolean>(false);

  // Store callback references to prevent unnecessary re-renders
  const onTimerEndRef = useRef(onTimerEnd);
  const onFinalRoundEndRef = useRef(onFinalRoundEnd);

  // Update refs when callbacks change
  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
    onFinalRoundEndRef.current = onFinalRoundEnd;
  }, [onTimerEnd, onFinalRoundEnd]);

  // Add these changes to prevent infinite loops
  useEffect(() => {
    if (!endTime) return;

    // Reset flags when dependencies change
    timerEndMessageShownRef.current = false;
    setIsTimerEnded(false);

    let timer: NodeJS.Timeout;

    // Move timer logic outside to prevent stale closures
    const checkTimer = () => {
      const now = Date.now();
      const timeLeftMs = endTime - now;

      if (timeLeftMs > 0) {
        // Update display logic
        const minutes = Math.floor(timeLeftMs / 60000);
        const seconds = Math.floor((timeLeftMs % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setIsTimerEnded(false);
      } else {
        // Clean up immediately
        clearInterval(timer);
        setTimeLeft('00:00');
        setIsTimerEnded(true);

        if (!timerEndMessageShownRef.current) {
          timerEndMessageShownRef.current = true;
          console.log(`Timer ended for round ${currentRound}`);

          // Use setTimeout to break synchronous update chain
          setTimeout(() => {
            if (currentRound >= 6) {
              onFinalRoundEndRef.current();
            } else {
              console.log(`Round ${currentRound} ended. Waiting next round`);
              onTimerEndRef.current();
            }
          }, 0);
        }
      }
    };

    timer = setInterval(checkTimer, 1000);
    checkTimer(); // Initial check

    return () => {
      clearInterval(timer);
      timerEndMessageShownRef.current = false;
    };
  }, [endTime, currentRound]); // We use refs for callbacks, so they don't need to be dependencies

  const resetTimer = () => {
    timerEndMessageShownRef.current = false;
    setIsTimerEnded(false);
  };

  return {
    timeLeft,
    isTimerEnded,
    resetTimer
  };
};
