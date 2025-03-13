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
    if (!auction) throw new Error('Auction not found');

    const bidder = this.database.bidders[bidderId];
    if (!bidder) throw new Error('Bidder not found');

    const id = Date.now().toString();
    const newBid: Bid = {
      id,
      auctionId,
      bidderId,
      bidderName: bidder.name,
      amount,
      timestamp: Date.now(),
      round: Object.values(this.database.bids).filter(b => b.auctionId === auctionId).length + 1,
    };

    this.database.bids[id] = newBid;
    auction.currentPrice = amount;
    this.saveDatabase();
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

