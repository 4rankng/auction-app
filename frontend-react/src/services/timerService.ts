/**
 * Timer Service
 * Provides a centralized way to create, manage, and synchronize timers
 */

// Timer callback type
export type TimerCallback = (remainingTime: number) => void;

// Timer options type
export interface TimerOptions {
  onTick?: TimerCallback;
  onComplete?: () => void;
  tickInterval?: number; // in milliseconds
}

// Timer storage to track active timers
const timers = new Map<string, {
  id: NodeJS.Timeout | null;
  startTime: number;
  duration: number;
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  options: TimerOptions;
}>();

/**
 * Creates a new timer
 * @param timerId Unique identifier for the timer
 * @param duration Duration in seconds
 * @param options Timer configuration options
 * @returns The timer ID
 */
export const createTimer = (
  timerId: string,
  duration: number,
  options: TimerOptions = {}
): string => {
  // Clean up existing timer with the same ID
  if (timers.has(timerId)) {
    stopTimer(timerId);
  }

  // Store timer details
  timers.set(timerId, {
    id: null,
    startTime: Date.now(),
    duration: duration * 1000, // Convert to milliseconds
    remaining: duration * 1000,
    isRunning: false,
    isPaused: false,
    options: {
      onTick: options.onTick || (() => {}),
      onComplete: options.onComplete || (() => {}),
      tickInterval: options.tickInterval || 1000,
    }
  });

  // Immediately notify of initial state
  if (options.onTick) {
    options.onTick(duration);
  }

  return timerId;
};

/**
 * Starts a timer
 * @param timerId The timer ID to start
 * @param autoStart Whether to automatically start the timer
 * @returns Boolean indicating success
 */
export const startTimer = (timerId: string, autoStart = false): boolean => {
  const timer = timers.get(timerId);

  if (!timer) {
    console.warn(`Timer with ID ${timerId} not found`);
    return false;
  }

  if (timer.isRunning) {
    console.warn(`Timer with ID ${timerId} is already running`);
    return false;
  }

  if (timer.remaining <= 0) {
    console.warn(`Timer with ID ${timerId} has already completed`);
    return false;
  }

  // Update start time based on remaining time
  timer.startTime = Date.now() - (timer.duration - timer.remaining);
  timer.isRunning = true;
  timer.isPaused = false;

  // Start the interval
  const intervalId = setInterval(() => {
    const currentTimer = timers.get(timerId);
    if (!currentTimer || !currentTimer.isRunning) {
      clearInterval(intervalId);
      return;
    }

    // Calculate remaining time
    const elapsed = Date.now() - currentTimer.startTime;
    const remaining = Math.max(0, currentTimer.duration - elapsed);
    currentTimer.remaining = remaining;

    // Convert to seconds and round down
    const remainingSeconds = Math.floor(remaining / 1000);

    // Call onTick callback
    if (currentTimer.options.onTick) {
      currentTimer.options.onTick(remainingSeconds);
    }

    // Check if timer has completed
    if (remaining <= 0) {
      clearInterval(intervalId);
      currentTimer.isRunning = false;
      currentTimer.id = null;

      // Call onComplete callback
      if (currentTimer.options.onComplete) {
        currentTimer.options.onComplete();
      }
    }
  }, timer.options.tickInterval);

  // Store the interval ID
  timer.id = intervalId;
  timers.set(timerId, timer);

  return true;
};

/**
 * Pauses a running timer
 * @param timerId The timer ID to pause
 * @returns Boolean indicating success
 */
export const pauseTimer = (timerId: string): boolean => {
  const timer = timers.get(timerId);

  if (!timer) {
    console.warn(`Timer with ID ${timerId} not found`);
    return false;
  }

  if (!timer.isRunning) {
    console.warn(`Timer with ID ${timerId} is not running`);
    return false;
  }

  // Calculate remaining time at pause
  const elapsed = Date.now() - timer.startTime;
  timer.remaining = Math.max(0, timer.duration - elapsed);

  // Clear the interval
  if (timer.id) {
    clearInterval(timer.id);
    timer.id = null;
  }

  timer.isRunning = false;
  timer.isPaused = true;
  timers.set(timerId, timer);

  return true;
};

/**
 * Stops and removes a timer
 * @param timerId The timer ID to stop
 * @returns Boolean indicating success
 */
