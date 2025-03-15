import { create } from 'zustand';
import { databaseService } from '../services/databaseService';
import { Auction, Bidder, Bid, UISettings, AuctionSettings } from '../types';

interface AuctionState {
  auction: Auction | null;
  bidders: Bidder[];
  bids: Bid[];
  settings: UISettings;
  loading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  getAuctionById: (auctionId: string) => Promise<void>;
  createAuction: (auctionData: Omit<Auction, 'id'>) => Promise<Auction>;
  updateAuction: (auction: Auction) => Promise<void>;
  createBidder: (bidderData: Omit<Bidder, 'id'>) => Promise<Bidder>;
  placeBid: (bidderId: string, amount: number) => Promise<Bid>;
  cancelBid: (bidId: string) => Promise<void>;
  clearBidders: () => Promise<void>;
}

// Define application settings
const appSettings: UISettings = {
  theme: 'light',
  language: 'vi',
  locale: 'vi-VN'
};

export const useAuctionStore = create<AuctionState>((set, get) => ({
  auction: null,
  bidders: [],
  bids: [],
  settings: appSettings,
  loading: false,
  error: null,

  refreshData: async () => {
    try {
      set({ loading: true });
      const db = databaseService.getDatabase();
      const currentAuction = Object.values(db.auctions).find(a => a.status === 'IN_PROGRESS') || null;

      if (currentAuction) {
        // Extract bidders and bids from the auction object
        set({
          auction: currentAuction,
          bidders: Object.values(currentAuction.bidders),
          bids: Object.values(currentAuction.bids),
          settings: db.settings,
          error: null
        });
      } else {
        set({
          auction: null,
          bidders: [],
          bids: [],
          settings: db.settings,
          error: null
        });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to refresh data' });
    } finally {
      set({ loading: false });
    }
  },

  getAuctionById: async (auctionId: string) => {
    try {
      set({ loading: true });
      const db = databaseService.getDatabase();
      const foundAuction = db.auctions[auctionId] || null;

      if (foundAuction) {
        // Get bidders and bids directly from the auction object
        set({
          auction: foundAuction,
          bidders: Object.values(foundAuction.bidders),
          bids: Object.values(foundAuction.bids),
          settings: db.settings,
          error: null
        });
      } else {
        set({ error: `Auction with ID ${auctionId} not found` });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to get auction' });
    } finally {
      set({ loading: false });
    }
  },

  createAuction: async (auctionData: Omit<Auction, 'id'>) => {
    try {
      const { title, description, settings } = auctionData;
      const newAuction = await databaseService.createAuction(
        title,
        description,
        settings as AuctionSettings
      );
      await get().refreshData();
      return newAuction;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create auction' });
      throw err;
    }
  },

  updateAuction: async (auction: Auction) => {
    try {
      await databaseService.updateAuction(auction);
      await get().refreshData();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update auction' });
      throw err;
    }
  },

  createBidder: async (bidderData: Omit<Bidder, 'id'>) => {
    try {
      const { auction } = get();
      if (!auction?.id) {
        throw new Error('No active auction found');
      }
      const newBidder = await databaseService.createBidder(auction.id, bidderData);
      await get().refreshData();
      return newBidder;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to create bidder' });
      throw err;
    }
  },

  placeBid: async (bidderId: string, amount: number) => {
    try {
      const { auction } = get();
      if (!auction) throw new Error('No active auction');

      const newBid = await databaseService.createBid(auction.id, bidderId, amount);
      await get().refreshData();
      return newBid;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to place bid' });
      throw err;
    }
  },

  cancelBid: async (bidId: string) => {
    try {
      const { auction } = get();
      if (!auction) throw new Error('No active auction');

      await databaseService.removeBid(auction.id, bidId);
      await get().refreshData();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel bid' });
      throw err;
    }
  },

  clearBidders: async () => {
    try {
      const { auction } = get();
      if (!auction?.id) {
        throw new Error('No active auction found');
      }

      // Get all bidders for this auction
      const bidders = await databaseService.getBidders(auction.id);

      // Delete each bidder individually
      for (const bidder of bidders) {
        try {
          await databaseService.deleteBidder(auction.id, bidder.id);
        } catch (error) {
          console.log(`Could not delete bidder ${bidder.id}: ${error}`);
        }
      }

      await get().refreshData();
    } catch (error) {
      console.error('Error clearing bidders:', error);
      throw error;
    }
  }
}));
