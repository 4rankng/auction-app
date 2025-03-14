import React from 'react';

interface PricingAndDurationProps {
  startingPrice: number;
  priceIncrement: number;
  duration: number;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PricingAndDuration: React.FC<PricingAndDurationProps> = React.memo(({ startingPrice, priceIncrement, duration, onPriceChange, onDurationChange }) => {
  // Format numbers with thousand separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="card-title mb-0">Pricing and Duration</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Starting Price (VND)</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={formatNumber(startingPrice)}
              onChange={(e) => onPriceChange(e, 'startingPrice')}
              placeholder="0"
              required
            />
            <span className="input-group-text">VND</span>
          </div>

        </div>
        <div className="mb-3">
          <label className="form-label">Minimum Bid Increment (VND)</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={formatNumber(priceIncrement)}
              onChange={(e) => onPriceChange(e, 'priceIncrement')}
              placeholder="0"
              required
            />
            <span className="input-group-text">VND</span>
          </div>

        </div>
        <div className="mb-3">
          <label className="form-label">Auction Duration (seconds)</label>
          <input
            type="number"
            className="form-control"
            min="1"
            step="60"
            value={duration}
            onChange={onDurationChange}
            placeholder="0"
            required
          />

        </div>
      </div>
    </div>
  );
});

export default PricingAndDuration;
