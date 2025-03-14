import React, { useState, useEffect } from 'react';

interface BidControlsProps {
  bidderName: string;
  bidAmount: string;
  currentPrice: string;
  bidIncrement: string;
  onBidAmountChange: (amount: string) => void;
  onPlaceBid: () => void;
  onCancelBid: () => void;
  isPlaceBidDisabled: boolean;
}

/**
 * A reusable component for bid controls including name, price inputs and action buttons
 * Incorporates three bidding methods: Base Price, Incremental Steps, and Custom Bid
 */
const BidControls: React.FC<BidControlsProps> = ({
  bidderName,
  bidAmount,
  currentPrice,
  bidIncrement,
  onBidAmountChange,
  onPlaceBid,
  onCancelBid,
  isPlaceBidDisabled
}) => {
  // State for bid method selection
  const [bidMethod, setBidMethod] = useState<'basePrice' | 'stepPrice' | 'customPrice'>('basePrice');

  // State for number of steps when using incremental bidding
  const [steps, setSteps] = useState<number>(1);

  // State for custom bid amount
  const [customBidAmount, setCustomBidAmount] = useState<string>('');

  // State for time left (in seconds)
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Parse current price and bid increment to numbers for calculations
  const currentPriceValue = parseInt(currentPrice.replace(/\D/g, '')) || 0;
  const bidIncrementValue = parseInt(bidIncrement.replace(/\D/g, '')) || 0;

  // Calculate bid amount based on selected method
  const calculateBidAmount = () => {
    switch (bidMethod) {
      case 'basePrice':
        return currentPrice;
      case 'stepPrice':
        return (currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN');
      case 'customPrice':
        return customBidAmount;
      default:
        return currentPrice;
    }
  };

  // Handle bid submission
  const handleSubmit = () => {
    const calculatedAmount = calculateBidAmount();
    onBidAmountChange(calculatedAmount);
    onPlaceBid();
  };

  // Handle step increment/decrement
  const handleStepIncrement = () => {
    setSteps(prev => prev + 1);
  };

  const handleStepDecrement = () => {
    if (steps > 1) {
      setSteps(prev => prev - 1);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get color for countdown timer based on time left
  const getTimerColor = () => {
    if (timeLeft <= 10) return '#dc3545'; // red for last 10 seconds
    if (timeLeft <= 30) return '#ffc107'; // yellow for 30-10 seconds
    return '#28a745'; // green for > 30 seconds
  };

  return (
    <div className="card p-3 my-3 position-relative">
      {/* Countdown Timer */}
      <div
        className="position-absolute"
        style={{
          top: '15px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          color: getTimerColor(),
          transition: 'color 0.5s ease'
        }}
      >
        <i className="bi bi-clock me-1"></i>
        <span className="countdown-timer">{timeLeft}s</span>
      </div>

      <div className="card-body">
        {/* Top row with bidder name and bid method selection */}
        <div className="row mb-3 align-items-center">
          <div className="col-md-3">
            <div className="form-group mb-0">
              <label htmlFor="bidderName" className="form-label mb-1">Mã Số / Tên</label>
              <input
                type="text"
                className="form-control form-control-sm"
                id="bidderName"
                value={bidderName}
                readOnly
              />
            </div>
          </div>
          <div className="col-md-9">
            <label className="form-label mb-1">Phương Thức Trả Giá</label>
            <div className="d-flex">
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="bidMethod"
                  id="basePrice"
                  value="basePrice"
                  checked={bidMethod === 'basePrice'}
                  onChange={() => setBidMethod('basePrice')}
                />
                <label className="form-check-label" htmlFor="basePrice">
                  Trả Bằng Giá Khởi Điểm
                </label>
              </div>
              <div className="form-check me-3">
                <input
                  className="form-check-input"
                  type="radio"
                  name="bidMethod"
                  id="stepPrice"
                  value="stepPrice"
                  checked={bidMethod === 'stepPrice'}
                  onChange={() => setBidMethod('stepPrice')}
                />
                <label className="form-check-label" htmlFor="stepPrice">
                  Trả Theo Bước Giá
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="bidMethod"
                  id="customPrice"
                  value="customPrice"
                  checked={bidMethod === 'customPrice'}
                  onChange={() => setBidMethod('customPrice')}
                />
                <label className="form-check-label" htmlFor="customPrice">
                  Nhập Giá Trả
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bid amount section - changes based on selected method */}
        <div className="row mb-3 align-items-end">
          {bidMethod === 'basePrice' && (
            <div className="col-md-4">
              <div className="form-group mb-0">
                <label className="form-label mb-1">Giá Khởi Điểm</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={currentPrice}
                  readOnly
                />
              </div>
            </div>
          )}

          {bidMethod === 'stepPrice' && (
            <>
              <div className="col-md-3">
                <div className="form-group mb-0">
                  <label className="form-label mb-1">Số Bước Giá</label>
                  <div className="input-group input-group-sm">
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleStepDecrement}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      className="form-control text-center"
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value) || 1)}
                      style={{ maxWidth: '60px' }}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleStepIncrement}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group mb-0">
                  <label className="form-label mb-1">Giá Trả</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={`${(currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN')} VND`}
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          {bidMethod === 'customPrice' && (
            <div className="col-md-4">
              <div className="form-group mb-0">
                <label className="form-label mb-1">Nhập Giá Trả</label>
                <div className="input-group input-group-sm">
                  <input
                    type="text"
                    className="form-control"
                    value={customBidAmount}
                    onChange={(e) => setCustomBidAmount(e.target.value)}
                    placeholder="Nhập số tiền"
                  />
                  <span className="input-group-text">VND</span>
                </div>
              </div>
            </div>
          )}

          <div className="col d-flex justify-content-end">
            <button
              className="btn fw-bold me-2"
              style={{
                minWidth: '120px',
                backgroundColor: '#4a86f7',
                color: 'white',
                borderRadius: '4px',
                padding: '8px 15px'
              }}
              onClick={handleSubmit}
              disabled={isPlaceBidDisabled || (bidMethod === 'customPrice' && !customBidAmount)}
            >
              <i className="bi bi-check-circle me-1"></i> Đấu Giá
            </button>
            <button
              className="btn fw-bold"
              style={{
                minWidth: '180px',
                color: '#dc3545',
                backgroundColor: 'white',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                padding: '8px 15px'
              }}
              onClick={onCancelBid}
            >
              <i className="bi bi-x-circle me-1"></i> Hủy Đấu Giá Cuối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidControls;
