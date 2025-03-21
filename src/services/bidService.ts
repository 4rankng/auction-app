import { databaseService } from '@services/databaseService';
import { Bid, Auction, AuctionStatus } from '@types';
import * as formatUtils from '@utils/formatUtils';
import logger from './loggerService';
import { Subject, BehaviorSubject } from 'rxjs';

// Auction status constants
const AUCTION_STATUS = {
  SETUP: 'SETUP' as AuctionStatus,
  IN_PROGRESS: 'IN_PROGRESS' as AuctionStatus,
  ENDED: 'ENDED' as AuctionStatus
};

// Define the BidState interface to hold all bid control state
export interface BidState {
  bidderName: string;
  currentPrice: string;
  bidIncrement: string;
  bidMethod: 'basePrice' | 'stepPrice' | 'customPrice';
  steps: number;
  isPlaceBidDisabled: boolean;
  isCancelBidDisabled: boolean;
  bidHistoryEmpty: boolean;
  isLastBidder: boolean;
  customAmount: string;
}

// Initial state for the bid controls
const initialBidState: BidState = {
  bidderName: '',
  currentPrice: '0 VND',
  bidIncrement: '0 VND',
  bidMethod: 'basePrice',
  steps: 1,
  isPlaceBidDisabled: true,
  isCancelBidDisabled: true,
  bidHistoryEmpty: true,
  isLastBidder: false,
  customAmount: ''
};

// Create a BehaviorSubject to hold the current bid state
const bidStateSubject = new BehaviorSubject<BidState>(initialBidState);

// Event types
export type BidEvent =
  | { type: 'CUSTOM_AMOUNT_CHANGE'; payload: string }
  | { type: 'STEP_CHANGE'; payload: number }
  | { type: 'BID_METHOD_CHANGE'; payload: 'basePrice' | 'stepPrice' | 'customPrice' }
  | { type: 'PLACE_BID'; payload: string }
  | { type: 'CANCEL_BID' };

// Create subjects for different events
const bidEventSubject = new Subject<BidEvent>();

// Methods to emit events
const emitCustomAmountChange = (amount: string) => {
  // Only emit the event, but don't update the state
  // This prevents unwanted re-renders during typing
  bidEventSubject.next({ type: 'CUSTOM_AMOUNT_CHANGE', payload: amount });

  // We no longer update the state automatically on every keystroke
  // This is now handled by the component on blur or submit
  // const currentState = bidStateSubject.getValue();
  // bidStateSubject.next({
  //   ...currentState,
  //   customAmount: amount
  // });
};

const emitStepChange = (steps: number) => {
  bidEventSubject.next({ type: 'STEP_CHANGE', payload: steps });

  // Also update the state
  const currentState = bidStateSubject.getValue();
  bidStateSubject.next({
    ...currentState,
    steps
  });
};

const emitBidMethodChange = (method: 'basePrice' | 'stepPrice' | 'customPrice') => {
  bidEventSubject.next({ type: 'BID_METHOD_CHANGE', payload: method });

  // Also update the state
  const currentState = bidStateSubject.getValue();
  bidStateSubject.next({
    ...currentState,
    bidMethod: method
  });
};

const emitPlaceBid = (amount: string) => {
  bidEventSubject.next({ type: 'PLACE_BID', payload: amount });
};

const emitCancelBid = () => {
  bidEventSubject.next({ type: 'CANCEL_BID' });
};

// Methods to update bid state directly
const updateBidState = (newState: Partial<BidState>) => {
  const currentState = bidStateSubject.getValue();

  // Check if any values actually changed before updating
  let hasChanges = false;
  for (const key in newState) {
    if (Object.prototype.hasOwnProperty.call(newState, key)) {
      const k = key as keyof BidState;
      if (newState[k] !== currentState[k]) {
        hasChanges = true;
        break;
      }
    }
  }

  if (!hasChanges) {
    logger.info('Skipping bidService state update - no changes detected');
    return;
  }

  logger.info('Updating bidService state:', newState);
  bidStateSubject.next({
    ...currentState,
    ...newState
  });
};

class BidService {
  /**
   * Place a bid in an auction
   * @param auctionId - The ID of the auction
   * @param bidderId - The ID of the bidder
   * @param amount - The bid amount
   * @returns The newly created bid
   */
  public async placeBid(auctionId: string, bidderId: string, amount: number): Promise<Bid> {
    try {
      // Fetch the auction to perform validations
      const db = databaseService.getDatabase();
      const auction = db.auctions[auctionId];

      if (!auction) {
        throw new Error('Không có phiên đấu giá đang diễn ra');
      }

      // Check if auction is ended
      if (auction.status === AUCTION_STATUS.ENDED) {
        throw new Error('Trả giá đã kết thúc');
      }

      // Check if bidder exists
      if (!auction.bidders[bidderId]) {
        throw new Error('Người trả giá không tồn tại');
      }

      // Get all bids for this auction
      const auctionBids = Object.values(auction.bids || {});

      // Different validation for first bid vs. subsequent bids
      if (auctionBids.length === 0) {
        // For the first bid, allow amount to be equal to or greater than the starting price
        const startingPrice = auction.settings.startingPrice;
        if (amount < startingPrice) {
          throw new Error(`Giá trả đầu tiên phải lớn hơn hoặc bằng giá khởi điểm (${startingPrice.toLocaleString('vi-VN')} VND)`);
        }
      } else {
        // For subsequent bids, require amount to be greater than current price
        if (amount <= auction.currentPrice) {
          throw new Error(`Giá trả phải lớn hơn giá hiện tại (${auction.currentPrice.toLocaleString('vi-VN')} VND)`);
        }

        // Always check the minimum bid increment
        const bidStep = auction.settings.bidStep;
        if (amount < auction.currentPrice + bidStep) {
          throw new Error(`Giá trả phải cao hơn giá hiện tại ít nhất ${bidStep.toLocaleString('vi-VN')} VND`);
        }
      }

      // Create the bid using the database service
      logger.info(`Creating bid for auction ${auctionId}, bidder ${bidderId}, amount ${amount}`);
      const newBid = await databaseService.createBid(auctionId, bidderId, amount);

      // Update the auction with the new current price
      const updatedAuction: Auction = {
        ...auction,
        currentPrice: amount,
        status: AUCTION_STATUS.IN_PROGRESS
      };

      await databaseService.updateAuction(updatedAuction);
      logger.info('Auction updated with new price:', amount);

      return newBid;
    } catch (error) {
      logger.error('Error in bidService.placeBid:', error);
      throw error;
    }
  }

