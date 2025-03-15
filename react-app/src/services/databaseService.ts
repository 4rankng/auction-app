import {
  Database,
  Auction,
  Bidder,
  Bid,
  AuctionSettings,
  UISettings,
  AuctionStatus,
  AuctionResult
} from '../types';

const STORAGE_KEY = 'auction_app_db';

// Auction status constants
const AUCTION_STATUS = {
  SETUP: 'SETUP' as AuctionStatus,
  IN_PROGRESS: 'IN_PROGRESS' as AuctionStatus,
  ENDED: 'ENDED' as AuctionStatus,
  COMPLETED: 'COMPLETED' as AuctionStatus
};

// Default UI settings to use throughout the application
const defaultUISettings: UISettings = {
  theme: 'light',
  language: 'vi',
  locale: 'vi-VN'
};

// Function to create default auction result
// Using fixed values to simplify logic, specific values can be updated after creation
const getDefaultAuctionResult = (): AuctionResult => ({
  startTime: Date.now(),
  endTime: 0,
  startingPrice: 0,
  finalPrice: 0,
  duration: 0,
  winnerId: '',
  winnerName: '',
  totalBids: 0
});

export class DatabaseService {
  // Use type assertion to handle the database type
  private database: any;

  constructor() {
    this.database = this.loadDatabase();
  }

