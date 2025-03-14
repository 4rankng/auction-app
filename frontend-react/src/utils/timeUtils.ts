/**
 * Time utility functions for formatting and handling time values
 */

/**
 * Formats a number of seconds into a countdown display (MM:SS)
 * @param seconds Number of seconds to format
 * @returns Formatted string in MM:SS format
 */
export const formatCountdown = (seconds: number): string => {
  if (seconds < 0) seconds = 0;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

/**
 * Formats a number of seconds into a countdown display (HH:MM:SS)
 * @param seconds Number of seconds to format
 * @returns Formatted string in HH:MM:SS format
 */
export const formatElapsedTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

/**
 * Formats a number of seconds into hours, minutes, and seconds
 * @param seconds Number of seconds to format
 * @returns Formatted string in HH:MM:SS format
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

/**
 * Formats a timestamp to a readable date string
 * @param timestamp Timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('vi-VN');
};

/**
 * Calculates the time difference between two timestamps in seconds
 * @param start Start timestamp in milliseconds
 * @param end End timestamp in milliseconds
 * @returns Time difference in seconds
 */
export const getTimeDifference = (start: number, end: number): number => {
  return Math.floor((end - start) / 1000);
};

/**
 * Calculates the elapsed time since a specific timestamp
 * @param startTime Start timestamp in milliseconds
 * @returns Elapsed time in seconds
 */
export const getElapsedTime = (startTime: number): number => {
  return Math.floor((Date.now() - startTime) / 1000);
};

/**
 * Calculates the remaining time until a specific timestamp
 * @param endTime End timestamp in milliseconds
 * @returns Remaining time in seconds
 */
export const getRemainingTime = (endTime: number): number => {
  return Math.max(0, Math.floor((endTime - Date.now()) / 1000));
};

/**
 * Formats seconds to a human-readable duration
 * e.g. "2 hours 30 minutes 15 seconds"
 * @param seconds Number of seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 0) seconds = 0;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ');
};
