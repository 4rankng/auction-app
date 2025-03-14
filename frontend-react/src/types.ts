export interface Bidder {
  id: string;
  name: string;
  nric: string;
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
  round: number;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  status: 'SETUP' | 'IN_PROGRESS' | 'ENDED';
  startingPrice: number;
  currentPrice: number;
  bidStep: number;
  timeLeft: number;
  auctionItem: string;
  auctioneer: string;
  startTime: number;
  endTime?: number;
  finalPrice?: number;
  currentRound?: number;
  winner?: {
    id: string;
    name: string;
    finalBid: number;
  };
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
