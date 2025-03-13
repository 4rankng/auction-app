// Bidder model
export interface Bidder {
  id: string;
  name: string;
  idNumber: string;
  issuingAuthority: string;
  address: string;
  avatar?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
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
  status: typeof AUCTION_STATUS[keyof typeof AUCTION_STATUS];
  startingPrice: number;
  currentPrice: number;
  bidStep: number;
  auctionItem: string;
  auctioneer: string;
  winner?: string;
  timeLeft?: number;
  startTime?: string;
  endTime?: string;
  createdAt: Date;
  updatedAt: Date;
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
