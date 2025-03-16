import { configureStore } from '@reduxjs/toolkit';
import auctionReducer from '@store/auctionSlice';

export const store = configureStore({
  reducer: {
    auction: auctionReducer
  }
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
