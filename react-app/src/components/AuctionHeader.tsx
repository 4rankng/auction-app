import React from 'react';
import './AuctionHeader.css';

interface AuctionHeaderProps {
  title: string;
  elapsedTime: string;
  onEndAuction: () => void;
  totalBids: number;
  isAuctionEnded?: boolean;
}

/**
 * A reusable component for displaying the auction header with title, elapsed time, and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  elapsedTime,
  onEndAuction,
  totalBids,
  isAuctionEnded = false
}) => {
  return (
    <div className="card-header d-flex justify-content-between align-items-center py-3">
      <div className="d-flex align-items-center">
        <h3 className="mb-0 me-2 fw-bold auction-title">{title}</h3>
      </div>
      <div className="d-flex align-items-center">
        <div className="text-center me-3 d-flex flex-column align-items-center">
          <h2 className="mb-0 text-success auction-elapsed-time">{elapsedTime}</h2>
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
