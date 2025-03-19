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
    <div className="bidder-selection-container mb-3" style={{
      fontFamily: 'Roboto, Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e0e0e0'
    }}>
      {/* Timer controls section */}
      <div style={{ marginBottom: '18px' }}>

        <div className="d-flex align-items-center" style={{
          justifyContent: 'flex-start',
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          gap: '12px'
        }}>
          {/* Start Bid Button */}
          <button
            className="btn"
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '500',
              height: '38px',
              backgroundColor: isTimerRunning ? '#a0a0a0' : '#7baf7b',
              border: 'none',
              color: 'white',
              fontFamily: 'Roboto, Arial, sans-serif',
              opacity: isTimerRunning ? 0.65 : 1,
              cursor: isTimerRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease-in-out',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '100px'
            }}
            onClick={onStartBid}
            disabled={isTimerRunning}
          >
            <i className="bi bi-play-circle me-2"></i>
            Bắt Đầu
          </button>

          {/* Countdown Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              minWidth: '80px',
              height: '38px',
              fontWeight: '500',
              fontFamily: 'Roboto, Arial, sans-serif',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          >
            <span style={{
              fontSize: '14px',
              color: '#6c8dae',
              fontFamily: 'Roboto, Arial, sans-serif'
            }}>
              {formatTime(bidderTimeLeft !== undefined && isTimerRunning ? bidderTimeLeft : bidDuration)}
            </span>
          </div>

          {/* Reset Timer Button */}
          <button
            className="btn"
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: '500',
              height: '38px',
              backgroundColor: '#b17a7a',
              color: 'white',
              border: 'none',
              fontFamily: 'Roboto, Arial, sans-serif',
              transition: 'all 0.3s ease-in-out',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '100px'
            }}
            onClick={onResetTimer}
          >
            <i className="bi bi-arrow-counterclockwise me-2"></i>
            Đặt Lại
          </button>
        </div>
      </div>

      {/* Display heading and selected bidder information in one line */}
      <div className="d-flex align-items-center mb-3" style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: '100%',
        flexDirection: 'row'
      }}>
        <h6 style={{
          fontSize: '14px',
          color: '#6c757d',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          margin: '0',
          marginRight: '8px',
          flexShrink: 0
        }}>Chọn người tham gia:</h6>
        {selectedBidder ? (
          <div className="selected-bidder-info" style={{
            backgroundColor: '#f0f4f8',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d9e2ec',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'Roboto, Arial, sans-serif',
            color: '#6c8dae',
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: 'max-content',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}>
            <i className="bi bi-person-check-fill me-2" style={{ color: '#6c8dae', flexShrink: 0 }}></i>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedBidder} - {bidders.find(b => b.id === selectedBidder)?.name || ''}
            </span>
          </div>
        ) : (
          <div style={{
            color: '#6c757d',
            fontSize: '14px',
            fontStyle: 'italic',
            fontFamily: 'Roboto, Arial, sans-serif',
            flexGrow: 1
          }}>
            Chưa chọn người tham gia
          </div>
        )}
      </div>

      {isTimerEnded && (
        <div className="alert mb-3" style={{
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          backgroundColor: '#fff9db',
          color: '#856404',
          border: '1px solid #f8efc5',
          borderRadius: '4px',
          padding: '10px 14px'
        }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Vòng đấu giá đã kết thúc. Không thể chọn người tham gia cho đến khi vòng tiếp theo bắt đầu.
        </div>
      )}

      {bidders.length === 0 && (
        <div className="alert mb-3" style={{
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          backgroundColor: '#e5f0f4',
          color: '#607d8b',
          border: '1px solid #d1e2e9',
          borderRadius: '4px',
          padding: '10px 14px'
        }}>
          <i className="bi bi-info-circle me-2"></i>
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

            // Determine button colors based on state
            let backgroundColor, borderColor, textColor;

            if (selectedBidder === bidder.id) {
              backgroundColor = '#6c8dae';
              borderColor = '#6c8dae';
              textColor = '#ffffff';
            } else if (isLastBidder) {
              backgroundColor = '#ffffff';
              borderColor = '#b17a7a';
              textColor = '#b17a7a';
            } else if (isDisabled || isTimerEnded) {
              backgroundColor = '#e0e0e0';
              borderColor = '#e0e0e0';
              textColor = '#6c757d';
            } else {
              backgroundColor = '#ffffff';
              borderColor = '#6c757d';
              textColor = '#6c757d';
            }

            return (
              <div
                key={bidder.id}
                className="position-relative bidder-item"
                style={{ ...bidderItemStyles, margin: '4px' }}
              >
                <button
                  className="btn"
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: '0',
                    borderRadius: '4px',
                    border: `1px solid ${borderColor}`,
                    fontWeight: '500',
                    opacity: (isTimerEnded || isDisabled) ? 0.75 : 1,
                    cursor: (isTimerEnded || isDisabled) ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    fontFamily: 'Roboto, Arial, sans-serif',
                    backgroundColor: backgroundColor,
                    color: textColor,
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                        top: '-6px',
                        right: '-6px',
                        color: '#d4af37',
                        fontSize: '10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        padding: '2px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
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
