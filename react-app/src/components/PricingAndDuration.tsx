import React from 'react';

interface PricingAndDurationProps {
  startingPrice: number;
  priceIncrement: number;
  duration: number;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Format numbers with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};

const PricingAndDuration: React.FC<PricingAndDurationProps> = ({
  startingPrice,
  priceIncrement,
  duration,
  onPriceChange,
  onDurationChange
}) => {
  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">Giá & Thời Gian</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Giá Khởi Điểm (VND)</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={formatNumber(startingPrice)}
              onChange={(e) => onPriceChange(e, 'startingPrice')}
              required
            />
            <span className="input-group-text">VND</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Bước Giá Tối Thiểu (VND)</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={formatNumber(priceIncrement)}
              onChange={(e) => onPriceChange(e, 'priceIncrement')}
              required
            />
            <span className="input-group-text">VND</span>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Thời Gian Đấu Giá (giây)</label>
          <input
            type="number"
            className="form-control"
            value={duration}
            onChange={onDurationChange}
            min="60"
            required
          />
          <small className="form-text text-muted">Thời gian tối thiểu là 60 giây.</small>
        </div>
      </div>
    </div>
  );
};

export default PricingAndDuration;
