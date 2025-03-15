import { createAsyncThunk } from '@reduxjs/toolkit';
import { databaseService } from '../services/databaseService';
import {
  auctionLoading,
  auctionLoaded,
  auctionError,
  bidPlaced,
  bidCancelled,
  auctionEnded
} from './auctionSlice';
import { Auction, Bid, Bidder } from '../types';
import { AUCTION_STATUS } from '../utils/constants';
import { RootState } from './index';

// Fetch auction data
export const fetchAuctionData = createAsyncThunk(
  'auction/fetchData',
  async (auctionId: string, { dispatch }) => {
    try {
      dispatch(auctionLoading());

      // Get auction
      const auction = await databaseService.getAuctionById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }

      // Get bidders
      const bidders = await databaseService.getBidders(auctionId);

      // Get bids for this auction
      const bids = await databaseService.getBids(auctionId);

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
  async ({ auctionId, bidId }: { auctionId: string; bidId: string }, { dispatch }) => {
    try {
      // Remove bid from database
      await databaseService.removeBid(auctionId, bidId);

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

// End auction
export const endAuction = createAsyncThunk(
  'auction/endAuction',
  async (auctionId: string | undefined, { getState, dispatch }) => {
    try {
      const state = getState() as RootState;
      const auction = state.auction.auction;

      // If auctionId is provided, use it; otherwise use the one from state
      const targetAuctionId = auctionId || auction?.id;

      if (!targetAuctionId) {
        throw new Error('No auction ID provided and no active auction found in state');
      }

      // Get the auction from the database
      const auctionToEnd = await databaseService.getAuctionById(targetAuctionId);

      if (!auctionToEnd) {
        throw new Error('Auction not found');
      }

      // Update auction status to COMPLETED
      const updatedAuction: Auction = {
        ...auctionToEnd,
        status: AUCTION_STATUS.COMPLETED as any,
        endTime: Date.now()
      };

      // Update the auction in the database
      await databaseService.updateAuction(updatedAuction);

      // Update the local state
      dispatch(auctionEnded());

      return updatedAuction;
    } catch (error) {
      console.error('Failed to end auction:', error);
      throw error;
    }
  }
);
