import React from 'react';

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
        <h3 className="mb-0 me-2 fw-bold" style={{ fontSize: '1.75rem' }}>{title}</h3>
      </div>
      <div className="d-flex align-items-center">
        <div className="text-center me-3 d-flex flex-column align-items-center">

          <h2 className="mb-0 text-success">{elapsedTime}</h2>
        </div>
        {isAuctionEnded ? (
          <div className="badge bg-danger p-2 fs-6">
            <i className="bi bi-stopwatch-fill me-1"></i> Đã Kết Thúc
          </div>
        ) : (
          <button className="btn btn-danger" onClick={onEndAuction}>
            <i className="bi bi-stop-circle me-1"></i> Kết Thúc Đấu Giá
          </button>
        )}
      </div>
    </div>
  );
};

export default AuctionHeader;
