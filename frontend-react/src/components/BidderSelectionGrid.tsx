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
  highestBidderId = null
}) => {
  return (
    <div className="bidder-selection-container mb-3">
      <h5 className="mb-2">Chọn người tham gia</h5>
      {bidders.length === 0 ? (
        <div className="alert alert-info">
          Không có người tham gia. Vui lòng thêm người tham gia trong trang thiết lập.
        </div>
      ) : (
        <div className="d-flex flex-wrap justify-content-center">
          {bidders.map((bidder) => {
            const isDisabled = disabledBidders.includes(bidder.id);
            const isLastBidder = bidder.id === lastBidderId;
            const isHighestBidder = bidder.id === highestBidderId;

            let tooltipText = `${bidder.name}${bidder.nric ? ` - CMND/CCCD: ${bidder.nric}` : ''}`;

            if (isLastBidder && isDisabled) {
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
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => onBidderSelect(bidder.id)}
                  title={tooltipText}
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
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
      <div className="mt-2 text-muted small">
        <i className="bi bi-info-circle me-1"></i>
        Chọn một người tham gia để bắt đầu đấu giá. Mỗi người có 60 giây để đấu giá.
      </div>
    </div>
  );
};

export default BidderSelectionGrid;
