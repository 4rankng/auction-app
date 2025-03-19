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

        <div className="btn-group w-100" role="group" style={{ borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          {/* Only show basePrice button when bidHistoryEmpty is true */}
          {bidHistoryEmpty && (
            <button
              type="button"
              className={`btn btn-sm ${bidMethod === 'basePrice' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setBidMethod('basePrice')}
              style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: '13px',
                padding: '6px 10px',
                transition: 'all 0.3s ease-in-out',
                fontWeight: bidMethod === 'basePrice' ? '500' : 'normal',
                boxShadow: bidMethod === 'basePrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                backgroundColor: bidMethod === 'basePrice' ? '#6c8dae' : '#ffffff',
                color: bidMethod === 'basePrice' ? '#ffffff' : '#6c8dae',
                borderColor: '#d1d3e2'
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
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              padding: '6px 10px',
              transition: 'all 0.3s ease-in-out',
              fontWeight: bidMethod === 'stepPrice' ? '500' : 'normal',
              boxShadow: bidMethod === 'stepPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              backgroundColor: bidMethod === 'stepPrice' ? '#6c8dae' : '#ffffff',
              color: bidMethod === 'stepPrice' ? '#ffffff' : '#6c8dae',
              borderColor: '#d1d3e2'
            }}
          >
            <i className="bi bi-plus-circle-fill me-1"></i>
            Theo Bước Giá
          </button>

          <button
            type="button"
            className={`btn btn-sm ${bidMethod === 'customPrice' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setBidMethod('customPrice')}
            style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              padding: '6px 10px',
              transition: 'all 0.3s ease-in-out',
              fontWeight: bidMethod === 'customPrice' ? '500' : 'normal',
              boxShadow: bidMethod === 'customPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              backgroundColor: bidMethod === 'customPrice' ? '#6c8dae' : '#ffffff',
              color: bidMethod === 'customPrice' ? '#ffffff' : '#6c8dae',
              borderColor: '#d1d3e2'
            }}
          >
            <i className="bi bi-pencil-fill me-1"></i>
            Theo Giá Nhập
          </button>
        </div>
      </div>

      {/* Different bid inputs based on method */}
      {bidMethod === 'basePrice' && (
        <div className="bid-amount-info mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Giá ban đầu</div>
          <div className="base-price-display" style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#6c8dae',
            padding: '10px 14px',
            backgroundColor: '#f0f4f8',
            borderRadius: '4px',
            border: '1px solid #d9e2ec',
            fontFamily: 'Roboto, Arial, sans-serif',
            marginTop: '8px'
          }}>
            {currentPrice}
          </div>
        </div>
      )}

      {bidMethod === 'stepPrice' && (
        <div className="bid-step-control mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Giá hiện tại + (Bước giá × Số bước)</div>
          <div className="input-group mt-2">
            <span className="input-group-text" style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              backgroundColor: '#f8f9fa',
              borderColor: '#e0e0e0'
            }}>
              {currentPrice} + ({bidIncrement} ×
            </span>
            <div className="input-group-text btn-group" style={{ borderColor: '#e0e0e0' }}>
              <button
                className="btn btn-sm"
                type="button"
                onClick={handleStepDecrement}
                disabled={steps <= 1}
                style={{
                  fontFamily: 'Roboto, Arial, sans-serif',
                  fontSize: '13px',
                  padding: '4px 8px',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: steps <= 1 ? '#f8f9fa' : '#ffffff',
                  borderColor: '#e0e0e0',
                  color: '#6c757d',
                  opacity: steps <= 1 ? 0.65 : 1,
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px'
                }}
              >
                <i className="bi bi-dash"></i>
              </button>
              <span className="px-2" style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: '13px',
                color: '#495057',
                display: 'flex',
                alignItems: 'center',
                minWidth: '22px',
                justifyContent: 'center'
              }}>{steps}</span>
              <button
                className="btn btn-sm"
                type="button"
                onClick={handleStepIncrement}
                style={{
                  fontFamily: 'Roboto, Arial, sans-serif',
                  fontSize: '13px',
                  padding: '4px 8px',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: '#ffffff',
                  borderColor: '#e0e0e0',
                  color: '#6c757d',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px'
                }}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
            <span className="input-group-text" style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              backgroundColor: '#f8f9fa',
              borderColor: '#e0e0e0'
            }}>)</span>
            <span className="input-group-text" style={{
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: '#f0f4f8',
              borderColor: '#d9e2ec',
              color: '#6c8dae',
              fontFamily: 'Roboto, Arial, sans-serif'
            }}>
              = {(currentPriceValue + (bidIncrementValue * steps)).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      )}

      {bidMethod === 'customPrice' && (
        <div className="custom-bid-input mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Nhập số tiền</div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={customBidAmount}
              onChange={handleCustomBidChange}
              placeholder="Nhập số tiền đấu giá"
              style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: '14px',
                padding: '8px 12px',
                height: '38px',
                borderColor: '#e0e0e0',
                borderRadius: '4px 0 0 4px',
                boxShadow: 'none',
                transition: 'all 0.2s ease-in-out'
              }}
            />
            <span className="input-group-text" style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              backgroundColor: '#f8f9fa',
              borderColor: '#e0e0e0',
              borderRadius: '0 4px 4px 0',
              height: '38px'
            }}>VND</span>
          </div>
          <div className="form-text" style={{
            color: '#6c757d',
            fontSize: '12px',
            marginTop: '6px',
            fontFamily: 'Roboto, Arial, sans-serif'
          }}>
            <i className="bi bi-info-circle me-1"></i>
            Giá đấu phải lớn hơn giá hiện tại ít nhất một bước giá ({bidIncrement})
          </div>
        </div>
      )}

      {/* Buttons for bid actions - using CSS classes for layout */}
      <div className="bid-action-buttons">
        {/* Primary Action Button - Đấu Giá (Place Bid) */}
        <button
          className="btn bid-button"
          disabled={isPlaceBidDisabled}
          onClick={handleSubmit}
          aria-label="Đấu giá"
        >
          <i className="bi bi-cash-coin me-md-2"></i>
          <span className="d-none d-md-inline">ĐẤU GIÁ</span>
        </button>

        {/* Secondary Action Button - Hủy (Cancel) */}
        <button
          className="btn cancel-button"
          disabled={isCancelBidDisabled}
          onClick={onCancelBid}
          aria-label="Hủy đấu giá cuối"
        >
          <i className="bi bi-x-circle me-md-2"></i>
          <span className="d-none d-md-inline">HỦY ĐẤU GIÁ CUỐI</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(BidControls);
