import { Auctioneer } from '../types';
import { databaseService } from './databaseService';

/**
 * Service for managing auctioneers
 */
class AuctioneerService {
  /**
   * Get all auctioneers
   */
  async getAuctioneers(): Promise<Auctioneer[]> {
    return databaseService.getAuctioneers();
  }

  /**
   * Get a specific auctioneer by ID
   */
  async getAuctioneerById(id: string): Promise<Auctioneer | undefined> {
    return databaseService.getAuctioneerById(id);
  }

  /**
   * Create a new auctioneer
   */
  async createAuctioneer(name: string): Promise<Auctioneer> {
    if (!name || name.trim() === '') {
      throw new Error('Tên đấu giá viên không được để trống');
    }

    return databaseService.createAuctioneer(name.trim());
  }

  /**
   * Update an existing auctioneer
   */
  async updateAuctioneer(auctioneer: Auctioneer): Promise<Auctioneer> {
    if (!auctioneer.name || auctioneer.name.trim() === '') {
      throw new Error('Tên đấu giá viên không được để trống');
    }

    // Make sure name is trimmed
    const updatedAuctioneer = {
      ...auctioneer,
      name: auctioneer.name.trim()
    };

    return databaseService.updateAuctioneer(updatedAuctioneer);
  }

  /**
   * Delete an auctioneer
   */
  async deleteAuctioneer(id: string): Promise<boolean> {
    return databaseService.deleteAuctioneer(id);
  }
}

export const auctioneerService = new AuctioneerService();
