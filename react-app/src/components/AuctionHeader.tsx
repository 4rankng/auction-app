import React, { useState } from 'react';
import './AuctionHeader.css';

interface AuctionHeaderProps {
  title: string;
  elapsedTime: string;
  onEndAuction: () => void;
  totalBids: number;
  isAuctionEnded?: boolean;
  auctioneer?: string;  // This now contains the auctioneer name directly
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
  auctioneer = 'Không có thông tin'
}) => {
  // Add state for modal visibility
  const [showModal, setShowModal] = useState(false);

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

        <div className="auction-metadata">
          <div className="auction-metadata-item">
            <i className="bi bi-person-badge me-2"></i>
            <span className="auction-metadata-label">Đấu Giá Viên:</span>
            <span className="auction-metadata-value">
              {auctioneer}
            </span>
          </div>
        </div>
      </div>

      <div className="auction-header-actions">
        <div className="auction-elapsed-time-container">
          <i className="bi bi-stopwatch auction-elapsed-time-icon"></i>
          <span className="auction-elapsed-time">{elapsedTime}</span>
        </div>

        {isAuctionEnded ? (
          <div className="auction-ended-badge">
            <i className="bi bi-stopwatch-fill"></i> Đã Kết Thúc
          </div>
        ) : (
          <button
            className="btn end-auction-btn"
            onClick={handleOpenModal}
          >
            <i className="bi bi-stop-circle"></i> Kết Thúc Đấu Giá
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
