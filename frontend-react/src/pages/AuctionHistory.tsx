import React, { useEffect, useState } from 'react';
import AuctionCard from '../components/AuctionCard';
import { useNavigate } from 'react-router-dom';

interface Auction {
  id: number;
  title: string;
  status: string;
  startingPrice: string;
  currentPrice: string;
  priceStep: string;
  createdDate: string;
  timeLeft?: string;
}

const AuctionHistory: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuctions = localStorage.getItem('auctions');
    if (storedAuctions) {
      setAuctions(JSON.parse(storedAuctions));
    }
  }, []);

  const handleRemoveAllAuctions = () => {
    localStorage.removeItem('auctions');
    setAuctions([]);
  };

  const handleCreateNewAuction = () => {
    navigate('/setup');
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Auction System</h1>
        <div>
          <button className="btn btn-danger me-2" onClick={handleRemoveAllAuctions}>Remove All Auctions</button>
          <button className="btn btn-primary" onClick={handleCreateNewAuction}>Create New Auction</button>
        </div>
      </div>
      {auctions.length === 0 ? (
        <div className="text-center">
          <p>No Auctions Yet</p>
          <p>Get started by creating your first auction</p>
        </div>
      ) : (
        <div className="row">
          {auctions.map((auction) => (
            <div className="col-md-4 mb-4" key={auction.id}>
              <AuctionCard auction={auction} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionHistory;