  /**
   * Cancel the last bid from a bidder
   * @param auctionId - The ID of the auction
   * @param bidId - The ID of the bid to cancel
   * @returns void
   */
  public async cancelBid(auctionId: string, bidId: string): Promise<void> {
    try {
      await databaseService.removeBid(auctionId, bidId);
    } catch (error) {
      logger.error('Error in bidService.cancelBid:', error);
      throw error;
    }
  }

  /**
   * Get the latest bids for an auction
   * @param auctionId - The ID of the auction
   * @returns Array of bids sorted by timestamp (newest first)
   */
  public async getLatestBids(auctionId: string): Promise<Bid[]> {
    try {
      const bids = await databaseService.getBids(auctionId);
      // Sort bids by timestamp (newest first)
      return bids.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Error in bidService.getLatestBids:', error);
      throw error;
    }
  }

  /**
   * Get the highest bid for an auction
   * @param auctionId - The ID of the auction
   * @returns The highest bid or null if no bids exist
   */
  public async getHighestBid(auctionId: string): Promise<Bid | null> {
    try {
      const bids = await databaseService.getBids(auctionId);
      if (bids.length === 0) {
        return null;
      }

      // Sort bids by amount (highest first)
      return bids.sort((a, b) => b.amount - a.amount)[0];
    } catch (error) {
      logger.error('Error in bidService.getHighestBid:', error);
      throw error;
    }
  }

  /**
   * Format bids for display
   * @param bids - Array of bids
   * @param bidders - Array of bidders for lookup
   * @returns Formatted bid history for display
   */
  public formatBidsForDisplay(bids: Bid[], bidders: any[]): any[] {
    if (bids.length === 0) return [];

    // First sort bids by timestamp (newest first)
    const sortedByTime = [...bids].sort((a, b) => b.timestamp - a.timestamp);

    // Start with max bid number for the newest bid
    const maxBidNumber = sortedByTime.length;

    // Format each bid for display with proper bid numbers
    const formattedBids = sortedByTime.map((bid, index) => {
      const bidder = bidders.find(b => b.id === bid.bidderId);
      const bidderName = bidder ? `${bid.bidderId} - ${bidder.name}` : bid.bidderId;

      // Calculate bid number (newest gets highest number)
      const bidNumber = maxBidNumber - index;

      return {
        bidNumber: bidNumber,
        bidder: bidderName,
        amount: formatUtils.formatCurrency(bid.amount),
        timestamp: formatUtils.formatTimestamp(bid.timestamp),
        rawTimestamp: bid.timestamp,
        rawAmount: bid.amount
      };
    });

    // Final sort by bid number (descending)
    return formattedBids.sort((a, b) => b.bidNumber - a.bidNumber);
  }

  /**
   * Calculate a bid amount based on the current price, increment, and steps
   */
  public calculateStepPrice(currentPrice: string, bidIncrement: string, steps: number): string {
    const currentPriceValue = this.parseCurrency(currentPrice);
    const bidIncrementValue = this.parseCurrency(bidIncrement);
    const calculatedAmount = currentPriceValue + (bidIncrementValue * steps);
    return this.formatCurrency(calculatedAmount);
  }

  /**
   * Format a timestamp to a readable date string
   */
  public formatTimestamp(timestamp: number): string {
    return formatUtils.formatTimestamp(timestamp);
  }

  /**
   * Format a number to a currency string
   */
  public formatCurrency(amount: number): string {
    return formatUtils.formatCurrency(amount);
  }

  /**
   * Parse a currency string to a number
   */
  public parseCurrency(currencyString: string): number {
    return formatUtils.parseCurrency(currencyString);
  }
}

// Export a singleton instance
export const bidService = new BidService();

// Service object to export
const exportService = {
  // State management
  bidState: bidStateSubject.asObservable(),
  updateBidState,

  // Event subscription
  onBidEvent: bidEventSubject.asObservable(),

  // Event emitters
  emitCustomAmountChange,
  emitStepChange,
  emitBidMethodChange,
  emitPlaceBid,
  emitCancelBid
};

export default exportService;
