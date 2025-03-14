import React from 'react';

interface AuctionSummaryProps {
  currentRound: number;
  currentPrice: string;
  bidIncrement: string;
  participantsCount: number;
}

/**
 * A reusable component for displaying auction summary information
 */
const AuctionSummary: React.FC<AuctionSummaryProps> = ({
  currentRound,
  currentPrice,
  bidIncrement,
  participantsCount
}) => {
  return (
    <div className="row text-center mb-3">
      <div className="col-md-3">
        <small className="text-muted">Vòng đấu giá</small>
        <h4 className="mb-0">{currentRound}</h4>
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
  );
};

export default AuctionSummary;
