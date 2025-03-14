import React from 'react';
import BidHistoryTable from './BidHistoryTable';

interface BidHistoryProps {
  auctionId: number;
  refreshInterval?: number;
}

/**
 * A standalone component for displaying bid history
 * This component can be used independently in any page
 */
const BidHistory: React.FC<BidHistoryProps> = ({ auctionId, refreshInterval = 5000 }) => {
  return (
    <div className="bid-history-container">
      <BidHistoryTable
        auctionId={auctionId}
        refreshInterval={refreshInterval}
      />
    </div>
  );
};

export default BidHistory;
