import { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Auction, Bidder, Bid, Settings } from '../types';

export function useAuction() {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [settings, setSettings] = useState<Settings>({
    initialPrice: 1000,
    priceIncrement: 100,
    auctionDuration: 300,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      const db = databaseService.getDatabase();
      const currentAuction = Object.values(db.auctions).find(a => a.status === 'IN_PROGRESS') || null;
      setAuction(currentAuction);
      setBidders(Object.values(db.bidders));
      setBids(Object.values(db.bids));
      setSettings(db.settings);
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
      const db = databaseService.getDatabase();
      const foundAuction = db.auctions[auctionId] || null;

      if (foundAuction) {
        setAuction(foundAuction);
        setBidders(Object.values(db.bidders));
        setBids(Object.values(db.bids).filter(bid => bid.auctionId === auctionId));
        setSettings(db.settings);
        setError(null);
      } else {
        setError(`Auction with ID ${auctionId} not found`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get auction');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const createAuction = async (auctionData: Omit<Auction, 'id'>) => {
    try {
      const newAuction = await databaseService.createAuction(auctionData);
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
      const newBidder = await databaseService.createBidder(bidderData);
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
      if (!auction) throw new Error('No active auction');
      const newBid = await createBid(auction.id, bidderId, amount);
      return newBid;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
      throw err;
    }
  };

  const clearBidders = async () => {
    try {
      await databaseService.clearBidders();
      setBidders([]);
    } catch (error) {
      console.error('Error clearing bidders:', error);
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
    refreshData,
    clearBidders,
    getAuctionById,
  };
}
