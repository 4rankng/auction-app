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
  // Common font styles
  const labelStyle = {
    fontSize: '0.875rem',
    color: '#6c757d',
    fontFamily: 'Roboto, sans-serif'
  };

  const valueStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    fontFamily: 'Roboto, sans-serif'
  };

  return (
    <div className="auction-summary mb-3" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <div className="row text-center mb-2">
        <div className="col-md-3">
          <small className="text-muted" style={labelStyle}>Lượt Trả Giá</small>
          <div className="d-flex align-items-center justify-content-center">
            <h4 className="mb-0" style={valueStyle}>{totalBids === 0 ? "-" : totalBids}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <small className="text-muted" style={labelStyle}>Giá hiện tại</small>
          <h4 className="mb-0" style={valueStyle}>{currentPrice}</h4>
        </div>
        <div className="col-md-3">
          <small className="text-muted" style={labelStyle}>Bước giá</small>
          <h4 className="mb-0" style={valueStyle}>{bidIncrement}</h4>
        </div>
        <div className="col-md-3">
          <small className="text-muted" style={labelStyle}>Người tham gia</small>
          <h4 className="mb-0" style={valueStyle}>{participantsCount}</h4>
        </div>
      </div>
    </div>
  );
};

export default AuctionSummary;
