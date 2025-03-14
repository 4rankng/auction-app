export interface Bidder {
  id: string;
  name: string;
  idNumber: string;
  issuingAuthority: string;
  address: string;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  status: 'SETUP' | 'IN_PROGRESS' | 'ENDED';
  startingPrice: number;
  currentPrice: number;
  bidStep: number;
  auctionItem: string;
  auctioneer: string;
  winner?: {
    id: string;
    name: string;
    finalBid: number;
  };
  timeLeft?: number;
  startTime?: number;
  endTime?: number;
  finalPrice?: number;
}

export interface AuctionResult {
  auctionId: string;
  endTime: number;
  startingPrice: number;
  finalPrice: number;
  winner: {
    id: string;
    name: string;
    finalBid: number;
  };
  totalBids: number;
  status: 'SUCCESS' | 'NO_BIDS';
}

export interface Settings {
  initialPrice: number;
  priceIncrement: number;
  auctionDuration: number;
}

export interface Database {
  auctions: Record<string, Auction>;
  bidders: Record<string, Bidder>;
  bids: Record<string, Bid>;
  settings: Settings;
  currentAuctionId?: string;
}
