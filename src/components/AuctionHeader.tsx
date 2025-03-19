import React, { useState } from 'react';
import './AuctionHeader.css';
import CompanyBanner from './CompanyBanner';

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
  const buttonHeight = 40;
  // Width is twice the height
  const buttonWidth = buttonHeight * 2;

  // Common button style with 50% transparency
  const transparentButtonStyle = {
    width: `${buttonWidth}px`,
    height: `${buttonHeight}px`,
    backgroundColor: 'rgba(13, 110, 253, 0.5)',
    borderColor: 'rgba(13, 110, 253, 0.5)',
    fontFamily: 'Roboto, sans-serif'
  };

  const transparentDangerButtonStyle = {
    width: `${buttonWidth}px`,
    height: `${buttonHeight}px`,
    backgroundColor: 'rgba(220, 53, 69, 0.5)',
    borderColor: 'rgba(220, 53, 69, 0.5)',
    fontFamily: 'Roboto, sans-serif'
  };

  // Common text style for consistent font
  const robotoStyle = {
    fontFamily: 'Roboto, sans-serif'
  };

  return (
    <div className="auction-header-container" style={robotoStyle}>
      <div className="auction-header-info">
        <div
          className={`auction-description ${isTruncated ? 'truncated' : ''}`}
          style={{ fontSize: '18px', fontFamily: 'Roboto, sans-serif' }}
        >
          <div className="auction-description-text">
            {title}
          </div>
          <div
            className="auction-description-toggle"
            onClick={toggleTruncation}
          >
            {isTruncated ? 'Hiện' : 'Ẩn'}
          </div>
        </div>
        <div className="auction-auctioneer">
          <span className="auctioneer-label">Đấu giá viên:</span>
          <span className="auctioneer-name">{auctioneer}</span>
        </div>
      </div>

      <div className="auction-controls-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', fontFamily: 'Roboto, sans-serif' }}>
        {/* Elapsed Time Container now above the buttons */}
        <div className="auction-elapsed-time-container" style={{
          height: `${buttonHeight}px`,
          width: '100%',
          marginBottom: '5px',
          fontFamily: 'Roboto, sans-serif'
        }}>
          <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
          <span className="auction-elapsed-time">{elapsedTime}</span>
        </div>

        {/* Buttons Container */}
        <div className="auction-header-actions" style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {/* Add button to show popup */}
          {onShowPopup && (
            <button
              className="btn btn-primary show-popup-btn icon-button"
              onClick={onShowPopup}
              style={transparentButtonStyle}
            >
              <i className="bi bi-display me-1 icon-man-hinh-phu"></i>
            </button>
          )}

          {isAuctionEnded ? (
            <div className="auction-ended-badge icon-button"
              style={{
                width: `${buttonWidth}px`,
                height: `${buttonHeight}px`,
                backgroundColor: 'rgba(108, 117, 125, 0.5)',
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              <i className="bi bi-stopwatch-fill"></i>
            </div>
          ) : (
            <button
              className="btn end-auction-btn icon-button"
              onClick={handleOpenModal}
              style={transparentDangerButtonStyle}
            >
              <i className="bi bi-stop-circle icon-ket-thuc"></i>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={robotoStyle}>
              {/* Replace the modal header with CompanyBanner */}
              <CompanyBanner className="modal-header" />
              <div className="modal-body">
                <p style={robotoStyle}>Bạn có chắc chắn muốn kết thúc phiên đấu giá này?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} style={{ backgroundColor: 'rgba(108, 117, 125, 0.5)', borderColor: 'rgba(108, 117, 125, 0.5)', fontFamily: 'Roboto, sans-serif' }}>
                  <i className="bi bi-x-circle me-1"></i> Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmEndAuction}
                  style={{ backgroundColor: 'rgba(220, 53, 69, 0.5)', borderColor: 'rgba(220, 53, 69, 0.5)', fontFamily: 'Roboto, sans-serif' }}
                >
                  <i className="bi bi-stop-circle me-1"></i> Xác nhận kết thúc
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

export default AuctionHeader;
