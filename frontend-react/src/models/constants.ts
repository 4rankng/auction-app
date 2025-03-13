// Auction status constants
export const AUCTION_STATUS = {
  SETUP: 'setup' as const,
  IN_PROGRESS: 'inProgress' as const,
  ENDED: 'ended' as const
};

export type AuctionStatus = typeof AUCTION_STATUS[keyof typeof AUCTION_STATUS];

// Default settings
export const DEFAULT_SETTINGS = {
  INITIAL_PRICE: 1000000, // 1M VND
  PRICE_INCREMENT: 100000, // 100K VND
  AUCTION_DURATION: 300 // 5 minutes in seconds
};

// LocalStorage keys
export const STORAGE_KEYS = {
  DATABASE: 'auction_app_database',
  CURRENT_AUCTION: 'auction_app_current_auction',
  SETTINGS: 'auction_app_settings'
};

// Routes
export const ROUTES = {
  HOME: '/',
  SETUP: '/setup',
  BID: '/bid',
  RESULT: '/result',
  RESULTS: '/results'
};

// Toast delay in milliseconds
export const TOAST_DELAY = 3000;
