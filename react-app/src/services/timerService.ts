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

// Simple Observable implementation for timer updates
type Observer = (value: number) => void;

class TimerObservable {
  private observers: Observer[] = [];
  private currentValue: number = 0;

  subscribe(observer: Observer) {
    this.observers.push(observer);
    // Immediately notify new observer of current value
    observer(this.currentValue);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        this.observers = this.observers.filter(obs => obs !== observer);
      }
    };
  }

  next(value: number) {
    this.currentValue = value;
    this.observers.forEach(observer => observer(value));
  }
}

// Create a singleton instance of the observable
const timerObservable = new TimerObservable();

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

  console.log(`timerService: Creating timer ${timerId} with duration ${duration}s`);

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

  console.log(`timerService: Starting timer ${timerId} with remaining time ${timer.remaining}ms`);

  // Clear any existing interval first to prevent duplicates
  if (timer.id) {
    clearInterval(timer.id);
    timer.id = null;
  }

  // Set initial state
  timer.startTime = Date.now();
  timer.isRunning = true;
  timer.isPaused = false;

  // Calculate the initial duration in milliseconds
  const initialDurationMs = timer.duration;

  // Calculate the initial seconds value (this should be the exact duration in seconds)
  const initialSeconds = Math.floor(initialDurationMs / 1000);

  console.log(`timerService: Initial timer value: ${initialSeconds}s, timer state:`, {
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    duration: timer.duration,
    remaining: timer.remaining
  });

  // Call onTick immediately with the starting value
  if (timer.options.onTick) {
    console.log(`timerService: Calling onTick with ${initialSeconds}s`);
    timer.options.onTick(initialSeconds);
  } else {
    console.log(`timerService: No onTick callback defined for timer ${timerId}`);
  }

  // Update the observable for subscribers
  timerObservable.next(initialSeconds);

  // Create a recursive tick function that uses setTimeout for more precise timing
  const createTickFunction = (secondsRemaining: number) => {
    if (!timer.isRunning || secondsRemaining <= 0) {
      console.log(`timerService: Skip creating tick for timer ${timerId} - running: ${timer.isRunning}, seconds: ${secondsRemaining}`);
      return;
    }

    console.log(`timerService: Setting up next tick for timer ${timerId}, seconds remaining: ${secondsRemaining}`);

    // Calculate the next tick time
    const nextTickTime = 1000;

    timer.id = setTimeout(() => {
      // Make sure the timer is still valid
      const currentTimer = timers.get(timerId);
      if (!currentTimer) {
        console.log(`timerService: Timer ${timerId} no longer exists`);
        return;
      }

      if (!currentTimer.isRunning) {
        console.log(`timerService: Timer ${timerId} is no longer running`);
        return;
      }

      // Decrement the seconds remaining
      const newSecondsRemaining = secondsRemaining - 1;

      console.log(`timerService: Timer ${timerId} tick - ${newSecondsRemaining}s remaining`);

      // Call onTick callback
      if (currentTimer.options.onTick) {
        try {
          currentTimer.options.onTick(newSecondsRemaining);
        } catch (error) {
          console.error(`timerService: Error in onTick callback for timer ${timerId}:`, error);
        }
      }

      // Update the observable for subscribers
      timerObservable.next(newSecondsRemaining);

      // Update remaining time
      currentTimer.remaining = newSecondsRemaining * 1000;

      // Check if timer has completed
      if (newSecondsRemaining <= 0) {
        console.log(`timerService: Timer ${timerId} completed`);
        currentTimer.isRunning = false;
        currentTimer.id = null;

        // Call onComplete callback
        if (currentTimer.options.onComplete) {
          try {
            currentTimer.options.onComplete();
          } catch (error) {
            console.error(`timerService: Error in onComplete callback for timer ${timerId}:`, error);
          }
        }
      } else {
        // Schedule the next tick
        createTickFunction(newSecondsRemaining);
      }
    }, nextTickTime);
  };

  // Start the ticking process
  createTickFunction(initialSeconds);

  // Update the timer in the store
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

  console.log(`timerService: Pausing timer ${timerId}`);

  // Calculate remaining time at pause
  const elapsed = Date.now() - timer.startTime;
  timer.remaining = Math.max(0, timer.duration - elapsed);

  console.log(`timerService: Timer ${timerId} paused with ${Math.floor(timer.remaining/1000)}s remaining`);

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

  console.log(`timerService: Stopping timer ${timerId}`);

  // Clear the interval
  if (timer.id) {
    clearInterval(timer.id);
    timer.id = null;
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

  console.log(`timerService: Resetting timer ${timerId}, new duration: ${duration !== undefined ? duration : 'using original'}, autoStart: ${autoStart}`);

  // Stop the current timer if running
  if (timer.isRunning && timer.id) {
    console.log(`timerService: Clearing existing interval before reset`);
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

  const resetSeconds = Math.floor(timer.duration / 1000);
  console.log(`timerService: Timer ${timerId} reset to ${resetSeconds}s, timer state:`, {
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    duration: timer.duration,
    remaining: timer.remaining
  });

  timers.set(timerId, timer);

  // Notify of reset state
  if (timer.options.onTick) {
    console.log(`timerService: Calling onTick with reset value: ${resetSeconds}s`);
    timer.options.onTick(resetSeconds);
  } else {
    console.log(`timerService: No onTick callback defined for timer ${timerId}`);
  }

  // Auto-start if requested
  if (autoStart) {
    console.log(`timerService: Auto-starting timer after reset`);
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

/**
 * Gets an observable for the timer updates
 * @returns Observable for timer updates
 */
export const getTimerObservable = () => {
  return timerObservable;
};

/**
 * Checks if a timer with the given ID exists
 * @param timerId The timer ID to check
 * @returns Boolean indicating if the timer exists
 */
export const timerExists = (timerId: string): boolean => {
  return timers.has(timerId);
};
