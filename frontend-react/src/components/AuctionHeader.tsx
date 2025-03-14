import React from 'react';

interface AuctionHeaderProps {
  title: string;
  timeLeft: string;
  onEndAuction: () => void;
  currentRound: number;
  isTimerEnded: boolean;
  onStartNextRound: () => void;
}

/**
 * A reusable component for displaying the auction header with title, status, timer and end button
 */
const AuctionHeader: React.FC<AuctionHeaderProps> = ({
  title,
  timeLeft,
  onEndAuction,
  currentRound,
  isTimerEnded,
  onStartNextRound
}) => {
  const showNextRoundButton = isTimerEnded && currentRound < 6;

  // Determine if this is the final round
  const isFinalRound = currentRound === 6;

  return (
    <div className="card-header d-flex justify-content-between align-items-center py-2">
      <div className="d-flex align-items-center">
        <h5 className="mb-0 me-2">{title}</h5>
        <span className="badge bg-success">Đang diễn ra</span>
        <span className="badge bg-primary ms-2 fs-6">Vòng {currentRound}{isFinalRound ? ' (Cuối)' : ''}</span>
      </div>
      <div className="d-flex align-items-center">
        <div className="text-center me-3">
          {showNextRoundButton ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={onStartNextRound}
              style={{
                minWidth: '220px',
                fontWeight: 'bold',
                animation: 'pulse 1.5s infinite',
                boxShadow: '0 0 10px rgba(0,123,255,0.5)'
              }}
            >
              <i className="bi bi-arrow-right-circle me-1"></i> Bắt Đầu Vòng Tiếp Theo
            </button>
          ) : (
            <div>
              <div className="small text-muted mb-1">Thời gian còn lại</div>
              <h2 className={`mb-0 ${timeLeft === '00:00' ? 'text-danger' : 'text-success'}`}>{timeLeft}</h2>
            </div>
          )}
        </div>
        <button className="btn btn-danger" onClick={onEndAuction}>
          <i className="bi bi-stop-circle me-1"></i> Kết Thúc Đấu Giá
        </button>
      </div>

      {/* Add CSS for the pulse animation */}
      <style>
        {`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        `}
      </style>
    </div>
  );
};

export default AuctionHeader;
