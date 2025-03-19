import React, { useState, useEffect } from 'react';
import './BidControls.css';

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

@keyframes time-shimmer {
  0% {
    background-color: rgba(141, 141, 141, 0.1);
  }
  50% {
    background-color: rgba(141, 141, 141, 0.2);
  }
  100% {
    background-color: rgba(141, 141, 141, 0.1);
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
  isCancelBidDisabled?: boolean;
  bidHistoryEmpty?: boolean;
  isLastBidder?: boolean;
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
  isCancelBidDisabled = false,
  bidHistoryEmpty = true,
  isLastBidder = false
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

  // Add state to track screen size
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  // Check screen size on mount and when window is resized
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Function to get button text based on screen size
  const getButtonText = (text: string): string => {
    return isSmallScreen ? '' : text;
  };

  // Function to get button width based on screen size
  const getButtonWidth = (defaultWidth: string, iconOnlyWidth: string = '76px'): string => {
    return isSmallScreen ? iconOnlyWidth : defaultWidth;
  };

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
              {/* Replace radio buttons with styled buttons */}
              {bidHistoryEmpty && (
                <button
                  type="button"
                  className={`btn me-2 ${bidMethod === 'basePrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    setBidMethod('basePrice');
                    // Update bid amount to current price
                    onBidAmountChange(currentPrice);
                  }}
                  disabled={!bidHistoryEmpty}
                  style={{
                    minWidth: getButtonWidth('140px'),
                    fontWeight: bidMethod === 'basePrice' ? 'bold' : 'normal',
                    boxShadow: 'none',
                    outline: bidMethod === 'basePrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                    backgroundColor: bidMethod === 'basePrice' ? '#C0C0C0' : 'white',
                    borderColor: bidMethod === 'basePrice' ? '#A9A9A9' : '#6c757d',
                    color: '#333'
                  }}
                >
                  <i className={`bi ${bidMethod === 'basePrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                  <i className="bi bi-tag-fill me-1"></i>
                  {getButtonText('Trả Bằng Giá Ban Đầu')}
                </button>
              )}
              <button
                type="button"
                className={`btn me-2 ${bidMethod === 'stepPrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setBidMethod('stepPrice');
                  // Update bid amount based on steps
                  const stepPrice = (currentPriceValue + (bidIncrementValue * steps));
                  onBidAmountChange(stepPrice.toLocaleString('vi-VN'));
                }}
                style={{
                  minWidth: getButtonWidth('140px'),
                  fontWeight: bidMethod === 'stepPrice' ? 'bold' : 'normal',
                  boxShadow: 'none',
                  outline: bidMethod === 'stepPrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                  backgroundColor: bidMethod === 'stepPrice' ? '#C0C0C0' : 'white',
                  borderColor: bidMethod === 'stepPrice' ? '#A9A9A9' : '#6c757d',
                  color: '#333'
                }}
              >
                <i className={`bi ${bidMethod === 'stepPrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                <i className="bi bi-graph-up-arrow me-1"></i>
                {getButtonText('Trả Theo Bước Giá')}
              </button>
              <button
                type="button"
                className={`btn ${bidMethod === 'customPrice' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => {
                  setBidMethod('customPrice');
                  // Update bid amount only if customBidAmount has a value
                  if (customBidAmount) {
                    onBidAmountChange(customBidAmount);
                  }
                }}
                style={{
                  minWidth: getButtonWidth('140px'),
                  fontWeight: bidMethod === 'customPrice' ? 'bold' : 'normal',
                  boxShadow: 'none',
                  outline: bidMethod === 'customPrice' ? '1px solid rgba(13, 110, 253, 0.25)' : 'none',
                  backgroundColor: bidMethod === 'customPrice' ? '#C0C0C0' : 'white',
                  borderColor: bidMethod === 'customPrice' ? '#A9A9A9' : '#6c757d',
                  color: '#333'
                }}
              >
                <i className={`bi ${bidMethod === 'customPrice' ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                <i className="bi bi-pencil-fill me-1"></i>
                {getButtonText('Nhập Giá Trả')}
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

        {/* Bid amount section - unified for all bid methods */}
        <div className="row mb-3 align-items-center">
          <div className="d-flex">
            {/* Unified Giá Trả component */}
            <div className="col-md-5">
              <div className="form-group mb-0">
                <label className="form-label mb-1">Giá Trả</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    style={{
                      fontWeight: 'bold',
                      border: '1px solid #ced4da'
                    }}
                    value={bidMethod === 'customPrice'
                      ? customBidAmount
                      : bidMethod === 'basePrice'
                        ? currentPrice.replace(' VND', '')
                        : (currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN')
                    }
                    onChange={bidMethod === 'customPrice' ? handleCustomBidChange : undefined}
                    placeholder={bidMethod === 'customPrice' ? "Nhập số tiền" : ""}
                    readOnly={bidMethod !== 'customPrice'}
                  />
                  <span className="input-group-text">VND</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step controls and action buttons moved to a new row */}
        <div className="row mb-3">
          <div className="col d-flex align-items-center">
            {/* Step buttons */}
            {bidMethod === 'stepPrice' && (
              <div className="me-3 d-flex">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleStepDecrement}
                  style={{ height: '38px', width: '38px' }}
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
                    width: '50px',
                    height: '38px',
                    padding: '0.25rem 0.5rem',
                    margin: '0 1px'
                  }}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={handleStepIncrement}
                  style={{ height: '38px', width: '38px' }}
                >
                  <i className="bi bi-caret-up-fill"></i>
                </button>
              </div>
            )}

            {/* Action buttons */}
            <button
              className="btn fw-bold me-2 app-btn app-btn-success"
              style={{
                minWidth: getButtonWidth('120px'),
                padding: '8px 15px',
                fontSize: '1.1rem',
                height: '38px'
              }}
              onClick={handleSubmit}
              disabled={isPlaceBidDisabled}
            >
              <i className="bi bi-check-circle me-2"></i>
              {getButtonText('Đấu Giá')}
            </button>
            <button
              className="btn fw-bold app-btn app-btn-danger"
              style={{
                minWidth: getButtonWidth('120px'),
                padding: '8px 15px',
                height: '38px'
              }}
              onClick={onCancelBid}
              disabled={isCancelBidDisabled}
            >
              <i className="bi bi-x-circle me-1"></i>
              {getButtonText('Hủy Đấu Giá Cuối')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BidControls);
