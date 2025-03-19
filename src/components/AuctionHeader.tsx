import React, { useState, useEffect } from 'react';
import './AuctionHeader.css';

interface AuctionHeaderProps {
  title: string;
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
  title,
  elapsedTime,
  onEndAuction,
  totalBids,
  isAuctionEnded = false,
  auctioneer = 'Không có thông tin',
  onShowPopup // Add this prop to the function parameters
}) => {
  // Add state for modal visibility
  const [showModal, setShowModal] = useState(false);
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

  return (
    <div className="auction-header-container">
      <div className="auction-header-info">
        <h3 className="auction-title">{title}</h3>
        <div className="auction-auctioneer">
          <span className="auctioneer-label">Đấu giá viên:</span>
          <span className="auctioneer-name">{auctioneer}</span>
        </div>
      </div>

      <div className="auction-elapsed-time-container">
        <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
        <span className="auction-elapsed-time">{elapsedTime}</span>
      </div>

      <div className="auction-header-actions">
        {/* Add button to show popup */}
        {onShowPopup && (
          <button
            className="btn btn-primary show-popup-btn"
            onClick={onShowPopup}
            style={{
              minWidth: getButtonWidth('120px')
            }}
          >
            <i className="bi bi-display me-1"></i>
            {getButtonText('Màn Hình Phụ')}
          </button>
        )}

        {isAuctionEnded ? (
          <div className="auction-ended-badge"
            style={{
              minWidth: getButtonWidth('120px')
            }}
          >
            <i className="bi bi-stopwatch-fill"></i>
            {getButtonText('Đã Kết Thúc')}
          </div>
        ) : (
          <button
            className="btn end-auction-btn"
            onClick={handleOpenModal}
            style={{
              minWidth: getButtonWidth('120px')
            }}
          >
            <i className="bi bi-stop-circle"></i>
            {getButtonText('Kết Thúc')}
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Xác nhận kết thúc đấu giá
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} aria-label="Close"></button>
              </div>
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
