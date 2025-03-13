import React from 'react';

interface PricingAndDurationProps {
  startingPrice: number;
  priceIncrement: number;
  duration: number;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>, field: 'startingPrice' | 'priceIncrement') => void;
  onDurationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PricingAndDuration: React.FC<PricingAndDurationProps> = React.memo(({ startingPrice, priceIncrement, duration, onPriceChange, onDurationChange }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Pricing and Duration</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Starting Price</label>
          <input
            type="text"
            className="form-control"
            value={startingPrice.toLocaleString('en-US')}
            onChange={(e) => onPriceChange(e, 'startingPrice')}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Price Increment</label>
          <input
            type="number"
            className="form-control"
            min="1"
            step="100"
            value={priceIncrement}
            onChange={(e) => onPriceChange(e, 'priceIncrement')}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Duration (seconds)</label>
          <input
            type="number"
            className="form-control"
            min="1"
            step="60"
            value={duration}
            onChange={onDurationChange}
            required
          />
        </div>
      </div>
    </div>
  );
});

export default PricingAndDuration;
