import { Database, Auction, Bidder, Bid, Settings } from '../types';

const STORAGE_KEY = 'auction_app_db';

const defaultSettings: Settings = {
  initialPrice: 1000,
  priceIncrement: 100,
  auctionDuration: 300, // 5 minutes in seconds
};

const defaultDatabase: Database = {
  auctions: {},
  bidders: {},
  bids: {},
  settings: defaultSettings,
};

class DatabaseService {
  private static instance: DatabaseService;
  private database: Database;

  private constructor() {
    this.database = this.loadDatabase();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private loadDatabase(): Database {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultDatabase;
  }

  private saveDatabase(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
  }

  // Auction operations
  public createAuction(auction: Omit<Auction, 'id'>): Auction {
    const id = Date.now().toString();
    const newAuction: Auction = { ...auction, id };
    this.database.auctions[id] = newAuction;
    this.database.currentAuctionId = id;
    this.saveDatabase();
    return newAuction;
  }

  public getCurrentAuction(): Auction | null {
    const id = this.database.currentAuctionId;
    return id ? this.database.auctions[id] : null;
  }

  public updateAuction(auction: Auction): void {
    this.database.auctions[auction.id] = auction;
    this.saveDatabase();
  }

  // Bidder operations
  public createBidder(bidder: Omit<Bidder, 'id'>): Bidder {
    const id = Date.now().toString();
    const newBidder: Bidder = { ...bidder, id };
    this.database.bidders[id] = newBidder;
    this.saveDatabase();
    return newBidder;
  }

  public getBidders(): Bidder[] {
    return Object.values(this.database.bidders);
  }

  public importBidders(bidders: Omit<Bidder, 'id'>[]): Bidder[] {
    const newBidders = bidders.map(bidder => this.createBidder(bidder));
    return newBidders;
  }

  // Bid operations
  public createBid(bid: Omit<Bid, 'id'>): Bid {
    const id = Date.now().toString();
    const newBid: Bid = { ...bid, id };
    this.database.bids[id] = newBid;
    this.saveDatabase();
    return newBid;
  }

  public getBids(auctionId: string): Bid[] {
    return Object.values(this.database.bids).filter(bid => bid.auctionId === auctionId);
  }

  // Settings operations
  public getSettings(): Settings {
    return this.database.settings;
  }

  public updateSettings(settings: Partial<Settings>): Settings {
    this.database.settings = { ...this.database.settings, ...settings };
    this.saveDatabase();
    return this.database.settings;
  }

  // Utility methods
  public resetDatabase(): void {
    this.database = defaultDatabase;
    this.saveDatabase();
  }
}

export const databaseService = DatabaseService.getInstance();