  private loadDatabase(): any {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing database from localStorage:', e);
      }
    }

    // Initialize empty database with correct structure based on the Database type
    return {
      auctions: {},
      settings: defaultUISettings
    };
  }

  private saveDatabase() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
  }

  public getDatabase(): Database {
    return this.database as Database;
  }

  // ===== AUCTION CRUD OPERATIONS =====

  /**
   * Get all auctions
   */
  public async getAuctions(): Promise<Auction[]> {
    return Object.values(this.database.auctions);
  }

  /**
   * Get a specific auction by ID
   */
  public async getAuctionById(auctionId: string): Promise<Auction | null> {
    const auction = this.database.auctions[auctionId];
    return auction || null;
  }

  /**
   * Create a new auction
   */
  public async createAuction(title: string, description: string, settings: AuctionSettings): Promise<Auction> {
    const id = Date.now().toString();

    // Create a new auction with empty bidders and bids collections
    const newAuction = {
      id,
      title,
      description,
      status: AUCTION_STATUS.SETUP,
      currentPrice: settings.startingPrice,
      settings,
      bidders: {},  // Empty record for bidders
      bids: {},     // Empty record for bids
      startTime: Date.now(),
      result: getDefaultAuctionResult()
    } as Auction;

    this.database.auctions[id] = newAuction;
    this.saveDatabase();
    return newAuction;
  }

  /**
   * Update an existing auction
   */
  public async updateAuction(auction: Auction): Promise<void> {
    this.database.auctions[auction.id] = auction;
    this.saveDatabase();
  }

  /**
   * Delete an auction
   */
  public async deleteAuction(auctionId: string): Promise<boolean> {
    if (!this.database.auctions[auctionId]) {
      return false;
    }

    delete this.database.auctions[auctionId];
    this.saveDatabase();
    return true;
  }

  // ===== BIDDER CRUD OPERATIONS =====

  /**
   * Get all bidders for a specific auction
   */
  public async getBidders(auctionId: string): Promise<Bidder[]> {
    const auction = this.database.auctions[auctionId];
    if (!auction) return [];

    return Object.values(auction.bidders);
  }

  /**
   * Get a specific bidder by ID from an auction
   */
  public async getBidderById(auctionId: string, bidderId: string): Promise<Bidder | null> {
    const auction = this.database.auctions[auctionId];
    if (!auction) return null;

    return auction.bidders[bidderId] || null;
  }

  /**
   * Create a new bidder for an auction
   */
  public async createBidder(auctionId: string, bidderData: Omit<Bidder, 'id'> & { id?: string }): Promise<Bidder> {
    const auction = this.database.auctions[auctionId];
    if (!auction) throw new Error(`Auction with ID ${auctionId} not found`);

    const id = bidderData.id || this.getNextBidderId(auction);

    // Check if ID already exists in this auction
    if (auction.bidders[id]) {
      throw new Error(`Bidder with ID ${id} already exists in this auction`);
    }

    const newBidder: Bidder = { ...bidderData, id };

    // Add bidder to the specific auction
    auction.bidders[id] = newBidder;

    this.saveDatabase();
    return newBidder;
  }

  /**
   * Update an existing bidder in an auction
   */
  public async updateBidder(auctionId: string, bidder: Bidder): Promise<boolean> {
    const auction = this.database.auctions[auctionId];
    if (!auction || !auction.bidders[bidder.id]) {
      return false;
    }

    auction.bidders[bidder.id] = bidder;
    this.saveDatabase();
    return true;
  }

  /**
   * Delete a bidder from an auction
   */
  public async deleteBidder(auctionId: string, bidderId: string): Promise<boolean> {
    const auction = this.database.auctions[auctionId];
    if (!auction || !auction.bidders[bidderId]) {
      return false;
    }

    // Check if the bidder has any bids
    const hasBids = Object.values(auction.bids).some((bid: any) => bid.bidderId === bidderId);
    if (hasBids) {
      throw new Error(`Cannot delete bidder with ID ${bidderId} because they have existing bids.`);
    }

    delete auction.bidders[bidderId];
    this.saveDatabase();
    return true;
  }

  // ===== BID CRUD OPERATIONS =====

  /**
   * Get all bids for a specific auction
   */
  public async getBids(auctionId: string): Promise<Bid[]> {
    const auction = this.database.auctions[auctionId];
    if (!auction) return [];

    return Object.values(auction.bids);
  }

  /**
   * Get a specific bid by ID from an auction
   */
  public async getBidById(auctionId: string, bidId: string): Promise<Bid | null> {
    const auction = this.database.auctions[auctionId];
    if (!auction) return null;

    return auction.bids[bidId] || null;
  }

  /**
   * Create a new bid for an auction
   */
  public async createBid(auctionId: string, bidderId: string, amount: number): Promise<Bid> {
    const auction = this.database.auctions[auctionId];
    if (!auction) throw new Error('Phiên đấu giá không tồn tại');

    const bidder = auction.bidders[bidderId];
    if (!bidder) throw new Error('Người đấu giá không tồn tại');

    // Validation is now handled in useAuction, no need to validate here
    // This allows for consistent validation logic in one place

    const id = Date.now().toString();
    // Use type assertion to bypass TS property checks
    const newBid = {
      id,
      bidderId,
      amount,
      timestamp: Date.now(),
    } as Bid;

    // Add the bid to the auction's bids collection
    auction.bids[id] = newBid;

    // Update the auction's current price and ensure status is IN_PROGRESS
    auction.currentPrice = amount;
    auction.status = AUCTION_STATUS.IN_PROGRESS;

    // Save changes to localStorage
    this.saveDatabase();

    // More detailed logging
    console.log(`Bid created: ID=${id}, bidder=${bidder.name}, amount=${amount.toLocaleString('vi-VN')} VND`);
    console.log(`Updated auction ${auctionId} current price to ${amount.toLocaleString('vi-VN')} VND`);
    console.log(`Total bids for auction ${auctionId}: ${Object.values(auction.bids).length}`);

    return newBid;
  }

  /**
   * Update an existing bid in an auction
   */
  public async updateBid(auctionId: string, bid: Bid): Promise<boolean> {
    const auction = this.database.auctions[auctionId];
    if (!auction || !auction.bids[bid.id]) {
      return false;
    }

    auction.bids[bid.id] = bid;

    // Recalculate current price
    const highestBid = Object.values(auction.bids)
      .sort((a: any, b: any) => b.amount - a.amount)[0] as Bid;

    if (highestBid) {
      auction.currentPrice = highestBid.amount;
    }

    this.saveDatabase();
    return true;
  }

  /**
   * Delete/remove a bid from an auction
   */
  public async removeBid(auctionId: string, bidId: string): Promise<void> {
    const auction = this.database.auctions[auctionId];
    if (!auction) throw new Error(`Auction with ID ${auctionId} not found`);

    // Check if the bid exists in this auction
    if (!auction.bids[bidId]) {
      throw new Error(`Bid with ID ${bidId} does not exist in this auction`);
    }

    // Get the bid to be removed
    const bidToRemove = auction.bids[bidId];
    const bidderName = auction.bidders[bidToRemove.bidderId]?.name || 'Unknown';
    console.log(`Removing bid: ID=${bidId}, bidder=${bidderName}, amount=${bidToRemove.amount.toLocaleString('vi-VN')} VND`);

    // Remove the bid from the auction
    delete auction.bids[bidId];

    // Find the highest remaining bid for this auction
    const remainingBids = Object.values(auction.bids)
      .sort((a: any, b: any) => b.amount - a.amount);

    // Update the auction's current price to the highest remaining bid or the starting price
    if (remainingBids.length > 0) {
      auction.currentPrice = (remainingBids[0] as Bid).amount;
      console.log(`Updated auction ${auction.id} current price to ${auction.currentPrice.toLocaleString('vi-VN')} VND (highest remaining bid)`);
    } else {
      auction.currentPrice = auction.settings.startingPrice;
      console.log(`Updated auction ${auction.id} current price to ${auction.currentPrice.toLocaleString('vi-VN')} VND (starting price)`);
    }

    // Save changes to localStorage
    this.saveDatabase();
    console.log(`Bid ${bidId} removed successfully`);
    console.log(`Total bids for auction ${auctionId}: ${Object.values(auction.bids).length}`);
  }

  private getNextBidderId(auction: any): string {
    const bidders = Object.values(auction.bidders);
    if (bidders.length === 0) return '1';
    const maxId = Math.max(...bidders.map((bidder: any) => parseInt(bidder.id) || 0));
    return (maxId + 1).toString();
  }

  public resetDatabase(): void {
    this.database = {
      auctions: {},
      settings: defaultUISettings
    };
    this.saveDatabase();
  }
}

export const databaseService = new DatabaseService();

