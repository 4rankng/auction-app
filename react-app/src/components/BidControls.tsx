import React, { useState, useEffect } from 'react';

// Add keyframes animation for the bid button
const bidButtonAnimation = `
@keyframes pulse-button {
  0% {
    outline: 0px solid rgba(40, 167, 69, 0);
  }
  50% {
    outline: 3px solid rgba(40, 167, 69, 0.3);
  }
  100% {
    outline: 0px solid rgba(40, 167, 69, 0);
  }
}
`;

interface BidControlsProps {
  bidderName: string;
  bidAmount: string;
  currentPrice: string;
  bidIncrement: string;
  onBidAmountChange: (amount: string) => void;
  onPlaceBid: (amount: string) => void;
  onCancelBid: () => void;
  isPlaceBidDisabled: boolean;
  isCancelBidDisabled?: boolean; // New prop to control when cancel button is disabled
  bidHistoryEmpty?: boolean; // New prop to check if bid history is empty
  bidderTimeLeft?: number; // New prop for bidder countdown timer
  isLastBidder?: boolean; // New prop to check if the selected bidder is the last bidder
  onStartBid?: () => void; // New prop for start bid button action
  isCountdownActive?: boolean; // New prop to control whether the countdown is active
  isStartBidDisabled?: boolean; // New prop to control whether the start bid button is disabled
  bidDuration?: number; // New prop for the initial bid duration
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
  bidderTimeLeft, // No default, should be passed from parent
  isLastBidder = false, // Default to false if not provided
  onStartBid = () => {}, // Default to empty function if not provided
  isCountdownActive = false, // Default to inactive
  isStartBidDisabled = false, // Default to enabled
  bidDuration = 0 // Default to 0
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
        // For the first bid, return the exact current price
        console.log('Base price method selected, returning:', currentPrice);
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

    // Format the amount properly for validation and submission
    let formattedAmount = calculatedAmount;
    if (!formattedAmount.includes('VND')) {
      formattedAmount = `${formattedAmount} VND`;
    }

    // Get the numeric amount without VND
    const numericAmount = formattedAmount.replace(' VND', '');
    console.log('Validating bid amount:', numericAmount);

    // Validate the bid amount
    if (!validateBid(numericAmount)) {
      console.log('Bid validation failed');
      return;
    }

    // Update the bid amount in the parent component
    console.log('Setting bid amount:', numericAmount);
    onBidAmountChange(numericAmount);

    // Call the parent's onPlaceBid function with the validated amount
    console.log('Calling onPlaceBid with amount:', numericAmount);
    onPlaceBid(numericAmount);

    // Reset the form after successful submission
    if (bidMethod === 'customPrice') {
      setCustomBidAmount('');
    }

