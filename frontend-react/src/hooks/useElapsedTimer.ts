import { useState, useEffect, useRef, useCallback } from 'react';
import * as timerService from '../services/timerService';
import { formatElapsedTime, getElapsedTime } from '../utils/timeUtils';

export interface ElapsedTimerOptions {
  startTime: number; // timestamp when the auction started
  autoStart?: boolean;
  tickInterval?: number; // in milliseconds
  onTick?: (elapsedSeconds: number) => void;
  formatTime?: boolean;
  timerId?: string;
}

export interface ElapsedTimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export interface ElapsedTimerState {
  elapsedTime: number;
  displayTime: string;
  isRunning: boolean;
  isPaused: boolean;
}

/**
 * Custom hook for tracking elapsed time since a starting timestamp
 * Uses the centralized timer service for better performance and accuracy
 */
export const useElapsedTimer = (options: ElapsedTimerOptions): [ElapsedTimerState, ElapsedTimerControls] => {
  const {
    startTime,
    autoStart = true,
    tickInterval = 1000,
    onTick,
    formatTime = true,
    timerId: providedTimerId,
  } = options;

  // State to track timer values
  const [elapsedTime, setElapsedTime] = useState<number>(getElapsedTime(startTime));
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [displayTime, setDisplayTime] = useState<string>(
    formatTime ? formatElapsedTime(getElapsedTime(startTime)) : getElapsedTime(startTime).toString()
  );

  // Use a ref to keep track of the timer ID
  const timerIdRef = useRef<string>(providedTimerId || `elapsed_timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const startTimeRef = useRef<number>(startTime);

  // Create a callback to update the timer state
  const timerCallback = useCallback((seconds: number) => {
    // For elapsed time, we need to add the timer's count to the initial elapsed time
    const totalElapsedTime = getElapsedTime(startTimeRef.current);

    setElapsedTime(totalElapsedTime);
    setDisplayTime(formatTime ? formatElapsedTime(totalElapsedTime) : totalElapsedTime.toString());

    // Forward the tick event if a callback was provided
    if (onTick) {
      onTick(totalElapsedTime);
    }
  }, [formatTime, onTick]);

  // Start the timer
  const start = useCallback(() => {
    // If there's an existing timer, stop it first
    timerService.stopTimer(timerIdRef.current);

    // Create a new timer with a very long duration (effectively infinite for elapsed time)
    timerService.createTimer(timerIdRef.current, 24 * 60 * 60, { // 24 hours
      onTick: timerCallback,
      tickInterval,
    });

    // Start the timer
    timerService.startTimer(timerIdRef.current);

    setIsRunning(true);
    setIsPaused(false);

    return true;
  }, [timerCallback, tickInterval]);

  // Pause the timer
  const pause = useCallback(() => {
    const success = timerService.pauseTimer(timerIdRef.current);

    if (success) {
      setIsRunning(false);
      setIsPaused(true);
    }

    return success;
  }, []);

  // Resume the timer
  const resume = useCallback(() => {
    if (!isPaused) return false;

    const success = timerService.startTimer(timerIdRef.current);

    if (success) {
      setIsRunning(true);
      setIsPaused(false);
    }

    return success;
  }, [isPaused]);

  // Reset the timer
  const reset = useCallback(() => {
    // Update the start time reference to now
    startTimeRef.current = Date.now();

    // Stop any existing timer
    timerService.stopTimer(timerIdRef.current);

    // Reset the elapsed time
    setElapsedTime(0);
    setDisplayTime(formatTime ? formatElapsedTime(0) : '0');

    // If it was running, start a new timer
    if (isRunning) {
      start();
    } else {
      setIsRunning(false);
      setIsPaused(false);
    }

    return true;
  }, [formatTime, isRunning, start]);

  // Initialize the timer on mount
  useEffect(() => {
    // Store the current timer ID in a local variable
    const timerId = timerIdRef.current;

    // If autoStart is true, start the timer
    if (autoStart) {
      // Create a timer with a very long duration (effectively infinite for elapsed time)
      timerService.createTimer(timerId, 24 * 60 * 60, { // 24 hours
        onTick: timerCallback,
        tickInterval,
      });

      // Start the timer
      timerService.startTimer(timerId);
      setIsRunning(true);
    }

    // Initial update
    timerCallback(0);

    // Clean up on unmount
    return () => {
      timerService.stopTimer(timerId);
    };
  }, [startTime, autoStart, tickInterval, timerCallback]);

  // Update the timer when startTime changes
  useEffect(() => {
    startTimeRef.current = startTime;

    // Immediate update
    const totalElapsedTime = getElapsedTime(startTime);
    setElapsedTime(totalElapsedTime);
    setDisplayTime(formatTime ? formatElapsedTime(totalElapsedTime) : totalElapsedTime.toString());
  }, [startTime, formatTime]);

  // Create the timer controls object
  const timerControls: ElapsedTimerControls = {
    start,
    pause,
    resume,
    reset,
  };

  // Create the timer state object
  const timerState: ElapsedTimerState = {
    elapsedTime,
    displayTime,
    isRunning,
    isPaused,
  };

  return [timerState, timerControls];
};
