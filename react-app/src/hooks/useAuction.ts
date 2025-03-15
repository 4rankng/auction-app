import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { bidService } from '../services/bidService';
import { Auction, Bidder, Bid, AuctionSettings } from '../types';
import {  DEFAULT_BID_DURATION, DEFAULT_BID_STEP, DEFAULT_STARTING_PRICE } from '../utils/constants';

export function useAuction() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [settings, setSettings] = useState<AuctionSettings>({
    startingPrice: DEFAULT_STARTING_PRICE,
    bidStep: DEFAULT_BID_STEP,
    bidDuration: DEFAULT_BID_DURATION,
    auctioneer: "NA"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      const db = databaseService.getDatabase();
      const currentAuction = Object.values(db.auctions).find(a => a.status === 'IN_PROGRESS') || null;

      setAuction(currentAuction);

      // Get bidders from current auction if available
      if (currentAuction) {
        // Access bidders from the current auction
        setBidders(Object.values(currentAuction.bidders || {}));

        // Access bids from the current auction
        setBids(Object.values(currentAuction.bids || {}));
      } else {
        setBidders([]);
        setBids([]);
      }

      // Get auction settings if available, otherwise use default settings
      if (currentAuction?.settings) {
        setSettings(currentAuction.settings);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // New function to get auction by ID
  const getAuctionById = async (auctionId: string) => {
    try {
      setLoading(true);

      // Get fresh data from localStorage to ensure we have the latest
      const db = databaseService.getDatabase();
      const foundAuction = db.auctions[auctionId] || null;

      if (foundAuction) {
        setAuction(foundAuction);

        // Get bidders directly from the auction object
        setBidders(Object.values(foundAuction.bidders || {}));

        // Get bids directly from the auction object
        setBids(Object.values(foundAuction.bids || {}));

        // Set auction settings
        if (foundAuction.settings) {
          setSettings(foundAuction.settings);
        }

        setError(null);
        // Reduce logging to prevent console spam
        console.log(`Loaded auction: ${foundAuction.title} (ID: ${auctionId})`);
      } else {
        console.error(`Auction with ID ${auctionId} not found`);
        setAuction(null);
        setError(`Auction with ID ${auctionId} not found`);
      }
    } catch (err) {
      console.error('Error getting auction by ID:', err);
      setError(err instanceof Error ? err.message : `Failed to get auction with ID ${auctionId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const createAuction = async (auctionData: Omit<Auction, 'id'>) => {
    try {
      const { title, description, settings } = auctionData;
      const newAuction = await databaseService.createAuction(
        title,
        description,
        settings
      );
      await refreshData();
      return newAuction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction');
      throw err;
    }
  };

  const updateAuction = async (auction: Auction) => {
    try {
      await databaseService.updateAuction(auction);
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auction');
      throw err;
    }
  };

  const createBidder = async (bidderData: Omit<Bidder, 'id'>) => {
    try {
      if (!auction?.id) {
        throw new Error('No active auction found');
      }
      const newBidder = await databaseService.createBidder(auction.id, bidderData);
      await refreshData();
      return newBidder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bidder');
      throw err;
    }
  };

  const createBid = async (auctionId: string, bidderId: string, amount: number) => {
    try {
      const newBid = await databaseService.createBid(auctionId, bidderId, amount);
      await refreshData();
      return newBid;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bid');
      throw err;
    }
  };

  const placeBid = async (bidderId: string, amount: number) => {
    try {
      if (!auction) throw new Error('Không có phiên đấu giá đang diễn ra');
      const newBid = await bidService.placeBid(auction.id, bidderId, amount);
      await refreshData(); // Refresh to get updated auction data
      return newBid;
    } catch (err) {
      console.error('Error placing bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to place bid');
      throw err;
    }
  };

  const removeBid = async (bidId: string) => {
    try {
      if (!auction?.id) {
        throw new Error('No active auction found');
      }
      await bidService.cancelBid(auction.id, bidId);
      await refreshData(); // Refresh to get updated auction data
      return true;
    } catch (err) {
      console.error('Error removing bid:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove bid');
      throw err;
    }
  };

  const clearBidders = async () => {
    try {
      if (!auction?.id) {
        throw new Error('No active auction found');
      }

      // Get all bidders from the current auction
      const bidders = await databaseService.getBidders(auction.id);

      // Delete each bidder individually
      for (const bidder of bidders) {
        await databaseService.deleteBidder(auction.id, bidder.id);
      }

      // Update local state
      setBidders([]);

    } catch (error) {
      console.error('Error clearing bidders:', error);
      setError(error instanceof Error ? error.message : 'Failed to clear bidders');
      throw error;
    }
  };

  return {
    auction,
    bidders,
    bids,
    settings,
    loading,
    error,
    createAuction,
    updateAuction,
    createBidder,
    createBid,
    placeBid,
    removeBid,
    refreshData,
    clearBidders,
    getAuctionById,
  };
}