    // Reset validation error
    setValidationError(null);
  };

  // Handle step increment/decrement
  const handleStepIncrement = () => {
    const newSteps = steps + 1;
    setSteps(newSteps);

    // Immediately update the bid amount if stepPrice method is selected
    if (bidMethod === 'stepPrice') {
      const stepPrice = (currentPriceValue + (bidIncrementValue * newSteps));
      onBidAmountChange(stepPrice.toLocaleString('vi-VN'));
    }
  };

  const handleStepDecrement = () => {
    if (steps > 1) {
      const newSteps = steps - 1;
      setSteps(newSteps);

      // Immediately update the bid amount if stepPrice method is selected
      if (bidMethod === 'stepPrice') {
        const stepPrice = (currentPriceValue + (bidIncrementValue * newSteps));
        onBidAmountChange(stepPrice.toLocaleString('vi-VN'));
      }
    }
  };

  // Handle custom bid amount change with formatting
  const handleCustomBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the raw value directly from the input
    const inputValue = e.target.value;

    // Remove non-numeric characters to get only the digits
    const numericValue = inputValue.replace(/\D/g, '');

    // Format with thousand separators without using parseInt
    // This preserves the exact digits and their order
    if (numericValue) {
      // Use a number formatter to add thousand separators
      const formattedValue = new Intl.NumberFormat('vi-VN').format(Number(numericValue));
      setCustomBidAmount(formattedValue);

      // Update parent's bid amount if we're in custom price mode
      if (bidMethod === 'customPrice') {
        onBidAmountChange(formattedValue);
      }
    } else {
      setCustomBidAmount('');

      // Clear parent's bid amount if we're in custom price mode
      if (bidMethod === 'customPrice') {
        onBidAmountChange('');
      }
    }
  };

  // Get color for countdown timer based on time left
  const getTimerColor = () => {
    const timeLeft = bidderTimeLeft || 0; // Default to 0 if undefined
    if (timeLeft <= 10) return '#dc3545'; // red for last 10 seconds
    if (timeLeft <= 30) return '#ffc107'; // yellow for 30-10 seconds
    return '#212529'; // dark gray/black to match auction header (default color)
  };

  // Check if the bid button should be disabled
  const isBidButtonDisabled = () => {
    if (isPlaceBidDisabled) return true;
    if (!bidderName) return true;
    if ((bidderTimeLeft || 0) <= 0) return true; // Default to 0 if undefined
    if (bidMethod === 'customPrice' && !customBidAmount) return true;
    if (isLastBidder) return true; // Disable if this is the last bidder
    return false;
  };

  // Use bidDuration if timer is not active yet
  const displayTime = isCountdownActive ? (bidderTimeLeft || 0) : (bidDuration || 30); // Default to 30 seconds if bidDuration is not provided

  // Format timer to mm:ss format
  const formatTimeLeft = (seconds: number): string => {
    if (seconds === undefined || seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Reusable timer component
  const BidderTimer = () => (
    <div
      style={{
        backgroundColor: isCountdownActive ? 'rgba(240, 240, 240, 0.9)' : 'rgba(245, 245, 245, 0.9)',
        borderRadius: '6px',
        padding: '0.25rem 0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        animation: isCountdownActive ? 'time-shimmer 2s infinite' : 'none',
        border: '1px solid rgba(60, 60, 60, 0.2)',
        minWidth: '90px',
        justifyContent: 'center',
        height: '31px', // Match the height of other form controls
        fontSize: '1rem',
        fontWeight: 'bold'
      }}
    >
      <i className="bi bi-clock" style={{
        color: isCountdownActive ? getTimerColor() : '#6c757d',
        fontSize: '1rem'
      }}></i>
      <span style={{
        fontWeight: 'bold',
        color: isCountdownActive ? getTimerColor() : '#6c757d'
      }}>
        {formatTimeLeft(displayTime)}
      </span>
    </div>
  );

  return (
    <div className="position-relative border-0" style={{
      padding: '1rem',
      marginTop: '1rem',
      marginBottom: '1rem',
      backgroundColor: 'transparent',
      borderTop: '1px solid rgba(0,0,0,0.125)'
    }}>
      {/* Add style element for animation */}
      <style>{bidButtonAnimation}</style>

      {/* Start Bid Button and Timer Section in top-left corner */}
      <div
        className="d-flex flex-wrap align-items-center mb-3"
        style={{
          zIndex: 10,
        }}
      >
        {/* Start Bid Button - Less prominent styling but with Đấu Giá button style */}
        <button
          className="btn fw-bold me-2 mb-2 app-btn app-btn-success"
          style={{
            minWidth: '120px',
            padding: '4px 14px',
            fontSize: '0.95rem',
            backgroundColor: isCountdownActive || isStartBidDisabled ? '#e9ecef' : '#f8f9fa',
            color: isCountdownActive || isStartBidDisabled ? '#6c757d' : '#28a745',
            border: '1px solid ' + (isCountdownActive || isStartBidDisabled ? '#ced4da' : '#28a745'),
            borderRadius: '0.35rem',
            boxShadow: 'none',
            fontWeight: 'bold',
            height: '31px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isCountdownActive || isStartBidDisabled ? 0.7 : 1
          }}
          onClick={onStartBid}
          disabled={isStartBidDisabled || isCountdownActive}
        >
           Bắt Đầu
        </button>

        {/* Timer next to the start button */}
        <div className="mb-2">
          <BidderTimer />
        </div>
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
                style={{ height: '31px' }}
              />
            </div>
          </div>
          <div className="col-md-9">
            <label className="form-label mb-1">Phương Thức Trả Giá</label>
            <div className="d-flex flex-wrap">
              {/* Replace radio buttons with styled buttons */}
              {bidHistoryEmpty && (
                <button
                  type="button"
                  className={`btn me-2 mb-2 ${bidMethod === 'basePrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    setBidMethod('basePrice');
                    // Update bid amount to current price
                    onBidAmountChange(currentPrice);
                  }}
                  disabled={!bidHistoryEmpty}
                  style={{
                    minWidth: '140px',
                    fontWeight: bidMethod === 'basePrice' ? 'bold' : 'normal',
                    boxShadow: 'none',
                    outline: bidMethod === 'basePrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                    backgroundColor: bidMethod === 'basePrice' ? '#C0C0C0' : 'white',
                    borderColor: bidMethod === 'basePrice' ? '#A9A9A9' : '#6c757d',
                    color: '#333',
                    height: '38px'
                  }}
                >
                  <i className={`bi ${bidMethod === 'basePrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                  Giá Ban Đầu
                </button>
              )}
              <button
                type="button"
                className={`btn me-2 mb-2 ${bidMethod === 'stepPrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setBidMethod('stepPrice');
                  // Update bid amount based on steps
                  const stepPrice = (currentPriceValue + (bidIncrementValue * steps));
                  onBidAmountChange(stepPrice.toLocaleString('vi-VN'));
                }}
                style={{
                  minWidth: '140px',
                  fontWeight: bidMethod === 'stepPrice' ? 'bold' : 'normal',
                  boxShadow: 'none',
                  outline: bidMethod === 'stepPrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                  backgroundColor: bidMethod === 'stepPrice' ? '#C0C0C0' : 'white',
                  borderColor: bidMethod === 'stepPrice' ? '#A9A9A9' : '#6c757d',
                  color: '#333',
                  height: '38px'
                }}
              >
                <i className={`bi ${bidMethod === 'stepPrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                Bước Giá
              </button>
              <button
                type="button"
                className={`btn me-2 mb-2 ${bidMethod === 'customPrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setBidMethod('customPrice');
                  // Initialize with empty string or current value if we're already in custom mode
                  const initialValue = bidMethod === 'customPrice' ? customBidAmount : '';
                  setCustomBidAmount(initialValue);
                  onBidAmountChange(initialValue);
                }}
                style={{
                  minWidth: '140px',
                  fontWeight: bidMethod === 'customPrice' ? 'bold' : 'normal',
                  boxShadow: 'none',
                  outline: bidMethod === 'customPrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                  backgroundColor: bidMethod === 'customPrice' ? '#C0C0C0' : 'white',
                  borderColor: bidMethod === 'customPrice' ? '#A9A9A9' : '#6c757d',
                  color: '#333',
                  height: '38px'
                }}
              >
                <i className={`bi ${bidMethod === 'customPrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                Nhập
              </button>
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

        {/* Bid controls row */}
        <div className="row mb-3 align-items-end">
          {bidMethod === 'basePrice' && (
            <>
              <div className="col-md-8">
                <div className="d-flex align-items-end">
                  <div style={{ minWidth: '200px' }}>
                    <div className="form-group mb-0">
                      <label className="form-label mb-1">Giá Trả</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={currentPrice}
                        readOnly
                        style={{ height: '31px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {bidMethod === 'stepPrice' && (
            <>
              <div className="col-md-8">
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-end flex-wrap">
                  <div className="me-md-3 mb-2" style={{ minWidth: '120px' }}>
                    <div className="form-group mb-0">
                      <label className="form-label mb-1">Số Bước Giá</label>
                      <div className="input-group input-group-sm">
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={handleStepDecrement}
                          style={{
                            height: '31px',
                            width: '31px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.25rem 0 0 0.25rem'
                          }}
                        >
                          <i className="bi bi-caret-down-fill"></i>
                        </button>
                        <input
                          type="text"
                          className="form-control text-center"
                          value={steps}
                          onChange={(e) => {
                            const newSteps = parseInt(e.target.value) || 1;
                            setSteps(newSteps);

                            // Update bid amount if stepPrice method is selected
                            if (bidMethod === 'stepPrice') {
                              const stepPrice = (currentPriceValue + (bidIncrementValue * newSteps));
                              onBidAmountChange(stepPrice.toLocaleString('vi-VN'));
                            }
                          }}
                          style={{
                            maxWidth: '35px',
                            height: '31px',
                            padding: '0.25rem',
                            borderRadius: '0',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={handleStepIncrement}
                          style={{
                            height: '31px',
                            width: '31px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0 0.25rem 0.25rem 0'
                          }}
                        >
                          <i className="bi bi-caret-up-fill"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2" style={{ minWidth: '200px' }}>
                    <div className="form-group mb-0">
                      <label className="form-label mb-1">Giá Trả</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={`${(currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN')} VND`}
                        readOnly
                        style={{ height: '31px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {bidMethod === 'customPrice' && (
            <>
              <div className="col-md-8">
                <div className="d-flex align-items-end">
                  <div style={{ minWidth: '250px' }}>
                    <div className="form-group mb-0">
                      <label className="form-label mb-1">Nhập Giá Trả</label>
                      <div className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          value={customBidAmount}
                          onChange={handleCustomBidChange}
                          placeholder="Nhập số tiền"
                          style={{ height: '31px' }}
                        />
                        <span className="input-group-text" style={{ height: '31px' }}>VND</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons row - separate row for buttons */}
        <div className="row mt-3">
          <div className="col-12 d-flex flex-wrap justify-content-end">
            <button
              className="btn fw-bold me-2 mb-2 app-btn app-btn-success"
              style={{
                minWidth: '120px',
                padding: '10px 20px',
                fontSize: '1.1rem',
                transform: isBidButtonDisabled() ? 'none' : 'translateY(-2px)',
                animation: isBidButtonDisabled() ? 'none' : 'pulse-button 2s infinite',
              }}
              onClick={handleSubmit}
              disabled={isBidButtonDisabled()}
              onMouseEnter={(e) => {
                if (!isBidButtonDisabled()) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.animation = 'none'; // Pause animation on hover
                }
              }}
              onMouseLeave={(e) => {
                if (!isBidButtonDisabled()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.animation = 'pulse-button 2s infinite'; // Resume animation
                }
              }}
            >
              <i className="bi bi-check-circle me-2"></i> Đấu Giá
            </button>
            <button
              className="btn fw-bold mb-2 app-btn app-btn-danger"
              style={{
                minWidth: '180px',
                padding: '8px 15px',
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

export default React.memo(BidControls);
