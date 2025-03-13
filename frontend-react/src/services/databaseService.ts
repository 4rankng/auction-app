import { v4 as uuidv4 } from 'uuid';
import { Auction, Bid, Bidder, Database, Settings, AuctionResult } from '../models/types';
import { AUCTION_STATUS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../models/constants';

// Initialize the database with default values
const initializeDatabase = (): Database => {
  return {
    auctions: {},
    bidders: {},
    bids: {},
    settings: {
      initialPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
      priceIncrement: DEFAULT_SETTINGS.PRICE_INCREMENT,
      auctionDuration: DEFAULT_SETTINGS.AUCTION_DURATION
    }
  };
};

// Get the database from localStorage or initialize it
const getDatabase = (): Database => {
  const dbString = localStorage.getItem(STORAGE_KEYS.DATABASE);
  if (!dbString) {
    const newDb = initializeDatabase();
    localStorage.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(newDb));
    return newDb;
  }
  return JSON.parse(dbString);
};

// Save the database to localStorage
const saveDatabase = (db: Database): void => {
  localStorage.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(db));
};

// Get the current auction ID
export const getCurrentAuctionId = (): string | undefined => {
  const db = getDatabase();
  return db.currentAuctionId;
};

// Set the current auction ID
export const setCurrentAuctionId = (auctionId: string): void => {
  const db = getDatabase();
  db.currentAuctionId = auctionId;
  saveDatabase(db);

  // Also store in a separate localStorage item for easier access
  localStorage.setItem(STORAGE_KEYS.CURRENT_AUCTION, auctionId);
};

// Get the current auction
export const getCurrentAuction = (): Auction | undefined => {
  const db = getDatabase();
  const currentAuctionId = db.currentAuctionId;
  if (!currentAuctionId) return undefined;
  return db.auctions[currentAuctionId];
};

// Format currency (VND)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};

// Format time (MM:SS)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Auction CRUD operations
export const auctionService = {
  // Get all auctions
  getAll: (): Auction[] => {
    const db = getDatabase();
    return Object.values(db.auctions);
  },

  // Get active auctions (setup or in progress)
  getActive: (): Auction[] => {
    const db = getDatabase();
    return Object.values(db.auctions).filter(
      auction => auction.status === AUCTION_STATUS.SETUP || auction.status === AUCTION_STATUS.IN_PROGRESS
    );
  },

  // Get completed auctions
  getCompleted: (): Auction[] => {
    const db = getDatabase();
    return Object.values(db.auctions).filter(
      auction => auction.status === AUCTION_STATUS.ENDED
    );
  },

  // Get auction by ID
  getById: (id: string): Auction | undefined => {
    const db = getDatabase();
    return db.auctions[id];
  },

  // Create a new auction
  create: async (auction: Omit<Auction, 'id'>): Promise<Auction> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date();

    const newAuction: Auction = {
      ...auction,
      id,
      createdAt: now,
      updatedAt: now
    };

    db.auctions[id] = newAuction;
    db.currentAuctionId = id;
    saveDatabase(db);

    // Also store in a separate localStorage item for easier access
    localStorage.setItem(STORAGE_KEYS.CURRENT_AUCTION, id);

    return newAuction;
  },

  // Update an auction
  update: async (id: string, auction: Partial<Auction>): Promise<Auction> => {
    const db = getDatabase();
    const existingAuction = db.auctions[id];

    if (!existingAuction) {
      throw new Error(`Auction with ID ${id} not found`);
    }

    const updatedAuction: Auction = {
      ...existingAuction,
      ...auction,
      updatedAt: new Date()
    };

    db.auctions[id] = updatedAuction;
    saveDatabase(db);

    return updatedAuction;
  },

  // Delete an auction
  delete: (id: string): void => {
    const db = getDatabase();

    if (!db.auctions[id]) {
      throw new Error(`Auction with ID ${id} not found`);
    }

    delete db.auctions[id];

    // Also delete all bids for this auction
    delete db.bids[id];

    // If this was the current auction, clear the current auction ID
    if (db.currentAuctionId === id) {
      db.currentAuctionId = undefined;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_AUCTION);
    }

    saveDatabase(db);
  },

  // Start an auction
  start: async (id: string): Promise<Auction> => {
    const db = getDatabase();
    const auction = db.auctions[id];

    if (!auction) {
      throw new Error(`Auction with ID ${id} not found`);
    }

    if (auction.status !== AUCTION_STATUS.SETUP) {
      throw new Error(`Auction with ID ${id} is not in setup status`);
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + db.settings.auctionDuration * 1000);

    const updatedAuction: Auction = {
      ...auction,
      status: AUCTION_STATUS.IN_PROGRESS,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      timeLeft: db.settings.auctionDuration,
      updatedAt: now
    };

    db.auctions[id] = updatedAuction;
    saveDatabase(db);

    return updatedAuction;
  },

  // End an auction
  end: async (id: string, winnerId?: string): Promise<Auction> => {
    const db = getDatabase();
    const auction = db.auctions[id];
    if (!auction) {
      throw new Error('Auction not found');
    }

    const now = new Date();

    const updatedAuction: Auction = {
      ...auction,
      status: AUCTION_STATUS.ENDED,
      timeLeft: 0,
      winner: winnerId,
      updatedAt: now
    };

    db.auctions[id] = updatedAuction;
    await saveDatabase(db);
    return updatedAuction;
  },

  // Get auction result
  getResult: (id: string): AuctionResult | undefined => {
    const resultString = localStorage.getItem(`auction_result_${id}`);
    if (!resultString) return undefined;
    return JSON.parse(resultString);
  }
};

