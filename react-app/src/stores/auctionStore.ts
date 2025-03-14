import { create } from 'zustand';
import { databaseService } from '../services/databaseService';
import { Auction, Bidder, Bid, Settings } from '../types';

interface AuctionState {
  auction: Auction | null;
  bidders: Bidder[];
  bids: Bid[];
  settings: Settings;
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

export const useAuctionStore = create<AuctionState>((set, get) => ({
  auction: null,
  bidders: [],
  bids: [],
  settings: {
    initialPrice: 1000,
    priceIncrement: 100,
    auctionDuration: 300,
  },
  loading: false,
  error: null,

  refreshData: async () => {
    try {
      set({ loading: true });
      const db = databaseService.getDatabase();
      const currentAuction = Object.values(db.auctions).find(a => a.status === 'IN_PROGRESS') || null;

      set({
        auction: currentAuction,
        bidders: Object.values(db.bidders),
        bids: Object.values(db.bids),
        settings: db.settings,
        error: null
      });
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
        set({
          auction: foundAuction,
          bidders: Object.values(db.bidders),
          bids: Object.values(db.bids).filter(bid => bid.auctionId === auctionId),
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
      const newAuction = await databaseService.createAuction(auctionData);
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
      const newBidder = await databaseService.createBidder(bidderData);
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
      // This functionality needs to be implemented in the databaseService
      // For now, we'll just refresh the data
      await get().refreshData();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel bid' });
      throw err;
    }
  },

  clearBidders: async () => {
    try {
      await databaseService.clearBidders();
      set(state => ({ ...state, bidders: [] }));
    } catch (error) {
      console.error('Error clearing bidders:', error);
      throw error;
    }
  }
}));
