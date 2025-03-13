import { useState, useEffect, useCallback } from 'react';
import { Auction, Bidder, Bid } from '../types';
import { databaseService } from '../services/databaseService';

export const useAuction = () => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuctionData = useCallback(() => {
    try {
      const currentAuction = databaseService.getCurrentAuction();
      if (!currentAuction) {
        setError('No active auction found');
        return;
      }

      const auctionBidders = databaseService.getBidders();
      const auctionBids = databaseService.getBids(currentAuction.id);

      setAuction(currentAuction);
      setBidders(auctionBidders);
      setBids(auctionBids);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuctionData();
  }, [loadAuctionData]);

  const createAuction = useCallback((auctionData: Omit<Auction, 'id'>) => {
    try {
      const newAuction = databaseService.createAuction(auctionData);
      setAuction(newAuction);
      return newAuction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction');
      throw err;
    }
  }, []);

  const updateAuction = useCallback((updatedAuction: Auction) => {
    try {
      databaseService.updateAuction(updatedAuction);
      setAuction(updatedAuction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auction');
      throw err;
    }
  }, []);

  const placeBid = useCallback((bidderId: string, amount: number) => {
    if (!auction) throw new Error('No active auction');

    const bidder = bidders.find(b => b.id === bidderId);
    if (!bidder) throw new Error('Bidder not found');

    const newBid: Omit<Bid, 'id'> = {
      auctionId: auction.id,
      bidderId,
      bidderName: bidder.name,
      amount,
      timestamp: Date.now(),
      round: bids.length + 1,
    };

    try {
      const createdBid = databaseService.createBid(newBid);
      setBids(prev => [...prev, createdBid]);
      return createdBid;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bid');
      throw err;
    }
  }, [auction, bidders, bids]);

  return {
    auction,
    bidders,
    bids,
    loading,
    error,
    createAuction,
    updateAuction,
    placeBid,
    refreshData: loadAuctionData,
  };
};