export const stopTimer = (timerId: string): boolean => {
  const timer = timers.get(timerId);

  if (!timer) {
    return false;
  }

  // Clear the interval
  if (timer.id) {
    clearInterval(timer.id);
  }

  // Remove the timer
  timers.delete(timerId);

  return true;
};

/**
 * Resets a timer to a new duration
 * @param timerId The timer ID to reset
 * @param duration New duration in seconds (optional, defaults to original duration)
 * @param autoStart Whether to automatically start the timer after reset
 * @returns Boolean indicating success
 */
export const resetTimer = (timerId: string, duration?: number, autoStart = false): boolean => {
  const timer = timers.get(timerId);

  if (!timer) {
    console.warn(`Timer with ID ${timerId} not found`);
    return false;
  }

  // Stop the current timer if running
  if (timer.isRunning && timer.id) {
    clearInterval(timer.id);
    timer.id = null;
  }

  // If duration is provided, update it
  if (duration !== undefined) {
    timer.duration = duration * 1000; // Convert to milliseconds
  }

  // Reset timer state
  timer.remaining = timer.duration;
  timer.startTime = Date.now();
  timer.isRunning = false;
  timer.isPaused = false;
  timers.set(timerId, timer);

  // Notify of reset state
  if (timer.options.onTick) {
    timer.options.onTick(Math.floor(timer.duration / 1000));
  }

  // Auto-start if requested
  if (autoStart) {
    return startTimer(timerId);
  }

  return true;
};

/**
 * Gets the remaining time for a timer
 * @param timerId The timer ID to check
 * @returns Remaining time in seconds, or -1 if timer not found
 */
export const getRemainingTime = (timerId: string): number => {
  const timer = timers.get(timerId);

  if (!timer) {
    return -1;
  }

  if (timer.isRunning) {
    // Calculate current remaining time
    const elapsed = Date.now() - timer.startTime;
    const remaining = Math.max(0, timer.duration - elapsed);
    return Math.floor(remaining / 1000);
  }

  // Return stored remaining time
  return Math.floor(timer.remaining / 1000);
};

/**
 * Checks if a timer is running
 * @param timerId The timer ID to check
 * @returns Boolean indicating if timer is running
 */
export const isTimerRunning = (timerId: string): boolean => {
  const timer = timers.get(timerId);
  return timer ? timer.isRunning : false;
};

/**
 * Checks if a timer is paused
 * @param timerId The timer ID to check
 * @returns Boolean indicating if timer is paused
 */
export const isTimerPaused = (timerId: string): boolean => {
  const timer = timers.get(timerId);
  return timer ? timer.isPaused : false;
};

/**
 * Checks if a timer has completed
 * @param timerId The timer ID to check
 * @returns Boolean indicating if timer has completed
 */
export const isTimerCompleted = (timerId: string): boolean => {
  const timer = timers.get(timerId);
  if (!timer) {
    return false;
  }

  if (timer.isRunning) {
    const elapsed = Date.now() - timer.startTime;
    return elapsed >= timer.duration;
  }

  return timer.remaining <= 0;
};

/**
 * Gets all active timer IDs
 * @returns Array of timer IDs
 */
export const getAllTimerIds = (): string[] => {
  return Array.from(timers.keys());
};

/**
 * Clears all active timers
 */
export const clearAllTimers = (): void => {
  getAllTimerIds().forEach(stopTimer);
};

/**
 * Syncs a timer with server time to ensure accuracy
 * @param timerId The timer ID to sync
 * @param serverEndTime The server's end time in timestamp
 * @returns Boolean indicating success
 */
export const syncTimerWithServer = (timerId: string, serverEndTime: number): boolean => {
  const timer = timers.get(timerId);

  if (!timer) {
    return false;
  }

  // Calculate new remaining time based on server end time
  const remaining = Math.max(0, serverEndTime - Date.now());
  const wasRunning = timer.isRunning;

  // Stop the current timer if running
  if (timer.isRunning && timer.id) {
    clearInterval(timer.id);
    timer.id = null;
    timer.isRunning = false;
  }

  // Update timer values
  timer.duration = remaining;
  timer.remaining = remaining;
  timer.startTime = Date.now();

  // Notify of updated state
  if (timer.options.onTick) {
    timer.options.onTick(Math.floor(remaining / 1000));
  }

  // Restart if it was running
  if (wasRunning && remaining > 0) {
    return startTimer(timerId);
  }

  // If no time remaining, trigger completion
  if (remaining <= 0 && timer.options.onComplete) {
    timer.options.onComplete();
  }

  return true;
};
