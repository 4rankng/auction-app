import React, { useState, useCallback } from 'react';
import logger from '../services/loggerService';

interface BidHistory {
  id: number;
  bidNumber?: number;
  bidder: string;
  amount: string;
  timestamp: string;
  rawTimestamp?: number;
  rawAmount?: number;
}

interface BidHistoryTableProps {
  auctionId: string;
  bidData: BidHistory[]; // Make bidData required
  refreshTrigger?: number;
  onRefresh?: () => void;
}

const BidHistoryTable: React.FC<BidHistoryTableProps> = ({
  bidData = [],
  refreshTrigger = 0,
  onRefresh
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Helper function to extract numeric value from formatted currency string
  const extractNumericValue = useCallback((formattedAmount: string): number => {
    return parseInt(formattedAmount.replace(/\D/g, '')) || 0;
  }, []);

  // Helper function to sort bid history with consistent rules
  const sortBidHistory = useCallback((bids: BidHistory[]): BidHistory[] => {
    // First sort the bids
    const sortedBids = [...bids].sort((a, b) => {
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

    // Assign sequential bidNumbers to the sorted bids
    return sortedBids.map((bid, index) => ({
      ...bid,
      bidNumber: sortedBids.length - index // Newest bid gets highest number
    }));
  }, [extractNumericValue]);

  // Process the bidData to ensure it has all required fields
  const processedBidData = useCallback(() => {
    if (bidData.length === 0) return [];

    // Ensure all data items have rawAmount if not already present
    const enhancedData = bidData.map(bid => {
      if (bid.rawAmount === undefined) {
        return {
          ...bid,
          rawAmount: extractNumericValue(bid.amount)
        };
      }
      return bid;
    });

    // Sort data using the helper function
    return sortBidHistory(enhancedData);
  }, [bidData, extractNumericValue, sortBidHistory]);

  // Handle refresh button click
  const handleRefresh = () => {
    setLoading(true);
    setLastRefreshTime(Date.now());
    if (onRefresh) {
      logger.info('Manually refreshing bid history');
      onRefresh();
    } else {
      setLoading(false);
    }
  };

  const sortedBidHistory = processedBidData();

  if (loading && sortedBidHistory.length === 0) {
    return (
      <div className="card mb-3" style={{
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        fontFamily: 'Roboto, Arial, sans-serif',
        overflow: 'hidden'
      }}>
        <div className="card-header py-2" style={{
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          padding: '12px 16px'
        }}>
          <h5 className="mb-0" style={{
            color: '#343a40',
            fontSize: '16px',
            fontWeight: '500',
            fontFamily: 'Roboto, Arial, sans-serif'
          }}>Lịch Sử Đấu Giá</h5>
        </div>
        <div className="card-body text-center py-4">
          <div className="spinner-border" role="status" style={{ color: '#6c8dae' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-3" style={{
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Roboto, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <div className="card-header d-flex justify-content-between align-items-center py-2" style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e0e0e0',
        padding: '12px 16px'
      }}>
        <h5 className="mb-0" style={{
          color: '#343a40',
          fontSize: '16px',
          fontWeight: '500',
          fontFamily: 'Roboto, Arial, sans-serif'
        }}>Lịch Sử Đấu Giá</h5>
        <small className="text-muted" style={{
          fontSize: '13px',
          color: '#6c757d',
          fontFamily: 'Roboto, Arial, sans-serif'
        }}>
          Cập nhật lúc: {new Date(lastRefreshTime).toLocaleTimeString()}
          {(
            <button
              className="btn btn-sm ms-2"
              onClick={handleRefresh}
              title="Làm mới"
              style={{
                color: '#6c757d',
                backgroundColor: '#f8f9fa',
                borderColor: '#e0e0e0',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s ease-in-out',
                fontFamily: 'Roboto, Arial, sans-serif'
              }}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          )}
        </small>
      </div>
      <div className="card-body p-0">
        {sortedBidHistory.length === 0 ? (
          <div className="text-center py-4 text-muted" style={{
            color: '#6c757d',
            padding: '24px',
            fontFamily: 'Roboto, Arial, sans-serif',
            fontSize: '14px'
          }}>
            <i className="bi bi-clock-history fs-4 d-block mb-2" style={{ color: '#adb5bd' }}></i>
            Chưa có lịch sử trả giá
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', zIndex: 100 }}>
            <table className="table mb-0" style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '14px',
              color: '#343a40',
              width: '100%'
            }}>
              <thead className="sticky-top" style={{
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e0e0e0',
                fontWeight: '500',
                color: '#495057'
              }}>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>Lượt</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>Người tham gia</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>Số tiền</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {sortedBidHistory.map((bid, index) => (
                  <tr key={bid.id || index} style={{
                    borderBottom: '1px solid #f2f2f2',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    <td style={{ padding: '10px 16px' }}>{bid.bidNumber || sortedBidHistory.length - index}</td>
                    <td style={{ padding: '10px 16px' }}>{bid.bidder}</td>
                    <td style={{ padding: '10px 16px', color: '#6c8dae', fontWeight: '500' }}>{bid.amount}</td>
                    <td style={{ padding: '10px 16px', color: '#6c757d', fontSize: '13px' }}>{bid.timestamp}</td>
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
