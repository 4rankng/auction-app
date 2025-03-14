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
