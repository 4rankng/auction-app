import { databaseService } from './databaseService';
import { Bid, Auction, AuctionStatus } from '../types';
import * as formatUtils from '../utils/formatUtils';

// Auction status constants
const AUCTION_STATUS = {
  SETUP: 'SETUP' as AuctionStatus,
  IN_PROGRESS: 'IN_PROGRESS' as AuctionStatus,
  ENDED: 'ENDED' as AuctionStatus
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
        throw new Error('Đấu giá đã kết thúc');
      }

      // Check if bidder exists
      if (!auction.bidders[bidderId]) {
        throw new Error('Người đấu giá không tồn tại');
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
      console.log(`Creating bid for auction ${auctionId}, bidder ${bidderId}, amount ${amount}`);
      const newBid = await databaseService.createBid(auctionId, bidderId, amount);

      // Update the auction with the new current price
      const updatedAuction: Auction = {
        ...auction,
        currentPrice: amount,
        status: AUCTION_STATUS.IN_PROGRESS
      };

      await databaseService.updateAuction(updatedAuction);
      console.log('Auction updated with new price:', amount);

      return newBid;
    } catch (error) {
      console.error('Error in bidService.placeBid:', error);
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
      console.error('Error in bidService.cancelBid:', error);
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
      console.error('Error in bidService.getLatestBids:', error);
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
      console.error('Error in bidService.getHighestBid:', error);
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
    // Sort bids by timestamp (newest first)
    const sortedBids = [...bids].sort((a, b) => b.timestamp - a.timestamp);

    // Format each bid for display
    return sortedBids.map((bid, index) => {
      const bidder = bidders.find(b => b.id === bid.bidderId);
      const bidderName = bidder ? `${bid.bidderId} - ${bidder.name}` : bid.bidderId;

      return {
        id: index,
        bidNumber: sortedBids.length - index, // Newest bid gets highest number
        bidder: bidderName,
        amount: formatUtils.formatCurrency(bid.amount),
        timestamp: formatUtils.formatTimestamp(bid.timestamp),
        rawTimestamp: bid.timestamp,
        rawAmount: bid.amount
      };
    });
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
