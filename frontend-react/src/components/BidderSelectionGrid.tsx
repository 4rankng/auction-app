import React from 'react';

interface Bidder {
  id: string;
  name: string;
}

interface BidderSelectionGridProps {
  bidders: Bidder[];
  selectedBidder: string | null;
  onBidderSelect: (bidderId: string) => void;
}

/**
 * A reusable component for displaying and selecting bidders in a grid
 */
const BidderSelectionGrid: React.FC<BidderSelectionGridProps> = ({
  bidders,
  selectedBidder,
  onBidderSelect
}) => {
  return (
    <div className="bidder-selection-container mb-3">
      <h5 className="mb-2">Chọn người tham gia</h5>
      <div className="d-flex flex-wrap justify-content-center">
        {bidders.map((bidder) => (
          <button
            key={bidder.id}
            className={`btn ${selectedBidder === bidder.id ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{
              width: '40px',
              height: '40px',
              padding: '0',
              borderRadius: '4px',
              margin: '3px',
              border: selectedBidder === bidder.id ? '2px solid #0d6efd' : '1px solid #6c757d',
              fontWeight: 'bold'
            }}
            onClick={() => onBidderSelect(bidder.id)}
          >
            {bidder.id}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BidderSelectionGrid;
