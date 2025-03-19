/**
 * Format a timestamp to a readable date string
 * @param timestamp The timestamp to format
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp?: number): string => {
  if (timestamp === undefined || timestamp === null) {
    return new Date().toLocaleString('vi-VN');
  }
  return new Date(timestamp).toLocaleString('vi-VN');
};

/**
 * Format a number to a currency string
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) {
    return "0 VND";
  }
  return `${amount.toLocaleString('vi-VN')} VND`;
};

/**
 * Parse a currency string to a number
 * @param currencyString The currency string to parse
 * @returns Parsed numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  return parseInt(currencyString.replace(/\D/g, '')) || 0;
};

/**
 * Format elapsed time in seconds to HH:MM:SS format
 * @param seconds The elapsed time in seconds
 * @returns Formatted time string
 */
export const formatElapsedTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};
