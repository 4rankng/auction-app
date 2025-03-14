import React, { useState, useEffect, useCallback } from 'react';

interface BidHistory {
  id: number;
  round: number;
  bidder: string;
  amount: string;
  timestamp: string;
}

interface BidHistoryTableProps {
  auctionId: number;
  initialData?: BidHistory[];
  refreshInterval?: number; // in milliseconds, for auto-refresh
}

const BidHistoryTable: React.FC<BidHistoryTableProps> = ({
  auctionId,
  initialData = [],
  refreshInterval = 0 // 0 means no auto-refresh
}) => {
  const [bidHistory, setBidHistory] = useState<BidHistory[]>(initialData);
  const [loading, setLoading] = useState<boolean>(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchBidHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real application, replace this with your actual API call
      // Example: const response = await fetch(`/api/auctions/${auctionId}/bids`);

      // For demo purposes, we're simulating an API call with localStorage
      const storedAuctions = localStorage.getItem('auctions');
      if (!storedAuctions) {
        throw new Error('No auctions found in storage');
      }

      const auctions = JSON.parse(storedAuctions);
      const auction = auctions.find((a: any) => a.id === auctionId);

      if (!auction) {
        throw new Error(`Auction with ID ${auctionId} not found`);
      }

      // If the auction has a bids array, use it; otherwise, use a default empty array
      const bids = auction.bids || [];

      // Sort bids by round in descending order (newest first)
      const sortedBids = [...bids].sort((a, b) => b.round - a.round);

      setBidHistory(sortedBids);
    } catch (err) {
      console.error('Error fetching bid history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bid history');
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchBidHistory();

    // Set up auto-refresh if refreshInterval is provided and greater than 0
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(fetchBidHistory, refreshInterval);
    }

    // Clean up interval on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [auctionId, refreshInterval, fetchBidHistory]);

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
      <div className="card-header py-2 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Lịch Sử Đấu Giá</h5>
        {loading && bidHistory.length > 0 && (
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
        {!loading && (
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchBidHistory}
            title="Refresh bid history"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        )}
      </div>
      <div className="card-body p-0">
        {bidHistory.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-clock-history fs-4 d-block mb-2"></i>
            No bid history available
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
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
