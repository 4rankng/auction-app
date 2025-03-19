import React from 'react';

interface Bidder {
  id: string;
  name: string;
  nric?: string;
  issuingAuthority?: string;
  address?: string;
}

interface BidderSelectionGridProps {
  bidders: Bidder[];
  selectedBidder: string | null;
  onBidderSelect: (bidderId: string) => void;
  disabledBidders?: string[];
  lastBidderId?: string | null;
  highestBidderId?: string | null;
  isTimerEnded?: boolean;
  // Timer control props
  onStartBid?: () => void;
  onResetTimer?: () => void;
  bidDuration?: number;
  bidderTimeLeft?: number;
  isTimerRunning?: boolean;
}

/**
 * A reusable component for displaying and selecting bidders in a grid
 */
const BidderSelectionGrid: React.FC<BidderSelectionGridProps> = ({
  bidders,
  selectedBidder,
  onBidderSelect,
  disabledBidders = [],
  lastBidderId = null,
  highestBidderId = null,
  isTimerEnded = false,
  // Timer control props with defaults
  onStartBid = () => {},
  onResetTimer = () => {},
  bidDuration = 60,
  bidderTimeLeft,
  isTimerRunning = false
}) => {
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))',
    gap: '8px',
    alignItems: 'start',
    maxWidth: '100%',
    justifyContent: 'start'
  };

  const bidderItemStyles = {
    display: 'flex',
    justifyContent: 'center'
  };

  // Format the timer in mm:ss format
  const formatTime = (seconds: number = 0): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bidder-selection-container mb-3">
      {/* Timer controls added above the "Chọn người tham gia" heading */}
      <div className="d-flex mb-3 align-items-center">
        {/* Start Bid Button */}
        <button
          className="btn btn-success me-2"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            height: '40px',
            backgroundColor: '#28a745',
            border: 'none'
          }}
          onClick={onStartBid}
          disabled={isTimerRunning}
        >
          <i className="bi bi-play-circle me-1"></i>
          Bắt Đầu
        </button>

        {/* Countdown Timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            padding: '8px 16px',
            border: '1px solid #dee2e6',
            minWidth: '80px',
            height: '40px',
            margin: '0 5px',
            fontWeight: 'normal'
          }}
        >
          <span style={{
            fontSize: '1rem',
            color: '#212529'
          }}>
            {formatTime(bidderTimeLeft !== undefined && isTimerRunning ? bidderTimeLeft : bidDuration)}
          </span>
        </div>

        {/* Reset Timer Button */}
        <button
          className="btn ms-2"
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            backgroundColor: '#dc3545',
            color: 'white',
            height: '40px',
            border: 'none'
          }}
          onClick={onResetTimer}
        >
          <i className="bi bi-arrow-counterclockwise me-1"></i>
          Đặt Lại
        </button>
      </div>

      <h6 className="mb-2">Chọn người tham gia</h6>

      {isTimerEnded && (
        <div className="alert alert-warning mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Vòng đấu giá đã kết thúc. Không thể chọn người tham gia cho đến khi vòng tiếp theo bắt đầu.
        </div>
      )}

      {bidders.length === 0 && (
        <div className="alert alert-info">
          Không có người tham gia. Vui lòng thêm người tham gia trong trang thiết lập.
        </div>
      )}

      {!isTimerEnded && bidders.length >= 0 &&
       (
        <div style={gridStyles} className="bidder-grid">
          {bidders.map((bidder) => {
            const isDisabled = disabledBidders.includes(bidder.id);
            const isLastBidder = bidder.id === lastBidderId;
            const isHighestBidder = bidder.id === highestBidderId;

            let tooltipText = `${bidder.name}${bidder.nric ? ` - CMND/CCCD: ${bidder.nric}` : ''}`;

            if (isTimerEnded) {
              tooltipText = 'Vòng đấu giá đã kết thúc. Không thể chọn người tham gia cho đến khi vòng tiếp theo bắt đầu.';
            } else if (isLastBidder && isDisabled) {
              tooltipText = 'Người này vừa đấu giá, không thể đấu giá tiếp. Chọn để hủy đấu giá cuối cùng.';
            } else if (isLastBidder) {
              tooltipText = 'Người này vừa đấu giá. Chọn để hủy đấu giá cuối cùng.';
            } else if (isDisabled) {
              tooltipText = 'Người này không thể đấu giá lúc này.';
            }

            if (isHighestBidder) {
              tooltipText = `${tooltipText} (Người đấu giá cao nhất)`;
            }

            return (
              <div
                key={bidder.id}
                className="position-relative bidder-item"
                style={{ ...bidderItemStyles, margin: '4px' }}
              >
                <button
                  className={`btn ${
                    selectedBidder === bidder.id
                      ? 'btn-primary'
                      : isLastBidder
                        ? 'btn-outline-danger'
                        : isDisabled
                          ? 'btn-light'
                          : 'btn-outline-secondary'
                  }`}
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: '0',
                    borderRadius: '4px',
                    border: selectedBidder === bidder.id
                      ? '2px solid #0d6efd'
                      : isLastBidder
                        ? '2px solid #dc3545'
                        : '1px solid #6c757d',
                    fontWeight: 'bold',
                    opacity: isDisabled ? 0.6 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => onBidderSelect(bidder.id)}
                  title={tooltipText}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  disabled={isTimerEnded || isDisabled}
                >
                  {bidder.id}
                  {isHighestBidder && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        color: '#FFD700',
                        fontSize: '12px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        padding: '1px'
                      }}
                    >
                      <i className="bi bi-star-fill"></i>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BidderSelectionGrid;
