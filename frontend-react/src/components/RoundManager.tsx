import React from 'react';

interface RoundManagerProps {
  currentRound: number;
  isTimerEnded: boolean;
  onNextRound: () => void;
}

/**
 * A component for managing auction rounds
 */
export const RoundManager: React.FC<RoundManagerProps> = ({
  currentRound,
  isTimerEnded,
  onNextRound
}) => {
  const isFinalRound = currentRound >= 6;

  return (
    <div className="round-controls mb-3">
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

      {/* Add button to start next round if timer has ended and it's not the final round */}
      {isTimerEnded && !isFinalRound && (
        <button
          className="btn btn-primary mt-3"
          onClick={onNextRound}
          style={{ animation: 'pulse 1.5s infinite' }}
        >
          Bắt đầu vòng {currentRound + 1}
        </button>
      )}

      {/* Show message if it's the final round */}
      {isFinalRound && (
        <div className="alert alert-info mt-3">
          Đây là vòng cuối cùng của phiên đấu giá
        </div>
      )}
    </div>
  );
};

export default RoundManager;
