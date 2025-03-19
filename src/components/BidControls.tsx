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

  // Common font styles to match AuctionSummary
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
    <div className="bid-controls-container mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Add the style tag with animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: bidButtonAnimation }} />

      {/* Bid Method Selector - Horizontal tabs with smaller size */}
      <div className="bid-method-selector mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span style={labelStyle}>Phương thức đấu giá</span>
          {validationError && (
            <div className="validation-error text-danger">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {validationError}
            </div>
          )}
        </div>

        <div className="btn-group w-100" role="group" style={{ borderRadius: '5px', overflow: 'hidden' }}>
          {/* Only show basePrice button when bidHistoryEmpty is true */}
          {bidHistoryEmpty && (
            <button
              type="button"
              className={`btn btn-sm ${bidMethod === 'basePrice' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setBidMethod('basePrice')}
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '0.85rem',
                padding: '0.25rem 0.5rem',
                transition: 'all 0.3s ease',
                fontWeight: bidMethod === 'basePrice' ? 'bold' : 'normal',
                boxShadow: bidMethod === 'basePrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <i className="bi bi-tag-fill me-1"></i>
              Giá ban đầu
            </button>
          )}

          <button
            type="button"
            className={`btn btn-sm ${bidMethod === 'stepPrice' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setBidMethod('stepPrice')}
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '0.85rem',
              padding: '0.25rem 0.5rem',
              transition: 'all 0.3s ease',
              fontWeight: bidMethod === 'stepPrice' ? 'bold' : 'normal',
              boxShadow: bidMethod === 'stepPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <i className="bi bi-plus-circle-fill me-1"></i>
            Giá từng bước
          </button>

          <button
            type="button"
            className={`btn btn-sm ${bidMethod === 'customPrice' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setBidMethod('customPrice')}
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '0.85rem',
              padding: '0.25rem 0.5rem',
              transition: 'all 0.3s ease',
              fontWeight: bidMethod === 'customPrice' ? 'bold' : 'normal',
              boxShadow: bidMethod === 'customPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <i className="bi bi-pencil-fill me-1"></i>
            Tự nhập
          </button>
        </div>
      </div>

      {/* Different bid inputs based on method */}
      {bidMethod === 'basePrice' && (
        <div className="bid-amount-info mb-3">
          <div style={labelStyle}>Giá ban đầu</div>
          <div className="base-price-display" style={valueStyle}>
            {currentPrice}
          </div>
        </div>
      )}

      {bidMethod === 'stepPrice' && (
        <div className="bid-step-control mb-3">
          <div style={labelStyle}>Giá hiện tại + (Bước giá × Số bước)</div>
          <div className="input-group mt-2">
            <span className="input-group-text" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>
              {currentPrice} + ({bidIncrement} ×
            </span>
            <div className="input-group-text btn-group">
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={handleStepDecrement}
                disabled={steps <= 1}
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.4rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: steps <= 1 ? '#e9ecef' : 'white',
                  borderColor: '#6c757d',
                  opacity: steps <= 1 ? 0.65 : 1
                }}
              >
                <i className="bi bi-dash"></i>
              </button>
              <span className="px-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>{steps}</span>
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={handleStepIncrement}
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.4rem',
                  transition: 'all 0.2s ease',
                  borderColor: '#6c757d'
                }}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
            <span className="input-group-text" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>)</span>
            <span className="input-group-text" style={{
              ...valueStyle,
              fontSize: '1.1rem',
              backgroundColor: '#e9f5ff',
              borderColor: '#b8daff',
              color: '#0d6efd'
            }}>
              = {(currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      )}

      {bidMethod === 'customPrice' && (
        <div className="custom-bid-input mb-3">
          <div style={labelStyle}>Nhập số tiền</div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={customBidAmount}
              onChange={handleCustomBidChange}
              placeholder="Nhập số tiền đấu giá"
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.9rem' }}
            />
            <span className="input-group-text" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '0.85rem' }}>VND</span>
          </div>
          <div className="form-text" style={{ ...labelStyle, fontSize: '0.75rem' }}>
            <i className="bi bi-info-circle me-1"></i>
            Giá đấu phải lớn hơn giá hiện tại ít nhất một bước giá ({bidIncrement})
          </div>
        </div>
      )}

      {/* Buttons for bid actions - reduced size */}
      <div className="bid-action-buttons d-flex flex-row mt-3" style={{ justifyContent: 'center' }}>
        {/* Primary Action Button - Đấu Giá (Place Bid) */}
        <button
          className="btn btn-success"
          disabled={isPlaceBidDisabled}
          onClick={handleSubmit}
          style={{
            padding: '8px 16px',
            borderRadius: '5px',
            fontWeight: 'bold',
            height: '40px',
            backgroundColor: isPlaceBidDisabled ? '#6c757d' : '#28a745',
            border: 'none',
            marginRight: '10px',
            fontFamily: 'Roboto, sans-serif',
            width: getButtonWidth('160px', '80px'),
            opacity: isPlaceBidDisabled ? 0.65 : 1,
            cursor: isPlaceBidDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isPlaceBidDisabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="bi bi-cash-coin me-2"></i>
          {getButtonText('ĐẤU GIÁ')}
        </button>

        {/* Secondary Action Button - Hủy (Cancel) */}
        <button
          className="btn"
          disabled={isCancelBidDisabled}
          onClick={onCancelBid}
          style={{
            padding: '8px 16px',
            borderRadius: '5px',
            fontWeight: 'bold',
            backgroundColor: isCancelBidDisabled ? '#6c757d' : '#dc3545',
            color: 'white',
            height: '40px',
            border: 'none',
            fontFamily: 'Roboto, sans-serif',
            width: getButtonWidth('80px', '40px'),
            opacity: isCancelBidDisabled ? 0.65 : 1,
            cursor: isCancelBidDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isCancelBidDisabled ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <i className="bi bi-x-circle me-2"></i>
          {getButtonText('HỦY')}
        </button>
      </div>
    </div>
  );
};

export default React.memo(BidControls);
