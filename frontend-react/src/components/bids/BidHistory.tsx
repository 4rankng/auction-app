import React from 'react';
import { Table } from 'react-bootstrap';
import { Bid } from '../../models/types';
import databaseService from '../../services/databaseService';

interface BidHistoryProps {
  bids: Bid[];
  className?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, className = '' }) => {
  // Sort bids by timestamp (most recent first)
  const sortedBids = [...bids].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <Table responsive className={`bid-history-table ${className}`} hover>
      <thead>
        <tr>
          <th>#</th>
          <th>Bidder</th>
          <th>Amount</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {sortedBids.map((bid, index) => (
          <tr key={bid.id}>
            <td width="50">{bid.round}</td>
            <td>
              <div className="d-flex align-items-center">
                <div className="bidder-id-circle" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                  {bid.bidderId}
                </div>
                <div className="ms-2">
                  <div className="fw-medium">{bid.bidderName}</div>
                </div>
              </div>
            </td>
            <td className="bid-amount">
              {databaseService.formatCurrency(bid.amount)}
            </td>
            <td>
              <div>{new Date(bid.timestamp).toLocaleTimeString()}</div>
              <div className="small text-muted">{new Date(bid.timestamp).toLocaleDateString()}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default BidHistory;
