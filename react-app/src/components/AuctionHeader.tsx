import React from 'react';
import './AuctionHeader.css';

interface AuctionHeaderProps {
  title: string;
  elapsedTime: string;
  onEndAuction: () => void;
  totalBids: number;
  isAuctionEnded?: boolean;
  auctioneer?: string;
}

/**
 * A reusable component for displaying the auction header with title, elapsed time, and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  elapsedTime,
  onEndAuction,
  totalBids,
  isAuctionEnded = false,
  auctioneer = 'Không có thông tin'
}) => {
  return (
    <div className="auction-header-container">
      <div className="auction-header-info">
        <h3 className="auction-title">{title}</h3>

        <div className="auction-metadata">
          {auctioneer && (
            <div className="auction-metadata-item">
              <i className="bi bi-person-badge me-2"></i>
              <span className="auction-metadata-label">Đấu Giá Viên:</span>
              <span className="auction-metadata-value">{auctioneer}</span>
            </div>
          )}
        </div>
      </div>

      <div className="auction-header-actions">
        <div className="auction-elapsed-time-container">
          <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
          <span className="auction-elapsed-time">{elapsedTime}</span>
        </div>

        {isAuctionEnded ? (
          <div className="auction-ended-badge">
            <i className="bi bi-stopwatch-fill"></i> Đã Kết Thúc
          </div>
        ) : (
          <button
            className="btn end-auction-btn"
            onClick={onEndAuction}
          >
            <i className="bi bi-stop-circle"></i> Kết Thúc Đấu Giá
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionHeader;