// Bidder CRUD operations
export const bidderService = {
  // Get all bidders
  getAll: (): Bidder[] => {
    const db = getDatabase();
    return Object.values(db.bidders);
  },

  // Get bidders for a specific auction
  getAllForAuction: (auctionId: string): Bidder[] => {
    const db = getDatabase();
    const auctionBids = db.bids[auctionId] || [];
    const bidderIds = new Set(auctionBids.map(bid => bid.bidderId));

    return Object.values(db.bidders).filter(bidder => bidderIds.has(bidder.id));
  },

  // Get bidder by ID
  getById: (id: string): Bidder | undefined => {
    const db = getDatabase();
    return db.bidders[id];
  },

  // Create a new bidder
  create: async (bidder: Omit<Bidder, 'id'>): Promise<Bidder> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date();

    const newBidder: Bidder = {
      ...bidder,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Generate avatar if not provided
    if (!newBidder.avatar) {
      newBidder.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newBidder.name)}&background=random&size=64`;
    }

    db.bidders[id] = newBidder;
    saveDatabase(db);

    return newBidder;
  },

  // Create multiple bidders
  createMany: (bidders: Omit<Bidder, 'id'>[]): Bidder[] => {
    const db = getDatabase();
    const newBidders: Bidder[] = [];

    bidders.forEach(bidder => {
      const id = uuidv4();

      const newBidder: Bidder = {
        ...bidder,
        id
      };

      // Generate avatar if not provided
      if (!newBidder.avatar) {
        newBidder.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(newBidder.name)}&background=random&size=64`;
      }

      db.bidders[id] = newBidder;
      newBidders.push(newBidder);
    });

    saveDatabase(db);

    return newBidders;
  },

  // Update a bidder
  update: (id: string, bidder: Partial<Bidder>): Bidder => {
    const db = getDatabase();
    const existingBidder = db.bidders[id];

    if (!existingBidder) {
      throw new Error(`Bidder with ID ${id} not found`);
    }

    const updatedBidder: Bidder = {
      ...existingBidder,
      ...bidder
    };

    db.bidders[id] = updatedBidder;
    saveDatabase(db);

    return updatedBidder;
  },

  // Delete a bidder
  delete: (id: string): void => {
    const db = getDatabase();

    if (!db.bidders[id]) {
      throw new Error(`Bidder with ID ${id} not found`);
    }

    delete db.bidders[id];
    saveDatabase(db);
  },

  // Import bidders from CSV
  importFromCSV: async (content: string): Promise<Bidder[]> => {
    const rows = content.split('\n').map(row => row.split(',').map(cell => cell.trim()));
    const headers = rows[0];
    const data = rows.slice(1).filter(row => row.length === headers.length);

    const bidders: Omit<Bidder, 'id'>[] = data.map(row => {
      const bidder: Omit<Bidder, 'id'> = {
        name: row[0] || '',
        idNumber: row[1] || '',
        issuingAuthority: row[2] || '',
        address: row[3] || '',
        phone: row[4] || undefined,
        email: row[5] || undefined,
        avatar: row[6] || undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return bidder;
    });

    return bidderService.createMany(bidders);
  }
};

