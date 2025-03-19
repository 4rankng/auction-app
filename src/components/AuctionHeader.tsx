import React, { useState, useEffect } from 'react';
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
  // Add state to track screen size
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  // Add state for truncated description
  const [isTruncated, setIsTruncated] = useState(true);

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

  // Function to toggle description truncation
  const toggleTruncation = () => {
    setIsTruncated(!isTruncated);
  };

  // Function to get button text based on screen size
  const getButtonText = (text: string): string => {
    return isSmallScreen ? '' : text;
  };

  // Function to get button width based on screen size
  const getButtonWidth = (defaultWidth: string, iconOnlyWidth: string = '76px'): string => {
    return isSmallScreen ? iconOnlyWidth : defaultWidth;
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

  return (
    <div className="auction-header-container">
      <div className="auction-header-info">
        <div
          className={`auction-description ${isTruncated ? 'truncated' : ''}`}
          style={{ fontSize: '18px' }}
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

      <div className="auction-elapsed-time-container" style={{ height: `${buttonHeight}px` }}>
        <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
        <span className="auction-elapsed-time">{elapsedTime}</span>
      </div>

      <div className="auction-header-actions">
        {/* Add button to show popup */}
        {onShowPopup && (
          <button
            className="btn btn-primary show-popup-btn icon-button"
            onClick={onShowPopup}
            style={{
              width: `${buttonWidth}px`,
              height: `${buttonHeight}px`
            }}
          >
            <i className="bi bi-display me-1 icon-man-hinh-phu"></i>
          </button>
        )}

        {isAuctionEnded ? (
          <div className="auction-ended-badge icon-button"
            style={{
              width: `${buttonWidth}px`,
              height: `${buttonHeight}px`
            }}
          >
            <i className="bi bi-stopwatch-fill"></i>
          </div>
        ) : (
          <button
            className="btn end-auction-btn icon-button"
            onClick={handleOpenModal}
            style={{
              width: `${buttonWidth}px`,
              height: `${buttonHeight}px`
            }}
          >
            <i className="bi bi-stop-circle icon-ket-thuc"></i>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              {/* Replace the modal header with CompanyBanner */}
              <CompanyBanner className="modal-header" />
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn kết thúc phiên đấu giá này?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  <i className="bi bi-x-circle me-1"></i> Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmEndAuction}
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
