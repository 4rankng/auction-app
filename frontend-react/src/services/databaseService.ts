import { Database, Auction, Bidder, Bid } from '../types';

const STORAGE_KEY = 'auction_app_db';

export class DatabaseService {
  private database: Database;

  constructor() {
    this.database = this.loadDatabase();
  }

  private loadDatabase(): Database {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  return {
    auctions: {},
    bidders: {},
    bids: {},
    settings: {
        initialPrice: 1000,
        priceIncrement: 100,
        auctionDuration: 300,
      },
    };
  }

  private saveDatabase() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
  }

  public getDatabase(): Database {
    return this.database;
  }

  public async createAuction(auctionData: Omit<Auction, 'id'>): Promise<Auction> {
    const id = Date.now().toString();
    const newAuction: Auction = { ...auctionData, id };
    this.database.auctions[id] = newAuction;
    this.saveDatabase();
    return newAuction;
  }

  public async updateAuction(auction: Auction): Promise<void> {
    this.database.auctions[auction.id] = auction;
    this.saveDatabase();
  }

  public async createBidder(bidderData: Omit<Bidder, 'id'> & { id?: string }): Promise<Bidder> {
    const id = bidderData.id || this.getNextBidderId();

    // Check if ID already exists
    if (this.database.bidders[id]) {
      throw new Error(`Bidder with ID ${id} already exists`);
    }

    const newBidder: Bidder = { ...bidderData, id };
    this.database.bidders[id] = newBidder;
    this.saveDatabase();
    return newBidder;
  }

  public async createBid(auctionId: string, bidderId: string, amount: number): Promise<Bid> {
    const auction = this.database.auctions[auctionId];
    if (!auction) throw new Error('Phiên đấu giá không tồn tại');

    const bidder = this.database.bidders[bidderId];
    if (!bidder) throw new Error('Người đấu giá không tồn tại');

    // Validate the bid amount
    if (amount <= auction.currentPrice) {
      throw new Error(`Giá trả phải lớn hơn giá hiện tại (${auction.currentPrice.toLocaleString('vi-VN')} VND)`);
    }

    if (amount < auction.currentPrice + auction.bidStep) {
      throw new Error(`Giá trả phải cao hơn giá hiện tại ít nhất ${auction.bidStep.toLocaleString('vi-VN')} VND`);
    }

    // Get all bids for this auction
    const auctionBids = Object.values(this.database.bids).filter(b => b.auctionId === auctionId);

    // Determine the current round based on existing bids or the auction's currentRound property
    const currentRound = auction.currentRound || (auctionBids.length > 0
      ? Math.max(...auctionBids.map(bid => bid.round))
      : 1);

    const id = Date.now().toString();
    const newBid: Bid = {
      id,
      auctionId,
      bidderId,
      bidderName: bidder.name,
      amount,
      timestamp: Date.now(),
      round: currentRound,
    };

    // Add the bid to the database
    this.database.bids[id] = newBid;

    // Update the auction's current price
    auction.currentPrice = amount;

    // Save changes to localStorage
    this.saveDatabase();

    // More detailed logging
    console.log(`Bid created: ID=${id}, bidder=${bidder.name}, amount=${amount.toLocaleString('vi-VN')} VND, round=${currentRound}`);
    console.log(`Updated auction ${auctionId} current price to ${amount.toLocaleString('vi-VN')} VND`);
    console.log(`Total bids for auction ${auctionId}: ${Object.values(this.database.bids).filter(b => b.auctionId === auctionId).length}`);

    return newBid;
  }

  private getNextBidderId(): string {
    const bidders = Object.values(this.database.bidders);
    if (bidders.length === 0) return '1';
    const maxId = Math.max(...bidders.map(bidder => parseInt(bidder.id) || 0));
    return (maxId + 1).toString();
  }

  public resetDatabase(): void {
    this.database = {
      auctions: {},
      bidders: {},
      bids: {},
      settings: {
        initialPrice: 1000,
        priceIncrement: 100,
        auctionDuration: 300,
      },
    };
    this.saveDatabase();
  }

  async clearBidders(): Promise<void> {
    try {
      this.database.bidders = {};
      this.saveDatabase();
    } catch (error) {
      console.error('Error clearing bidders:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();

