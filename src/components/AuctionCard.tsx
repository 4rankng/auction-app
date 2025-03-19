import React from 'react';
import './AuctionCard.css';

interface AuctionCardProps {
  auction: {
    id: string;
    title: string;
    status: string;
    currentPrice: number;
    settings: {
      startingPrice: number;
      bidStep: number;
      auctioneer: string;
    };
    createdDate?: string;
    timeLeft?: string;
  };
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  return (
    <div className="card auction-card mb-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className={`badge ${auction.status === 'ENDED' ? 'bg-danger' : auction.status === 'IN_PROGRESS' ? 'bg-success' : 'bg-primary'}`}>
          {auction.status === 'SETUP' ? 'Chuẩn bị' : auction.status === 'IN_PROGRESS' ? 'Đang đấu giá' : 'Kết thúc'}
        </span>
        {auction.createdDate && <small className="text-muted">{auction.createdDate}</small>}
      </div>
      <div className="card-body">
        <h5 className="card-title">{auction.title}</h5>
        <p className="mb-1">Starting Price: {auction.settings.startingPrice?.toLocaleString('vi-VN')} VND</p>
        <p className="mb-1">Current Price: <span className="text-success">{auction.currentPrice?.toLocaleString('vi-VN')} VND</span></p>
        <p className="mb-1">Price Step: {auction.settings.bidStep?.toLocaleString('vi-VN')} VND</p>
        {auction.timeLeft && <p className="mb-1">{auction.timeLeft}</p>}
      </div>
      <div className="card-footer d-flex justify-content-between">
        <button className="btn btn-outline-primary">View Detail</button>
        {auction.status === 'IN_PROGRESS' && <button className="btn btn-success">Bid Now</button>}
      </div>
    </div>
  );
};

export default AuctionCard;
