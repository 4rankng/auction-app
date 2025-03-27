import './AuctionHeader.css';
import React, { useState } from 'react';
import CompanyBanner from './CompanyBanner';

// Add keyframes animation for the popup button
const popupButtonAnimation = `
@keyframes pulse-popup {
  0% {
    box-shadow: 0 0 0 0 rgba(108, 141, 174, 0.3);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(108, 141, 174, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(108, 141, 174, 0);
  }
}

@keyframes pulse-end {
  0% {
    box-shadow: 0 0 0 0 rgba(177, 122, 122, 0.3);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(177, 122, 122, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(177, 122, 122, 0);
  }
}
`;

interface AuctionHeaderProps {
  title: string; // This is now the description
  elapsedTime: string;
  onEndAuction: () => void;
  totalBids: number;
  isAuctionEnded?: boolean;
  auctioneer?: string;  // This now contains the auctioneer name directly
  onShowPopup?: () => void; // Add this prop for the popup button
}

/**
 * A reusable component for displaying the auction header with title, elapsed time, and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title, // This is now the description
  elapsedTime,
  onEndAuction,
  totalBids,
  isAuctionEnded = false,
  auctioneer = 'Không có thông tin',
  onShowPopup
}) => {
  // Add state for modal visibility
  const [showModal, setShowModal] = useState(false);
  // Add state for truncated description
  const [isTruncated, setIsTruncated] = useState(true);

  // Function to toggle description truncation
  const toggleTruncation = () => {
    setIsTruncated(!isTruncated);
  };

  // Function to handle opening the modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Function to handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Function to handle confirmation and end auction
  const handleConfirmEndAuction = () => {
    onEndAuction();
    setShowModal(false);
  };

  // Standard height for buttons
  const buttonHeight = 38;
  // Width is twice the height
  const buttonWidth = buttonHeight * 2;

  // Button style for popup button - filled with animation
  const popupButtonStyle = {
    width: `${buttonWidth}px`,
    height: `${buttonHeight}px`,
    backgroundColor: '#6c8dae',
    borderColor: '#6c8dae',
    color: '#ffffff',
    fontFamily: 'Roboto, Arial, sans-serif',
    animation: 'pulse-popup 2s infinite',
    boxShadow: '0 0 0 0 rgba(108, 141, 174, 0.3)',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease-in-out',
    border: 'none'
  };

  // Button style for end auction button - filled with animation
  const endButtonStyle = {
    width: `${buttonWidth}px`,
    height: `${buttonHeight}px`,
    backgroundColor: '#b17a7a',
    borderColor: '#b17a7a',
    color: '#ffffff',
    fontFamily: 'Roboto, Arial, sans-serif',
    animation: 'pulse-end 2s infinite',
    boxShadow: '0 0 0 0 rgba(177, 122, 122, 0.3)',
    borderRadius: '4px',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease-in-out',
    border: 'none'
  };

  // Common text style for consistent font
  const robotoStyle = {
    fontFamily: 'Roboto, Arial, sans-serif',
    color: '#343a40'
  };

  return (
    <div className="auction-header-container" style={{
      ...robotoStyle,
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e0e0e0'
    }}>
      {/* Add style tag for animations */}
      <style>
        {popupButtonAnimation}
      </style>

      <div className="auction-header-info">
        <div
          className={`auction-description ${isTruncated ? 'truncated' : ''}`}
          style={{
            fontSize: '16px',
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#343a40',
            lineHeight: '1.5'
          }}
        >
          <div className="auction-description-text">
            {title}
          </div>
          <div
            className="auction-description-toggle"
            onClick={toggleTruncation}
            style={{
              color: '#6c8dae',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'color 0.3s ease'
            }}
          >
            {isTruncated ? 'Hiện' : 'Ẩn'}
          </div>
        </div>
        <div className="auction-auctioneer" style={{ fontSize: '14px', marginTop: '8px' }}>
          <span className="auctioneer-label" style={{ color: '#6c757d', marginRight: '8px' }}>đấu giá viên:</span>
          <span className="auctioneer-name" style={{ fontWeight: '500', color: '#343a40' }}>{auctioneer}</span>
        </div>
      </div>

      <div className="auction-controls-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Roboto, Arial, sans-serif'
      }}>
        {/* Elapsed Time Container now above the buttons */}
        <div className="auction-elapsed-time-container" style={{
          height: `${buttonHeight}px`,
          width: '100%',
          marginBottom: '5px',
          fontFamily: 'Roboto, Arial, sans-serif',
          backgroundColor: '#ffffff',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}>
          <i className="bi bi-stopwatch auction-elapsed-time-icon" style={{ color: '#6c8dae', marginRight: '8px' }}></i>
          <span className="auction-elapsed-time" style={{ color: '#343a40', fontWeight: '500', fontSize: '16px' }}>{elapsedTime}</span>
        </div>

        {/* Buttons Container */}
        <div className="auction-header-actions" style={{
          display: 'flex',
          gap: '12px',
          width: '100%'
        }}>
          {/* Add button to show popup */}
          {onShowPopup && (
            <button
              className="btn show-popup-btn icon-button"
              onClick={onShowPopup}
              style={{
                ...popupButtonStyle,
                flex: 1, // Make it take equal space
                width: 'auto' // Override fixed width
              }}
            >
              <i className="bi bi-display me-2 icon-man-hinh-phu"></i>
              <span className="d-none d-md-inline"></span>
            </button>
          )}

          {isAuctionEnded ? (
            <div className="auction-ended-badge icon-button"
              style={{
                flex: 1, // Make it take equal space
                width: 'auto', // Override fixed width
                height: `${buttonHeight}px`,
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Roboto, Arial, sans-serif',
                color: '#6c757d',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ced4da'
              }}
            >
              <i className="bi bi-stopwatch-fill me-2"></i>
              <span className="d-none d-md-inline">Đã kết thúc</span>
            </div>
          ) : (
            <button
              className="btn end-auction-btn icon-button"
              onClick={handleOpenModal}
              style={{
                ...endButtonStyle,
                flex: 1, // Make it take equal space
                width: 'auto' // Override fixed width
              }}
            >
              <i className="bi bi-stop-circle icon-ket-thuc me-2"></i>
              <span className="d-none d-md-inline"></span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{
              ...robotoStyle,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0'
            }}>
              {/* Replace the modal header with CompanyBanner */}
              <CompanyBanner className="modal-header" />
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ ...robotoStyle, fontSize: '16px', marginBottom: '10px' }}>Bạn có chắc chắn muốn kết thúc phiên đấu giá này?</p>
              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid #e0e0e0', padding: '16px 20px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCloseModal}
                  style={{
                    fontFamily: 'Roboto, Arial, sans-serif',
                    backgroundColor: '#f8f9fa',
                    borderColor: '#d9e2ec',
                    color: '#6c8dae',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease-in-out'
                  }}
                >
                  <i className="bi bi-x-circle me-2"></i> Hủy
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmEndAuction}
                  style={{
                    fontFamily: 'Roboto, Arial, sans-serif',
                    backgroundColor: '#b17a7a',
                    borderColor: '#b17a7a',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease-in-out',
                    border: 'none',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <i className="bi bi-stop-circle me-2"></i> Xác nhận kết thúc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add backdrop when modal is open */}
      {showModal && (
        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      )}
    </div>
  );
};

