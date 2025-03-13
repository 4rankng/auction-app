import React from 'react';
import { Bidder } from '../../models/types';
import { Row, Col } from 'react-bootstrap';
import './BidderList.css'; // We'll create this file next

interface BidderListProps {
  bidders: Bidder[];
  selectedBidderId?: string;
  highestBidderId?: string;
  onSelectBidder: (bidder: Bidder) => void;
}

const BidderList: React.FC<BidderListProps> = ({
  bidders,
  selectedBidderId,
  highestBidderId,
  onSelectBidder,
}) => {
  return (
    <div className="bidder-grid">
      <Row className="g-3">
        {bidders.map((bidder) => {
          const isSelected = bidder.id === selectedBidderId;
          const isHighestBidder = bidder.id === highestBidderId;

          // Extract bidder ID number (assuming it's stored as a string but represents a number)
          const bidderId = parseInt(bidder.id.replace(/\D/g, ''), 10) || 0;

          return (
            <Col xs={4} sm={3} md={2} key={bidder.id}>
              <div
                className={`bidder-circle ${isSelected ? 'selected' : ''} ${isHighestBidder ? 'highest' : ''}`}
                onClick={() => onSelectBidder(bidder)}
                title={bidder.name}
              >
                {bidderId}
              </div>
              <div className="bidder-name text-center mt-1">{bidder.name}</div>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default BidderList;
