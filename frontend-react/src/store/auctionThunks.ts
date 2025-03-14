import { createAsyncThunk } from '@reduxjs/toolkit';
import { databaseService } from '../services/databaseService';
import {
  auctionLoading,
  auctionLoaded,
  auctionError,
  bidPlaced,
  bidCancelled,
  roundStarted,
  auctionEnded
} from './auctionSlice';
import { Auction, Bid } from '../types';

// Fetch auction data
export const fetchAuctionData = createAsyncThunk(
  'auction/fetchData',
  async (auctionId: string, { dispatch }) => {
    try {
      dispatch(auctionLoading());

      // Get database
      const database = databaseService.getDatabase();

      // Get auction
      const auction = database.auctions[auctionId];
      if (!auction) {
        throw new Error('Auction not found');
      }

      // Get bidders
      const bidders = Object.values(database.bidders);

      // Get bids for this auction
      const bids = Object.values(database.bids)
        .filter(bid => bid.auctionId === auctionId);

      // Dispatch action to update state
      dispatch(auctionLoaded({ auction, bidders, bids }));

      return { auction, bidders, bids };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch auction data';
      dispatch(auctionError(errorMessage));
      throw error;
    }
  }
);

// Place a bid
export const placeBid = createAsyncThunk(
  'auction/placeBid',
  async ({ auctionId, bidderId, amount }: { auctionId: string; bidderId: string; amount: number }, { dispatch }) => {
    try {
      // Create bid in database
      const newBid = await databaseService.createBid(auctionId, bidderId, amount);

      // Update Redux state
      dispatch(bidPlaced(newBid));

      return newBid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place bid';
      dispatch(auctionError(errorMessage));
      throw error;
    }
  }
);

// Cancel a bid
export const cancelBid = createAsyncThunk(
  'auction/cancelBid',
  async (bidId: string, { dispatch }) => {
    try {
      // Remove bid from database
      await databaseService.removeBid(bidId);

      // Update Redux state
      dispatch(bidCancelled(bidId));

      return bidId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel bid';
      dispatch(auctionError(errorMessage));
      throw error;
    }
  }
);

// Start next round
export const startNextRound = createAsyncThunk(
  'auction/startNextRound',
  async ({ auctionId, duration }: { auctionId: string; duration: number }, { dispatch, getState }) => {
    try {
      // Get database
      const database = databaseService.getDatabase();

      // Get auction
      const auction = database.auctions[auctionId];
      if (!auction) {
        throw new Error('Auction not found');
      }

      // Calculate end time
      const endTime = Date.now() + duration * 1000;

      // Update auction in database
      const updatedAuction: Auction = {
        ...auction,
        currentRound: (auction.currentRound || 1) + 1,
        endTime
      };

      await databaseService.updateAuction(updatedAuction);

      // Dispatch action to update state
      dispatch(roundStarted({ endTime }));

      return updatedAuction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start next round';
      dispatch(auctionError(errorMessage));
      throw error;
    }
  }
);

// End auction
export const endAuction = createAsyncThunk(
  'auction/endAuction',
  async (auctionId: string, { dispatch }) => {
    try {
      // Get database
      const database = databaseService.getDatabase();

      // Get auction
      const auction = database.auctions[auctionId];
      if (!auction) {
        throw new Error('Auction not found');
      }

      // Update auction status
      const updatedAuction: Auction = {
        ...auction,
        status: 'ENDED',
        endTime: Date.now()
      };

      await databaseService.updateAuction(updatedAuction);

      // Dispatch action to update state
      dispatch(auctionEnded());

      return updatedAuction;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to end auction';
      dispatch(auctionError(errorMessage));
      throw error;
    }
  }
);
