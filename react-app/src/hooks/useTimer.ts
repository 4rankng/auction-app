import { useState, useEffect, useRef, useCallback } from 'react';
import * as timerService from '../services/timerService';
import { formatCountdown } from '../utils/timeUtils';

export interface TimerOptions {
  initialTime: number; // in seconds
  autoStart?: boolean;
  tickInterval?: number; // in milliseconds
  onTick?: (timeLeft: number) => void;
  onComplete?: () => void;
  formatTime?: boolean;
  timerId?: string;
}

export interface TimerControls {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newDuration?: number, autoStart?: boolean) => void;
  setDuration: (newDuration: number) => void;
  syncWithServerTime: (serverEndTime: number) => void;
}

export interface TimerState {
  timeLeft: number;
  displayTime: string;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

/**
 * Custom hook for managing countdown timers
 * Uses the centralized timer service for better performance and accuracy
 */
export const useTimer = (options: TimerOptions): [TimerState, TimerControls] => {
  const {
    initialTime,
    autoStart = false,
    tickInterval = 1000,
    onTick,
    onComplete,
    formatTime = true,
    timerId: providedTimerId,
  } = options;

  // State to track timer values
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [displayTime, setDisplayTime] = useState<string>(
    formatTime ? formatCountdown(initialTime) : initialTime.toString()
  );

  // Use a ref to keep track of the timer ID
  const timerIdRef = useRef<string>(providedTimerId || `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Create a callback to update the timer state
  const timerCallback = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    setDisplayTime(formatTime ? formatCountdown(seconds) : seconds.toString());

    // Forward the tick event if a callback was provided
    if (onTick) {
      onTick(seconds);
    }

    // Check if timer has completed
    if (seconds <= 0) {
      setIsRunning(false);
      setIsCompleted(true);
    }
  }, [formatTime, onTick]);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    setIsRunning(false);
    setIsCompleted(true);

    // Forward the completion event if a callback was provided
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Start the timer
  const start = useCallback(() => {
    if (isCompleted) {
      // If timer is completed, we need to reset it first
      timerService.resetTimer(timerIdRef.current, initialTime);
      setIsCompleted(false);
    }

    // Start the timer service
    const success = timerService.startTimer(timerIdRef.current);

    if (success) {
      setIsRunning(true);
      setIsPaused(false);
    }

    return success;
  }, [initialTime, isCompleted]);

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
  const reset = useCallback((newDuration?: number, autoStart = false) => {
    const success = timerService.resetTimer(timerIdRef.current, newDuration !== undefined ? newDuration : initialTime, autoStart);

    if (success) {
      setTimeLeft(newDuration !== undefined ? newDuration : initialTime);
      setDisplayTime(formatTime ? formatCountdown(newDuration !== undefined ? newDuration : initialTime) : (newDuration !== undefined ? newDuration : initialTime).toString());
      setIsRunning(autoStart);
      setIsPaused(false);
      setIsCompleted(false);
    }

    return success;
  }, [initialTime, formatTime]);

  // Set a new duration for the timer
  const setDuration = useCallback((newDuration: number) => {
    reset(newDuration, isRunning);
  }, [isRunning, reset]);

  // Sync timer with server time
  const syncWithServerTime = useCallback((serverEndTime: number) => {
    const remaining = Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
    const success = timerService.syncTimerWithServer(timerIdRef.current, serverEndTime);

    if (success) {
      setTimeLeft(remaining);
      setDisplayTime(formatTime ? formatCountdown(remaining) : remaining.toString());
      setIsCompleted(remaining <= 0);
      setIsRunning(remaining > 0 && timerService.isTimerRunning(timerIdRef.current));
      setIsPaused(timerService.isTimerPaused(timerIdRef.current));
    }

    return success;
  }, [formatTime]);

  // Initialize the timer on mount
  useEffect(() => {
    // Store ref value in a variable to prevent issues in cleanup
    const timerId = timerIdRef.current;

    // Create the timer using our service
    timerService.createTimer(timerId, initialTime, {
      onTick: timerCallback,
      onComplete: handleComplete,
      tickInterval,
    });

    // Automatically start if requested
    if (autoStart) {
      timerService.startTimer(timerId);
      setIsRunning(true);
    }

    // Clean up on unmount
    return () => {
      timerService.stopTimer(timerId);
    };
  }, [initialTime, autoStart, tickInterval, timerCallback, handleComplete]);

  // Create the timer controls object
  const timerControls: TimerControls = {
    start,
    pause,
    resume,
    reset,
    setDuration,
    syncWithServerTime,
  };

  // Create the timer state object
  const timerState: TimerState = {
    timeLeft,
    displayTime,
    isRunning,
    isPaused,
    isCompleted,
  };

  return [timerState, timerControls];
};