// Bid CRUD operations
export const bidService = {
  // Get all bids for an auction
  getAllForAuction: (auctionId: string): Bid[] => {
    const db = getDatabase();
    return db.bids[auctionId] || [];
  },

  // Get bid by ID
  getById: (auctionId: string, bidId: string): Bid | undefined => {
    const db = getDatabase();
    const auctionBids = db.bids[auctionId] || [];
    return auctionBids.find(bid => bid.id === bidId);
  },

  // Create a new bid
  create: async (bid: Omit<Bid, 'id' | 'timestamp' | 'round' | 'bidderName'>): Promise<Bid> => {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date();

    // Get the auction
    const auction = db.auctions[bid.auctionId];
    if (!auction) {
      throw new Error(`Auction with ID ${bid.auctionId} not found`);
    }

    // Get the bidder
    const bidder = db.bidders[bid.bidderId];
    if (!bidder) {
      throw new Error(`Bidder with ID ${bid.bidderId} not found`);
    }

    // Get the current round
    const auctionBids = db.bids[bid.auctionId] || [];
    const round = auctionBids.length + 1;

    const newBid: Bid = {
      ...bid,
      id,
      timestamp: now.toISOString(),
      round,
      bidderName: bidder.name
    };

    // Initialize the bids array for this auction if it doesn't exist
    if (!db.bids[bid.auctionId]) {
      db.bids[bid.auctionId] = [];
    }

    // Add the bid
    db.bids[bid.auctionId].push(newBid);

    // Update the auction's current price
    auction.currentPrice = bid.amount;
    auction.updatedAt = now;

    await saveDatabase(db);
    return newBid;
  },

  // Delete the last bid for an auction
  deleteLastBid: (auctionId: string): void => {
    const db = getDatabase();

    // Get the auction
    const auction = db.auctions[auctionId];
    if (!auction) {
      throw new Error(`Auction with ID ${auctionId} not found`);
    }

    // Get the bids for this auction
    const auctionBids = db.bids[auctionId] || [];
    if (auctionBids.length === 0) {
      throw new Error(`No bids found for auction with ID ${auctionId}`);
    }

    // Remove the last bid
    auctionBids.pop();

    // Update the auction's current price
    if (auctionBids.length > 0) {
      auction.currentPrice = auctionBids[auctionBids.length - 1].amount;
    } else {
      auction.currentPrice = auction.startingPrice;
    }

    auction.updatedAt = new Date();

    saveDatabase(db);
  },

  // Get highest bid for an auction
  getHighestBid: (auctionId: string): Bid | undefined => {
    const db = getDatabase();
    const auctionBids = db.bids[auctionId] || [];

    if (auctionBids.length === 0) {
      return undefined;
    }

    return auctionBids[auctionBids.length - 1];
  },

  // Get highest bidder for an auction
  getHighestBidder: (auctionId: string): Bidder | undefined => {
    const db = getDatabase();
    const highestBid = bidService.getHighestBid(auctionId);

    if (!highestBid) {
      return undefined;
    }

    return db.bidders[highestBid.bidderId];
  }
};

// Settings CRUD operations
export const settingsService = {
  // Get settings
  get: (): Settings => {
    const db = getDatabase();
    return db.settings;
  },

  // Update settings
  update: (settings: Partial<Settings>): Settings => {
    const db = getDatabase();

    const updatedSettings: Settings = {
      ...db.settings,
      ...settings
    };

    db.settings = updatedSettings;
    saveDatabase(db);

    // Also store in a separate localStorage item for easier access
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

    return updatedSettings;
  },

  // Reset settings to default
  reset: (): Settings => {
    const defaultSettings: Settings = {
      initialPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
      priceIncrement: DEFAULT_SETTINGS.PRICE_INCREMENT,
      auctionDuration: DEFAULT_SETTINGS.AUCTION_DURATION
    };

    return settingsService.update(defaultSettings);
  }
};

