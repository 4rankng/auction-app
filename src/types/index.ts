export interface Bidder {
  id: string;
  name: string;
  nric: string;
  issuingAuthority: string;
  address: string;
  phone?: string;
  email?: string;
}



export type AuctionStatus = 'SETUP' | 'IN_PROGRESS' | 'ENDED';


export interface Auction {
  id: string;
  title: string;
  description: string;
  status: AuctionStatus;
  currentPrice: number;
  result: AuctionResult;
  settings: AuctionSettings;
  bidders: Record<string, Bidder>;
  bids: Record<string, Bid>;
  auctionRound: number;
  startTime?: number;
  endTime?: number;
}


export interface AuctionResult {
  startTime: number;
  endTime: number;
  startingPrice: number;
  finalPrice: number;
  duration: number;
  winnerId: string;
  winnerName: string;
  totalBids: number;
}




export interface Bid {
  id: string;
  bidderId: string;
  amount: number;
  timestamp: number;
}

export interface AuctionSettings {
  bidStep: number;
  startingPrice: number;
  bidDuration: number;
  auctioneer: string;
  auctioneerId?: string;
  bidRound?: string;
}


export interface UISettings {
  theme: string;
  language: string;
  locale: string;
}

export interface Database {
  auctions: Record<string, Auction>;
  settings: UISettings;
  auctioneers?: Auctioneer[];
}

export interface AuctionFormData {
  title: string;
  description: string;
  startingPrice: number;
  bidStep: number;
  bidDuration: number;
  auctioneer: string;
}

export interface BidderFormData {
  bidderID: string;
  name: string;
  nirc: string;
  issuingAuthority: string;
  address: string;
}

export interface BidFormData {
  bidderId: string;
  amount: number;
}

export interface AuctionFilter {
  status?: AuctionStatus;
  auctioneer?: string;
}

export interface Auctioneer {
  id: string;
  name: string;
  createdAt?: number;
  updatedAt?: number;
}
