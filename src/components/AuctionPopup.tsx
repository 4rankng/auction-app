import React from 'react';

interface AuctionPopupProps {
  auctionDetails: {
    description: string;
    auctioneerName: string;
  };
}

const AuctionPopup: React.FC<AuctionPopupProps> = ({ auctionDetails }) => {
  return (
    <div className="auction-popup">
      <div className="popup-description" style={{ fontSize: '18px' }}>
        {auctionDetails.description}
      </div>
      <div className="popup-auctioneer">
        <strong>Auctioneer:</strong> {auctionDetails.auctioneerName}
      </div>
    </div>
  );
};

export default AuctionPopup;
