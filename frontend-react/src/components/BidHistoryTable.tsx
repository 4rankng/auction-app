import React, { useState, useEffect, useCallback } from 'react';

interface BidHistory {
  id: number;
  round: number;
  bidder: string;
  amount: string;
  timestamp: string;
  rawTimestamp?: number; // Raw timestamp for sorting
  rawAmount?: number; // Raw amount for secondary sorting
}

interface BidHistoryTableProps {
  auctionId: string;
  initialData?: BidHistory[];
}

const BidHistoryTable: React.FC<BidHistoryTableProps> = ({
  auctionId,
  initialData = []
}) => {
  const [bidHistory, setBidHistory] = useState<BidHistory[]>(initialData);
  const [loading, setLoading] = useState<boolean>(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Helper function to extract numeric value from formatted currency string
  const extractNumericValue = (formattedAmount: string): number => {
    return parseInt(formattedAmount.replace(/\D/g, '')) || 0;
  };

  // Helper function to sort bid history with consistent rules
  const sortBidHistory = useCallback((bids: BidHistory[]): BidHistory[] => {
    return [...bids].sort((a, b) => {
      // Primary sort by timestamp (newest first)
      const aTimestamp = a.rawTimestamp || 0;
      const bTimestamp = b.rawTimestamp || 0;

      if (aTimestamp !== bTimestamp) {
        return bTimestamp - aTimestamp;
      }

      // Secondary sort by amount (highest first) if timestamps are identical
      const aAmount = a.rawAmount || extractNumericValue(a.amount);
      const bAmount = b.rawAmount || extractNumericValue(b.amount);

      return bAmount - aAmount;
    });
  }, []);

  const fetchBidHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching bid history for auction ${auctionId}`);

      // For demo purposes, we're simulating an API call with localStorage
      const storedDatabase = localStorage.getItem('auction_app_db');
      if (!storedDatabase) {
        console.log('No database found in localStorage');
        setBidHistory([]);
        return;
      }

      const database = JSON.parse(storedDatabase);
      const auction = database.auctions[auctionId];

      if (!auction) {
        console.log(`Auction with ID ${auctionId} not found in database`);
        setBidHistory([]);
        return;
      }

      // Get all bids for this auction
      const allBids = Object.values(database.bids).filter((bid: any) => bid.auctionId === auctionId);
      console.log(`Found ${allBids.length} bids for auction ${auctionId}`);

      // Format the bids for display
      const formattedBids = allBids.map((bid: any, index: number) => ({
        id: bid.id || index,
        round: bid.round,
        bidder: bid.bidderName,
        amount: `${parseInt(bid.amount).toLocaleString('vi-VN')} VND`,
        timestamp: new Date(bid.timestamp).toLocaleString('vi-VN'),
        rawTimestamp: bid.timestamp, // Store the raw timestamp for sorting
        rawAmount: bid.amount // Store the raw amount for secondary sorting
      }));

      // Sort bids using the helper function
      const sortedBids = sortBidHistory(formattedBids);

      console.log('Formatted and sorted bid history:', sortedBids);
      setBidHistory(sortedBids);
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error('Error fetching bid history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bid history');
    } finally {
      setLoading(false);
    }
  }, [auctionId, sortBidHistory]);

  // Only fetch bid history when the component mounts or when auctionId changes
  useEffect(() => {
    fetchBidHistory();
  }, [auctionId, fetchBidHistory]);

  // Update bid history when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      console.log('Updating bid history with new initialData:', initialData);

      // Ensure all initialData items have rawAmount if not already present
      const enhancedData = initialData.map(bid => {
        if (bid.rawAmount === undefined) {
          return {
            ...bid,
            rawAmount: extractNumericValue(bid.amount)
          };
        }
        return bid;
      });

      // Sort initialData using the helper function
      const sortedData = sortBidHistory(enhancedData);

      console.log('Sorted bid history:', sortedData);
      setBidHistory(sortedData);
      setLoading(false);
    }
  }, [initialData, sortBidHistory]);

  if (loading && bidHistory.length === 0) {
    return (
      <div className="card mb-3">
        <div className="card-header py-2">
          <h5 className="mb-0">Lịch Sử Đấu Giá</h5>
        </div>
        <div className="card-body text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && bidHistory.length === 0) {
    return (
      <div className="card mb-3">
        <div className="card-header py-2">
          <h5 className="mb-0">Lịch Sử Đấu Giá</h5>
        </div>
        <div className="card-body text-center py-3">
          <div className="alert alert-danger mb-0">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center py-2">
        <h5 className="mb-0">Lịch Sử Đấu Giá</h5>
        <small className="text-muted">
          Cập nhật lúc: {new Date(lastRefreshTime).toLocaleTimeString()}
          {(
            <button
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={fetchBidHistory}
              title="Làm mới"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          )}
        </small>
      </div>
      <div className="card-body p-0">
        {bidHistory.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-clock-history fs-4 d-block mb-2"></i>
            Chưa có lịch sử đấu giá
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table table-striped mb-0">
              <thead className="sticky-top bg-white">
                <tr>
                  <th>Vòng</th>
                  <th>Người tham gia</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {bidHistory.map((bid, index) => (
                  <tr key={bid.id || index}>
                    <td>{bid.round}</td>
                    <td>{bid.bidder}</td>
                    <td>{bid.amount}</td>
                    <td>{bid.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidHistoryTable;
