import React from 'react';

interface AuctionHeaderProps {
  title: string;
  timeLeft: string;
  onEndAuction: () => void;
}

/**
 * A reusable component for displaying the auction header with title, status, timer and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  timeLeft,
  onEndAuction
}) => {
  return (
    <div className="card-header d-flex justify-content-between align-items-center py-2">
      <div className="d-flex align-items-center">
        <h5 className="mb-0 me-2">{title}</h5>
        <span className="badge bg-success">Đang diễn ra</span>
      </div>
      <div className="d-flex align-items-center">
        <div className="text-center me-3">
          <h2 className="text-success mb-0">{timeLeft}</h2>
        </div>
        <button className="btn btn-danger" onClick={onEndAuction}>
          <i className="bi bi-stop-circle me-1"></i> Kết Thúc Đấu Giá
        </button>
      </div>
    </div>
  );
};

export default AuctionHeader;
