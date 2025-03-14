import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Bid, Auction, Bidder } from '../types';

interface AuctionState {
  auction: Auction | null;
  bidders: Bidder[];
  bids: Bid[];
  currentRound: number;
  endTime: number | null;
  status: 'idle' | 'active' | 'ended' | 'loading' | 'error';
  error: string | null;
  selectedBidderId: string | null;
  lastBidderId: string | null;
  highestBidderId: string | null;
  bidderTimeLeft: number;
}

const initialState: AuctionState = {
  auction: null,
  bidders: [],
  bids: [],
  currentRound: 1,
  endTime: null,
  status: 'idle',
  error: null,
  selectedBidderId: null,
  lastBidderId: null,
  highestBidderId: null,
  bidderTimeLeft: 60
};

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {

    auctionLoading: (state) => {
      state.status = 'loading';
    },
    auctionLoaded: (state, action: PayloadAction<{ auction: Auction; bidders: Bidder[]; bids: Bid[] }>) => {
      state.auction = action.payload.auction;
      state.bidders = action.payload.bidders;
      state.bids = action.payload.bids;
      state.endTime = action.payload.auction.endTime || null;
      state.status = 'active';

      // Set last bidder if there are bids
      if (action.payload.bids.length > 0) {
        const sortedBids = [...action.payload.bids].sort((a, b) => b.timestamp - a.timestamp);
        state.lastBidderId = sortedBids[0].bidderId;

        // Find highest bidder
        const highestBid = [...action.payload.bids].sort((a, b) => b.amount - a.amount)[0];
        state.highestBidderId = highestBid.bidderId;
      }
    },
    auctionError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    bidPlaced: (state, action: PayloadAction<Bid>) => {
      state.bids.push(action.payload);
      state.lastBidderId = action.payload.bidderId;

      // Update highest bidder if this is the highest bid
      const highestBid = [...state.bids].sort((a, b) => b.amount - a.amount)[0];
      state.highestBidderId = highestBid.bidderId;

      // Reset bidder timer
      state.bidderTimeLeft = 60;
    },
    bidCancelled: (state, action: PayloadAction<string>) => {
      // Remove the bid with the given ID
      state.bids = state.bids.filter(bid => bid.id !== action.payload);

      // Update last bidder
      if (state.bids.length > 0) {
        const sortedBids = [...state.bids].sort((a, b) => b.timestamp - a.timestamp);
        state.lastBidderId = sortedBids[0].bidderId;
      } else {
        state.lastBidderId = null;
      }

      // Update highest bidder
      if (state.bids.length > 0) {
        const highestBid = [...state.bids].sort((a, b) => b.amount - a.amount)[0];
        state.highestBidderId = highestBid.bidderId;
      } else {
        state.highestBidderId = null;
      }
    },
    bidderSelected: (state, action: PayloadAction<string | null>) => {
      state.selectedBidderId = action.payload;

      // Reset bidder timer if a new bidder is selected
      if (action.payload && action.payload !== state.lastBidderId) {
        state.bidderTimeLeft = 60;
      } else if (action.payload === state.lastBidderId) {
        state.bidderTimeLeft = 0;
      }
    },
    bidderTimerTick: (state) => {
      if (state.bidderTimeLeft > 0) {
        state.bidderTimeLeft -= 1;
      }
    },
    bidderTimerReset: (state, action: PayloadAction<number>) => {
      state.bidderTimeLeft = action.payload;
    },
    auctionEnded: (state) => {
      state.status = 'ended';
    }
  }
});

export const {
  auctionLoading,
  auctionLoaded,
  auctionError,
  bidPlaced,
  bidCancelled,
  bidderSelected,
  bidderTimerTick,
  bidderTimerReset,
  auctionEnded
} = auctionSlice.actions;

export default auctionSlice.reducer;
