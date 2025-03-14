import React from 'react';

interface AuctionSummaryProps {
  totalBids: number;
  currentPrice: string;
  bidIncrement: string;
  participantsCount: number;
}

/**
 * A reusable component for displaying auction summary information
 */
const AuctionSummary: React.FC<AuctionSummaryProps> = ({
  totalBids,
  currentPrice,
  bidIncrement,
  participantsCount
}) => {
  return (
    <div className="auction-summary mb-3">
      <div className="row text-center mb-2">
        <div className="col-md-3">
          <small className="text-muted">Lượt Trả Giá</small>
          <div className="d-flex align-items-center justify-content-center">
            <h4 className="mb-0">{totalBids}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <small className="text-muted">Giá hiện tại</small>
          <h4 className="mb-0">{currentPrice}</h4>
        </div>
        <div className="col-md-3">
          <small className="text-muted">Bước giá</small>
          <h4 className="mb-0">{bidIncrement}</h4>
        </div>
        <div className="col-md-3">
          <small className="text-muted">Người tham gia</small>
          <h4 className="mb-0">{participantsCount}</h4>
        </div>
      </div>
    </div>
  );
};

export default AuctionSummary;
