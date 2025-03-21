import React, { useState, useEffect, useReducer, useCallback, useMemo, useRef } from 'react';
import './BidControls.css';
import logger from '../services/loggerService';
import bidServiceEvents, { BidState } from '../services/bidService';

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

// Define action types for the reducer
type CustomBidAction =
  | { type: 'SET_AMOUNT'; payload: string }
  | { type: 'CLEAR_AMOUNT' };

// Define reducer function
const customBidReducer = (state: string, action: CustomBidAction): string => {
  switch (action.type) {
    case 'SET_AMOUNT':
      return action.payload;
    case 'CLEAR_AMOUNT':
      return '';
    default:
      return state;
  }
};

// Custom hook to subscribe to bidState updates
const useBidState = () => {
  const [bidState, setBidState] = useState<BidState>({
    bidderName: '',
    currentPrice: '0 VND',
    bidIncrement: '0 VND',
    bidMethod: 'basePrice',
    steps: 1,
    isPlaceBidDisabled: true,
    isCancelBidDisabled: true,
    bidHistoryEmpty: true,
    isLastBidder: false,
    customAmount: ''
  });

  // Track the previous state to detect meaningful changes
  const prevStateRef = useRef(bidState);

  // Only create one subscription per component instance
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Only set up subscription once
    if (!subscriptionRef.current) {
      logger.info('Setting up bidState subscription');
      const subscription = bidServiceEvents.bidState.subscribe(newState => {
        setBidState(prevState => {
          // Special handling for customAmount - we don't want to re-render when it changes
          // This is crucial to preventing typing input from causing re-renders
          // We only want the component-local customBidAmount state to control the input
          const stateWithoutCustomAmount = {
            ...newState,
            customAmount: prevState.customAmount
          };

          // Check if anything important changed that should cause a re-render
          const hasImportantChanges =
            prevState.bidderName !== stateWithoutCustomAmount.bidderName ||
            prevState.currentPrice !== stateWithoutCustomAmount.currentPrice ||
            prevState.bidIncrement !== stateWithoutCustomAmount.bidIncrement ||
            prevState.bidMethod !== stateWithoutCustomAmount.bidMethod ||
            prevState.steps !== stateWithoutCustomAmount.steps ||
            prevState.isPlaceBidDisabled !== stateWithoutCustomAmount.isPlaceBidDisabled ||
            prevState.isCancelBidDisabled !== stateWithoutCustomAmount.isCancelBidDisabled ||
            prevState.bidHistoryEmpty !== stateWithoutCustomAmount.bidHistoryEmpty ||
            prevState.isLastBidder !== stateWithoutCustomAmount.isLastBidder;

          // Only update state if something important changed
          if (hasImportantChanges) {
            // Take all the new state except customAmount
            prevStateRef.current = stateWithoutCustomAmount;
            return stateWithoutCustomAmount;
          }

          return prevState;
        });
      });

      subscriptionRef.current = subscription;
    }

    return () => {
      // Clean up on unmount, not on every render
      if (subscriptionRef.current) {
        logger.info('Cleaning up bidState subscription');
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  return bidState;
};

/**
 * A reusable component for bid controls including name, price inputs and action buttons
 * Incorporates three bidding methods: Base Price, Incremental Steps, and Custom Bid
 */
const BidControls: React.FC = () => {
  const renderCount = useRef(0);
  renderCount.current++;
  logger.info(`BidControls rendering #${renderCount.current}`);

  // Use custom hook for bid state
  const bidState = useBidState();

  // Use local state with reducer for custom amount
  const [customBidAmount, dispatch] = useReducer(customBidReducer, '');

  // State for validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Store the previous bid state to detect changes
  const prevBidStateRef = useRef<BidState | null>(null);

  useEffect(() => {
    const prevState = prevBidStateRef.current;
    prevBidStateRef.current = bidState;

    if (prevState) {
      // Log what changed to help debugging
      const changes: Record<string, { old: any, new: any }> = {};
      let hasChanges = false;

      Object.keys(bidState).forEach(key => {
        const k = key as keyof BidState;
        if (bidState[k] !== prevState[k]) {
          changes[key] = { old: prevState[k], new: bidState[k] };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        logger.info('BidState changed:', changes);
      }
    }
  }, [bidState]);

  // Parse current price and bid increment to numbers for calculations
  const currentPriceValue = useMemo(() =>
    parseInt(bidState.currentPrice.replace(/\D/g, '')) || 0,
    [bidState.currentPrice]
  );

  const bidIncrementValue = useMemo(() =>
    parseInt(bidState.bidIncrement.replace(/\D/g, '')) || 0,
    [bidState.bidIncrement]
  );

  // Common font styles to match AuctionSummary
  const labelStyle = {
    fontSize: '0.875rem',
    color: '#6c757d',
    fontFamily: 'Roboto, sans-serif'
  };

  // Update bid method when bid history changes
  useEffect(() => {
    if (!bidState.bidHistoryEmpty && bidState.bidMethod === 'basePrice') {
      bidServiceEvents.emitBidMethodChange('stepPrice');
    }
  }, [bidState.bidHistoryEmpty, bidState.bidMethod]);

  // Calculate bid amount based on selected method
  const calculateBidAmount = useCallback(() => {
    switch (bidState.bidMethod) {
      case 'basePrice':
        // For the first bid, return the exact current price
        logger.info('Base price method selected, returning:', bidState.currentPrice);
        return bidState.currentPrice;
      case 'stepPrice': {
        // Calculate the step price and ensure it's properly formatted
        const stepPrice = (currentPriceValue + (bidIncrementValue * bidState.steps));
        logger.info('Calculated step price:', stepPrice, 'from current:', currentPriceValue, 'increment:', bidIncrementValue, 'steps:', bidState.steps);
        return stepPrice.toLocaleString('vi-VN');
      }
      case 'customPrice':
        return customBidAmount;
      default:
        return bidState.currentPrice;
    }
  }, [bidState.bidMethod, bidState.currentPrice, bidState.steps, currentPriceValue, bidIncrementValue, customBidAmount]);

  // Validate bid amount
  const validateBid = useCallback((amount: string): boolean => {
    setValidationError(null);

    if (!amount) {
      setValidationError('Vui lòng nhập số tiền');
      return false;
    }

    // Parse the amount (remove non-numeric characters)
    const numericAmount = parseInt(amount.replace(/\D/g, '')) || 0;

    // Different validation based on bid history
    if (bidState.bidHistoryEmpty) {
      // If bid history is empty, check if the price is >= the current price
      if (numericAmount < currentPriceValue) {
        setValidationError('Giá trả phải lớn hơn hoặc bằng giá khởi điểm');
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
        setValidationError(`Giá trả phải cao hơn giá hiện tại ít nhất ${bidState.bidIncrement}`);
        return false;
      }
    }

    return true;
  }, [bidState.bidHistoryEmpty, bidState.bidIncrement, currentPriceValue, bidIncrementValue, setValidationError]);

  // Add a ref to track the input value without causing re-renders
  const customAmountInputRef = useRef<string>('');

  // Update the handler for custom amount changes
  const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    // Update local state immediately for UI responsiveness
    dispatch({ type: 'SET_AMOUNT', payload: value });
    // Store the value in ref to avoid renders
    customAmountInputRef.current = value;
    // No longer using debounced updates during typing
  }, []);

  // Add a blur handler to update bidService only when the user finishes typing
  const handleCustomAmountBlur = useCallback(() => {
    // Only update bidService when the user is done typing
    if (customAmountInputRef.current) {
      logger.info('Updating bidService with final custom amount:', customAmountInputRef.current);
      bidServiceEvents.updateBidState({ customAmount: customAmountInputRef.current });
    }
  }, []);

  // Handle bid submission
  const handleSubmit = useCallback(() => {
    // Calculate the bid amount based on the selected method
    const calculatedAmount = calculateBidAmount();
    logger.info('Calculated bid amount:', calculatedAmount);

    // Format the amount properly for validation and submission
    let formattedAmount = calculatedAmount;
    if (!formattedAmount.includes('VND')) {
      formattedAmount = `${formattedAmount} VND`;
    }

    // Get the numeric amount without VND
    const numericAmount = formattedAmount.replace(' VND', '');
    logger.info('Validating bid amount:', numericAmount);

    // Validate the bid amount
    if (!validateBid(numericAmount)) {
      logger.info('Bid validation failed');
      return;
    }

    // For custom amounts, make sure the bidService state is updated before emitting the bid event
    if (bidState.bidMethod === 'customPrice' && customBidAmount) {
      // Update the bidService state with the final amount
      bidServiceEvents.updateBidState({ customAmount: customBidAmount });
    }

    // Emit bid event using bidService
    logger.info('Calling onPlaceBid with amount:', numericAmount);
    bidServiceEvents.emitPlaceBid(numericAmount);

    // Reset the form after successful submission
    if (bidState.bidMethod === 'customPrice') {
      dispatch({ type: 'CLEAR_AMOUNT' });
      customAmountInputRef.current = '';
      // Update the bidService state to clear the custom amount
      bidServiceEvents.updateBidState({ customAmount: '' });
    }

    // Reset steps to 1 after successful bid
    bidServiceEvents.emitStepChange(1);

    // Reset validation error
    setValidationError(null);
  }, [calculateBidAmount, validateBid, bidState.bidMethod, customBidAmount]);

  // Handle step increment/decrement
  const handleStepIncrement = useCallback(() => {
    const newSteps = bidState.steps + 1;
    bidServiceEvents.emitStepChange(newSteps);
  }, [bidState.steps]);

  const handleStepDecrement = useCallback(() => {
    if (bidState.steps > 1) {
      const newSteps = bidState.steps - 1;
      bidServiceEvents.emitStepChange(newSteps);
    }
  }, [bidState.steps]);

  // Handle bid method change
  const handleBidMethodChange = useCallback((method: 'basePrice' | 'stepPrice' | 'customPrice') => {
    bidServiceEvents.emitBidMethodChange(method);
  }, []);

  // Handle cancel bid
  const handleCancelBid = useCallback(() => {
    bidServiceEvents.emitCancelBid();
  }, []);

  return (
    <div className="bid-controls-container mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Add the style tag with animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: bidButtonAnimation }} />

      {/* Bid Method Selector - Horizontal tabs with smaller size */}
      <div className="bid-method-selector mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span style={labelStyle}>Phương thức trả giá</span>
          {validationError && (
            <div className="validation-error text-danger">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {validationError}
            </div>
          )}
        </div>

        <div className="btn-group w-100" role="group" style={{ borderRadius: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          {/* Only show basePrice button when bidHistoryEmpty is true */}
          {bidState.bidHistoryEmpty && (
            <button
              type="button"
              className={`btn btn-sm ${bidState.bidMethod === 'basePrice' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleBidMethodChange('basePrice')}
              style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: '13px',
                padding: '6px 10px',
                transition: 'all 0.3s ease-in-out',
                fontWeight: bidState.bidMethod === 'basePrice' ? '500' : 'normal',
                boxShadow: bidState.bidMethod === 'basePrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                backgroundColor: bidState.bidMethod === 'basePrice' ? '#6c8dae' : '#ffffff',
                color: bidState.bidMethod === 'basePrice' ? '#ffffff' : '#6c8dae',
                borderColor: '#d1d3e2'
              }}
            >
              <i className="bi bi-tag-fill me-1"></i>
              Giá khởi điểm
            </button>
          )}

          <button
            type="button"
            className={`btn btn-sm ${bidState.bidMethod === 'stepPrice' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleBidMethodChange('stepPrice')}
            style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              padding: '6px 10px',
              transition: 'all 0.3s ease-in-out',
              fontWeight: bidState.bidMethod === 'stepPrice' ? '500' : 'normal',
              boxShadow: bidState.bidMethod === 'stepPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              backgroundColor: bidState.bidMethod === 'stepPrice' ? '#6c8dae' : '#ffffff',
              color: bidState.bidMethod === 'stepPrice' ? '#ffffff' : '#6c8dae',
              borderColor: '#d1d3e2'
            }}
          >
            <i className="bi bi-plus-circle-fill me-1"></i>
            Theo Bước Giá
          </button>

          <button
            type="button"
            className={`btn btn-sm ${bidState.bidMethod === 'customPrice' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleBidMethodChange('customPrice')}
            style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              padding: '6px 10px',
              transition: 'all 0.3s ease-in-out',
              fontWeight: bidState.bidMethod === 'customPrice' ? '500' : 'normal',
              boxShadow: bidState.bidMethod === 'customPrice' ? 'inset 0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
              backgroundColor: bidState.bidMethod === 'customPrice' ? '#6c8dae' : '#ffffff',
              color: bidState.bidMethod === 'customPrice' ? '#ffffff' : '#6c8dae',
              borderColor: '#d1d3e2'
            }}
          >
            <i className="bi bi-pencil-fill me-1"></i>
            Theo Giá Nhập
          </button>
        </div>
      </div>

      {/* Different bid inputs based on method */}
      {bidState.bidMethod === 'basePrice' && (
        <div className="bid-amount-info mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Giá khởi điểm</div>
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
            {bidState.currentPrice}
          </div>
        </div>
      )}

      {bidState.bidMethod === 'stepPrice' && (
        <div className="bid-step-control mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Giá hiện tại + (Bước giá × Số bước)</div>
          <div className="input-group mt-2">
            <span className="input-group-text" style={{
              fontFamily: 'Roboto, Arial, sans-serif',
              fontSize: '13px',
              backgroundColor: '#f8f9fa',
              borderColor: '#e0e0e0'
            }}>
              {bidState.currentPrice} + ({bidState.bidIncrement} ×
            </span>
            <div className="input-group-text btn-group" style={{ borderColor: '#e0e0e0' }}>
              <button
                className="btn btn-sm"
                type="button"
                onClick={handleStepDecrement}
                disabled={bidState.steps <= 1}
                style={{
                  fontFamily: 'Roboto, Arial, sans-serif',
                  fontSize: '13px',
                  padding: '4px 8px',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: bidState.steps <= 1 ? '#f8f9fa' : '#ffffff',
                  borderColor: '#e0e0e0',
                  color: '#6c757d',
                  opacity: bidState.steps <= 1 ? 0.65 : 1,
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
              }}>{bidState.steps}</span>
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
              = {(currentPriceValue + (bidIncrementValue * bidState.steps)).toLocaleString('vi-VN')} VND
            </span>
          </div>
        </div>
      )}

      {bidState.bidMethod === 'customPrice' && (
        <div className="custom-bid-input mb-3">
          <div style={{...labelStyle, fontSize: '14px'}}>Nhập số tiền</div>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={customBidAmount}
              onChange={handleCustomAmountChange}
              onBlur={handleCustomAmountBlur}
              placeholder="Nhập số tiền trả giá"
              style={{
                fontFamily: 'Roboto, Arial, sans-serif',
                fontSize: '14px',
                padding: '8px 12px',
                height: '38px',
                borderColor: validationError ? '#dc3545' : '#e0e0e0',
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
            Giá đấu phải lớn hơn giá hiện tại ít nhất một bước giá ({bidState.bidIncrement})
          </div>
        </div>
      )}

      {/* Buttons for bid actions - using CSS classes for layout */}
      <div className="bid-action-buttons">
        {/* Primary Action Button - Đấu Giá (Place Bid) */}
        <button
          className="btn bid-button"
          disabled={bidState.isPlaceBidDisabled}
          onClick={handleSubmit}
          aria-label="Trả giá"
        >
          <i className="bi bi-cash-coin me-md-2"></i>
          <span className="d-none d-md-inline">TRẢ GIÁ</span>
        </button>

        {/* Secondary Action Button - Hủy (Cancel) */}
        <button
          className="btn cancel-button"
          disabled={bidState.isCancelBidDisabled}
          onClick={handleCancelBid}
          aria-label="Hủy lượt trả giá cuối"
        >
          <i className="bi bi-x-circle me-md-2"></i>
          <span className="d-none d-md-inline">HỦY LƯỢT TRẢ GIÁ CUỐI</span>
        </button>
      </div>
    </div>
  );
};

// Replace the current React.memo implementation with a proper one that stops re-renders
export default React.memo(BidControls, () => {
  // Always return true to prevent re-renders from parent props changes
  // Since we have no props and only use bidService for state management
  return true;
});
