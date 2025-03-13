// Bidder model
export interface Bidder {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

// Bid model
export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: string;
  round: number;
}

import { AuctionStatus, AUCTION_STATUS } from './constants';

// Auction model
export interface Auction {
  id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  startingPrice: number;
  currentPrice: number;
  priceStep: number;
  startTime?: string;
  endTime?: string;
  timeLeft?: number;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
}

// Auction result model
export interface AuctionResult {
  auctionId: string;
  status: typeof AUCTION_STATUS.ENDED;
  startTime: string;
  endTime: string;
  startingPrice: number;
  finalPrice: number;
  winner?: Bidder;
  bidHistory: Bid[];
  totalBids: number;
  totalBidders: number;
}

// Settings model
export interface Settings {
  initialPrice: number;
  priceIncrement: number;
  auctionDuration: number; // in seconds
}

// Database model
export interface Database {
  auctions: Record<string, Auction>;
  bidders: Record<string, Bidder>;
  bids: Record<string, Bid[]>;
  settings: Settings;
  currentAuctionId?: string;
}
