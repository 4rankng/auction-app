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
        // Reduce logging to prevent console spam
        console.log(`Loaded auction: ${foundAuction.title} (ID: ${auctionId})`);
      } else {
        console.error(`Auction with ID ${auctionId} not found`);
        // Don't try to find any auction in progress as a fallback
        // Just set the error message
        setAuction(null);
        setError(`Không tìm thấy phiên đấu giá với ID ${auctionId}`);
      }
    } catch (err) {
      console.error('Error in getAuctionById:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải phiên đấu giá');
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
      if (!auction) throw new Error('Không có phiên đấu giá đang diễn ra');

      console.log(`Starting placeBid process for auction ${auction.id}, bidder ${bidderId}, amount ${amount}`);

      // Validate the bid amount
      if (amount <= auction.currentPrice) {
        throw new Error(`Giá trả phải lớn hơn giá hiện tại (${auction.currentPrice.toLocaleString('vi-VN')} VND)`);
      }

      if (amount < auction.currentPrice + auction.bidStep) {
        throw new Error(`Giá trả phải cao hơn giá hiện tại ít nhất ${auction.bidStep.toLocaleString('vi-VN')} VND`);
      }

      // Get the current round from the auction object or default to 1
      const currentRound = auction.currentRound || 1;
      console.log(`Current round for this bid: ${currentRound}`);

      // Create the new bid directly with databaseService to avoid race conditions
      const newBid = await databaseService.createBid(auction.id, bidderId, amount);
      console.log('Bid created successfully:', newBid);

      // Get the latest auction data to ensure we have the most up-to-date state
      const db = databaseService.getDatabase();
      const updatedAuction = db.auctions[auction.id];

      if (updatedAuction) {
        // Update local state with the latest auction data
        setAuction(updatedAuction);

        // Get all bids for this auction and update the bids state
        const auctionBids = Object.values(db.bids).filter(bid => bid.auctionId === auction.id);
        setBids(auctionBids);

        console.log('Updated auction data:', updatedAuction);
        console.log('Updated bids data:', auctionBids);
      }

      return newBid;
    } catch (err) {
      console.error('Error in placeBid:', err);
      setError(err instanceof Error ? err.message : 'Không thể đấu giá');
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
