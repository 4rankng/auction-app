// Auction status constants
export const AUCTION_STATUS = {
  SETUP: 'SETUP',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ENDED: 'ENDED'
} as const;

// Define auction status type from constants
export type AuctionStatus = typeof AUCTION_STATUS[keyof typeof AUCTION_STATUS];

// Toast constants
export const TOAST_POSITION = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  TOP_CENTER: 'top-center',
  BOTTOM_CENTER: 'bottom-center'
} as const;

// Define toast position type from constants
export type ToastPosition = typeof TOAST_POSITION[keyof typeof TOAST_POSITION];

// Other common constants
export const DEFAULT_BID_DURATION = 60; // Default bid duration in seconds
export const DEFAULT_BID_STEP = 10000000; // Default bid step in VND
export const DEFAULT_STARTING_PRICE = 1000000000; // Default starting price in VND
export const DEFAULT_TOAST_DURATION = 2000; // Default toast duration in milliseconds

export const DEFAULT_AUCTION_TITLE = 'Phiên đấu giá mới' // Default auction title
export const DEFAULT_AUCTION_DESCRIPTION = 'Mô tả chi tiết về phiên đấu giá' // Default auction description