// Create a custom comparison function for React.memo that ignores elapsedTime changes
const arePropsEqual = (prevProps: AuctionHeaderProps, nextProps: AuctionHeaderProps) => {
  // Only check if elapsedTime is the only prop that changed
  const isOnlyElapsedTimeChanged =
    prevProps.title === nextProps.title &&
    prevProps.totalBids === nextProps.totalBids &&
    prevProps.isAuctionEnded === nextProps.isAuctionEnded &&
    prevProps.auctioneer === nextProps.auctioneer &&
    prevProps.onEndAuction === nextProps.onEndAuction &&
    prevProps.onShowPopup === nextProps.onShowPopup &&
    prevProps.elapsedTime !== nextProps.elapsedTime;

  if (isOnlyElapsedTimeChanged) {
    // If only the elapsedTime changed, prevent re-render
    return true;
  }

  // Check equality for all other props except elapsedTime
  return (
    prevProps.title === nextProps.title &&
    prevProps.totalBids === nextProps.totalBids &&
    prevProps.isAuctionEnded === nextProps.isAuctionEnded &&
    prevProps.auctioneer === nextProps.auctioneer &&
    prevProps.onEndAuction === nextProps.onEndAuction &&
    prevProps.onShowPopup === nextProps.onShowPopup
  );
};

// Apply React.memo with the custom comparison function
export default React.memo(AuctionHeader, arePropsEqual);