// Utility functions
export const utilityService = {
  // Generate sample data for testing
  generateSampleData: (): void => {
    const db = getDatabase();

    // Create sample bidders if none exist
    if (Object.keys(db.bidders).length === 0) {
      const vietnameseNames = [
        'Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D',
        'Hoàng Văn E', 'Đặng Thị F', 'Bùi Văn G', 'Đỗ Thị H',
        'Ngô Văn I', 'Dương Thị K', 'Lý Văn L', 'Vũ Thị M',
        'Đặng Văn N', 'Trịnh Thị P', 'Mai Văn Q', 'Hồ Thị R',
        'Trương Văn S', 'Võ Thị T', 'Đinh Văn U', 'Huỳnh Thị V'
      ];

      vietnameseNames.forEach((name, index) => {
        bidderService.create({
          name,
          idNumber: `ID${index + 1}`,
          issuingAuthority: 'Sample Authority',
          address: `Địa chỉ ${index + 1}, Việt Nam`,
          phone: `098${index.toString().padStart(7, '0')}`,
          email: `bidder${index + 1}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    // Create a sample auction if none exist
    if (Object.keys(db.auctions).length === 0) {
      const auctionId = uuidv4();
      const now = new Date();

      const newAuction: Auction = {
        id: auctionId,
        title: 'Sample Auction',
        status: AUCTION_STATUS.SETUP,
        startingPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
        currentPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
        bidStep: DEFAULT_SETTINGS.PRICE_INCREMENT,
        auctionItem: 'Sample Auction Item',
        auctioneer: 'Sample Auctioneer',
        createdAt: now,
        updatedAt: now
      };

      db.auctions[auctionId] = newAuction;
      db.currentAuctionId = auctionId;

      saveDatabase(db);
    }
  },

  // Clear all data
  clearAllData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.DATABASE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUCTION);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);

    // Also clear any auction results
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('auction_result_')) {
        localStorage.removeItem(key);
      }
    });

    // Initialize a new database
    const newDb = initializeDatabase();
    localStorage.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(newDb));
  },

  // Initialize database with sample data
  initializeSampleData: async (): Promise<void> => {
    const db = getDatabase();
    const now = new Date();

    // Create sample bidders
    const sampleBidders = Array.from({ length: 5 }, (_, index) => {
      const name = `Bidder ${index + 1}`;
      return {
        name,
        idNumber: `ID${index + 1}`,
        issuingAuthority: 'Sample Authority',
        address: `Sample Address ${index + 1}`,
        phone: `098${index.toString().padStart(7, '0')}`,
        email: `bidder${index + 1}@example.com`,
        createdAt: now,
        updatedAt: now
      };
    });

    for (const bidder of sampleBidders) {
      await databaseService.bidder.create(bidder);
    }

    // Create sample auction
    const auctionId = uuidv4();
    const newAuction: Auction = {
      id: auctionId,
      title: 'Sample Auction',
      status: AUCTION_STATUS.SETUP,
      startingPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
      currentPrice: DEFAULT_SETTINGS.INITIAL_PRICE,
      bidStep: DEFAULT_SETTINGS.PRICE_INCREMENT,
      auctionItem: 'Sample Auction Item',
      auctioneer: 'Sample Auctioneer',
      createdAt: now,
      updatedAt: now
    };

    db.auctions[auctionId] = newAuction;
    await saveDatabase(db);
  }
};

// Export the database service
const databaseService = {
  initialize: initializeDatabase,
  getCurrentAuctionId,
  setCurrentAuctionId,
  getCurrentAuction,
  formatCurrency,
  formatTime,
  auction: auctionService,
  bidder: bidderService,
  bid: bidService,
  settings: settingsService,
  utility: utilityService
};

export default databaseService;
