import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AuctionCardProps {
  auction: {
    id: number;
    title: string;
    status: string;
    startingPrice: string;
    currentPrice: string;
    priceStep: string;
    createdDate: string;
    timeLeft?: string;
  };
  showToast?: (message: string, type: 'success' | 'error') => void;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, showToast }) => {
  const navigate = useNavigate();
  const statusClass = auction.status === 'SETUP' ? 'bg-primary' : auction.status === 'ENDED' ? 'bg-secondary' : 'bg-success';
  const statusText = auction.status === 'SETUP' ? 'Setup' : auction.status === 'ENDED' ? 'Ended' : 'In Progress';

  const handleBidNow = () => {
    navigate(`/bid?id=${auction.id}`);
  };

  const handleViewDetail = () => {
    // You can implement this later if needed
    if (showToast) {
      showToast(`View details for auction ${auction.id}`, 'success');
    } else {
      console.log(`View details for auction ${auction.id}`);
    }
  };

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className={`badge ${statusClass}`}>{statusText}</span>
        <span>{auction.createdDate}</span>
      </div>
      <div className="card-body">
        <h5 className="card-title">{auction.title}</h5>
        <p className="mb-1">Starting Price: {auction.startingPrice}</p>
        <p className="mb-1">Current Price: <span className="text-success">{auction.currentPrice}</span></p>
        <p className="mb-1">Price Step: {auction.priceStep}</p>
        {auction.timeLeft && <p className="mb-1">{auction.timeLeft}</p>}
      </div>
      <div className="card-footer d-flex justify-content-between">
        <button className="btn btn-outline-primary" onClick={handleViewDetail}>View Detail</button>
        {auction.status === 'IN_PROGRESS' && <button className="btn btn-success" onClick={handleBidNow}>Bid Now</button>}
      </div>
    </div>
  );
};

export default AuctionCard;
