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
  // Calculate the progress percentage for the round progress bar
  const roundProgressPercentage = (currentRound / 6) * 100;

  return (
    <div className="auction-summary mb-3">
      <div className="row text-center mb-2">
        <div className="col-md-3">
          <small className="text-muted">Vòng đấu giá</small>
          <div className="d-flex align-items-center justify-content-center">
            <h4 className="mb-0 me-2">{currentRound}</h4>
            <small className="text-muted">/6</small>
          </div>
          <div className="progress mt-1" style={{ height: '6px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${roundProgressPercentage}%` }}
              aria-valuenow={currentRound}
              aria-valuemin={1}
              aria-valuemax={6}>
            </div>
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
      {currentRound >= 6 && (
        <div className="alert alert-warning py-1 text-center mb-0">
          <small><i className="bi bi-exclamation-triangle-fill me-1"></i> Đây là vòng đấu giá cuối cùng</small>
        </div>
      )}
    </div>
  );
};

export default AuctionSummary;
