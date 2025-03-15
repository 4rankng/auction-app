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
  isTimerEnded = false
}) => {
  return (
    <div className="bidder-selection-container mb-3">
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
        <div className="d-flex flex-wrap justify-content-center">
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
                className="position-relative"
                style={{ margin: '3px' }}
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
