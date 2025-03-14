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
  isCancelBidDisabled?: boolean; // New prop to control when cancel button is disabled
  bidHistoryEmpty?: boolean; // New prop to check if bid history is empty
  bidderTimeLeft?: number; // New prop for bidder countdown timer
  isLastBidder?: boolean; // New prop to check if the selected bidder is the last bidder
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
  isPlaceBidDisabled,
  isCancelBidDisabled = false, // Default to enabled
  bidHistoryEmpty = true, // Default to true if not provided
  bidderTimeLeft = 60, // Default to 60 seconds if not provided
  isLastBidder = false // Default to false if not provided
}) => {
  // State for bid method selection - default to stepPrice if bid history is not empty
  const [bidMethod, setBidMethod] = useState<'basePrice' | 'stepPrice' | 'customPrice'>(
    bidHistoryEmpty ? 'basePrice' : 'stepPrice'
  );

  // State for number of steps when using incremental bidding
  const [steps, setSteps] = useState<number>(1);

  // State for custom bid amount
  const [customBidAmount, setCustomBidAmount] = useState<string>('');

  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Parse current price and bid increment to numbers for calculations
  const currentPriceValue = parseInt(currentPrice.replace(/\D/g, '')) || 0;
  const bidIncrementValue = parseInt(bidIncrement.replace(/\D/g, '')) || 0;

  // Update bid method when bid history changes
  useEffect(() => {
    if (!bidHistoryEmpty && bidMethod === 'basePrice') {
      setBidMethod('stepPrice');
    }
  }, [bidHistoryEmpty, bidMethod]);

  // Calculate bid amount based on selected method
  const calculateBidAmount = () => {
    switch (bidMethod) {
      case 'basePrice':
        return currentPrice;
      case 'stepPrice': {
        // Calculate the step price and ensure it's properly formatted
        const stepPrice = (currentPriceValue + (bidIncrementValue * steps));
        console.log('Calculated step price:', stepPrice, 'from current:', currentPriceValue, 'increment:', bidIncrementValue, 'steps:', steps);
        return stepPrice.toLocaleString('vi-VN');
      }
      case 'customPrice':
        return customBidAmount;
      default:
        return currentPrice;
    }
  };

  // Validate bid amount
  const validateBid = (amount: string): boolean => {
    setValidationError(null);

    if (!amount) {
      setValidationError('Vui lòng nhập số tiền');
      return false;
    }

    // Parse the amount (remove non-numeric characters)
    const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;

    // Different validation based on bid history
    if (bidHistoryEmpty) {
      // If bid history is empty, check if the price is >= the current price
      if (numericAmount < currentPriceValue) {
        setValidationError('Giá trả phải lớn hơn hoặc bằng giá ban đầu');
        return false;
      }
    } else {
      // If bid history is not empty, check if the price is greater than the current price
      if (numericAmount <= currentPriceValue) {
        setValidationError(`Giá trả phải cao hơn giá hiện tại`);
        return false;
      }

      // Check if the bid meets the minimum increment requirement
      if (numericAmount < currentPriceValue + bidIncrementValue) {
        setValidationError(`Giá trả phải cao hơn giá hiện tại ít nhất ${bidIncrement}`);
        return false;
      }
    }

    return true;
  };

  // Handle bid submission
  const handleSubmit = () => {
    // Calculate the bid amount based on the selected method
    const calculatedAmount = calculateBidAmount();
    console.log('Calculated bid amount:', calculatedAmount);

    // For step price method, we don't need additional validation as the amount is calculated correctly
    if (bidMethod === 'stepPrice') {
      // Format the amount properly
      let formattedAmount = calculatedAmount;
      if (!formattedAmount.includes('VND')) {
        formattedAmount = `${formattedAmount} VND`;
      }

      // Get the numeric amount without VND
      const numericAmount = formattedAmount.replace(' VND', '');
      console.log('Setting bid amount for step price:', numericAmount);

      // Update the bid amount in the parent component
      onBidAmountChange(numericAmount);

      // Call the parent's onPlaceBid function with a small delay to ensure state is updated
      setTimeout(() => {
        console.log('Calling onPlaceBid with amount:', numericAmount);
        onPlaceBid();
      }, 10);

      // Reset steps
      setSteps(1);

      // Reset validation error
      setValidationError(null);
      return;
    }

    // For other methods, validate the bid
    if (!validateBid(calculatedAmount)) {
      return;
    }

    // If bidder name is empty, show error
    if (!bidderName) {
      setValidationError('Vui lòng chọn người đấu giá');
      return;
    }

    // If time is up, show error
    if (bidderTimeLeft <= 0) {
      setValidationError('Thời gian đấu giá đã kết thúc');
      return;
    }

    // Format the amount properly
    let formattedAmount = calculatedAmount;
    if (!formattedAmount.includes('VND')) {
      formattedAmount = `${formattedAmount} VND`;
    }

    // Get the numeric amount without VND
    const numericAmount = formattedAmount.replace(' VND', '');
    console.log('Setting bid amount for custom price:', numericAmount);

    // Update the bid amount in the parent component
    onBidAmountChange(numericAmount);

    // Call the parent's onPlaceBid function with a small delay to ensure state is updated
    setTimeout(() => {
      console.log('Calling onPlaceBid with amount:', numericAmount);
      onPlaceBid();
    }, 10);

    // Reset the form after successful submission
    if (bidMethod === 'customPrice') {
      setCustomBidAmount('');
    }

    // Reset validation error
    setValidationError(null);
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

  // Handle custom bid amount change with formatting
  const handleCustomBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters
    const numericValue = e.target.value.replace(/\D/g, '');

    // Format with thousand separators
    if (numericValue) {
      const formattedValue = parseInt(numericValue).toLocaleString('vi-VN');
      setCustomBidAmount(formattedValue);
    } else {
      setCustomBidAmount('');
    }
  };

  // Get color for countdown timer based on time left
  const getTimerColor = () => {
    if (bidderTimeLeft <= 10) return '#dc3545'; // red for last 10 seconds
    if (bidderTimeLeft <= 30) return '#ffc107'; // yellow for 30-10 seconds
    return '#28a745'; // green for > 30 seconds
  };

  // Check if the bid button should be disabled
  const isBidButtonDisabled = () => {
    if (isPlaceBidDisabled) return true;
    if (!bidderName) return true;
    if (bidderTimeLeft <= 0) return true;
    if (bidMethod === 'customPrice' && !customBidAmount) return true;
    if (isLastBidder) return true; // Disable if this is the last bidder
    return false;
  };

  return (
    <div className="position-relative border-0" style={{
      padding: '1rem',
      marginTop: '1rem',
      marginBottom: '1rem',
      backgroundColor: 'transparent',
      borderTop: '1px solid rgba(0,0,0,0.125)'
    }}>
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
        <span className="countdown-timer">{bidderTimeLeft}s</span>
      </div>

      <div>
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
              {/* Only show base price option if bid history is empty */}
              {bidHistoryEmpty && (
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="bidMethod"
                    id="basePrice"
                    value="basePrice"
                    checked={bidMethod === 'basePrice'}
                    onChange={() => setBidMethod('basePrice')}
                    disabled={!bidHistoryEmpty} // Disable if bid history is not empty
                  />
                  <label className="form-check-label" htmlFor="basePrice">
                    Trả Bằng Giá Ban Đầu
                  </label>
                </div>
              )}
              <div className="form-check form-check-inline">
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
              <div className="form-check form-check-inline">
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

        {/* Validation error message */}
        {validationError && (
          <div className="alert alert-danger py-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {validationError}
          </div>
        )}

        {/* Bid amount section - changes based on selected method */}
        <div className="row mb-3 align-items-end">
          {bidMethod === 'basePrice' && (
            <div className="col-md-4">
              <div className="form-group mb-0">
                <label className="form-label mb-1">Giá Trả</label>
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
                      <i className="bi bi-caret-down-fill"></i>
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
                      <i className="bi bi-caret-up-fill"></i>
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
                    onChange={handleCustomBidChange}
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
              disabled={isBidButtonDisabled()}
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
              disabled={isCancelBidDisabled}
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
