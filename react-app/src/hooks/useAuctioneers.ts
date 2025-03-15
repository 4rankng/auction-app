import { useState, useEffect, useCallback } from 'react';
import { Auctioneer } from '../types';
import { auctioneerService } from '../services/auctioneerService';

/**
 * Custom hook for managing auctioneers
 */
export const useAuctioneers = () => {
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load all auctioneers
  const loadAuctioneers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await auctioneerService.getAuctioneers();
      setAuctioneers(data);
    } catch (err) {
      console.error('Error loading auctioneers:', err);
      setError(err instanceof Error ? err.message : 'Error loading auctioneers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new auctioneer
  const createAuctioneer = useCallback(async (name: string) => {
    try {
      setLoading(true);
      setError(null);
      const newAuctioneer = await auctioneerService.createAuctioneer(name);

      // Reload the full list of auctioneers to ensure proper deduplication
      await loadAuctioneers();

      return newAuctioneer;
    } catch (err) {
      console.error('Error creating auctioneer:', err);
      setError(err instanceof Error ? err.message : 'Error creating auctioneer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAuctioneers]);

  // Update an existing auctioneer
  const updateAuctioneer = useCallback(async (auctioneer: Auctioneer) => {
    try {
      setLoading(true);
      setError(null);
      const updatedAuctioneer = await auctioneerService.updateAuctioneer(auctioneer);

      // Reload the full list of auctioneers to ensure proper state
      await loadAuctioneers();

      return updatedAuctioneer;
    } catch (err) {
      console.error('Error updating auctioneer:', err);
      setError(err instanceof Error ? err.message : 'Error updating auctioneer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAuctioneers]);

  // Delete an auctioneer
  const deleteAuctioneer = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const success = await auctioneerService.deleteAuctioneer(id);
      if (success) {
        // Reload the full list of auctioneers to ensure proper state
        await loadAuctioneers();
      }
      return success;
    } catch (err) {
      console.error('Error deleting auctioneer:', err);
      setError(err instanceof Error ? err.message : 'Error deleting auctioneer');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAuctioneers]);

  // Load auctioneers when the component mounts
  useEffect(() => {
    loadAuctioneers();
  }, [loadAuctioneers]);

  return {
    auctioneers,
    loading,
    error,
    createAuctioneer,
    updateAuctioneer,
    deleteAuctioneer,
    loadAuctioneers
  };
};
