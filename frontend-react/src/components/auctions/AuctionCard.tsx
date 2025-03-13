import React from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../models/types';
import { AUCTION_STATUS, ROUTES } from '../../models/constants';
import Card from '../ui/Card';
import Button from '../ui/Button';
import databaseService from '../../services/databaseService';

interface AuctionCardProps {
  auction: Auction;
  className?: string;
}

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, className = '' }) => {
  const getStatusBadge = () => {
    switch (auction.status) {
      case AUCTION_STATUS.SETUP:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Setup</span>;
      case AUCTION_STATUS.IN_PROGRESS:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Progress</span>;
      case AUCTION_STATUS.ENDED:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Ended</span>;
      default:
        return null;
    }
  };

  const getActionButton = () => {
    switch (auction.status) {
      case AUCTION_STATUS.SETUP:
        return (
          <Link to={`${ROUTES.SETUP}/${auction.id}`}>
            <Button variant="primary" size="sm">
              Setup
            </Button>
          </Link>
        );
      case AUCTION_STATUS.IN_PROGRESS:
        return (
          <Link to={`${ROUTES.BID}/${auction.id}`}>
            <Button variant="success" size="sm">
              Bid Now
            </Button>
          </Link>
        );
      case AUCTION_STATUS.ENDED:
        return (
          <Link to={`${ROUTES.RESULT}/${auction.id}`}>
            <Button variant="secondary" size="sm">
              View Results
            </Button>
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={`h-full flex flex-col ${className}`}
      title={auction.title}
      footer={
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            <span className="text-sm text-gray-500">
              {auction.updatedAt && `Updated ${new Date(auction.updatedAt).toLocaleDateString()}`}
            </span>
          </div>
          {getActionButton()}
        </div>
      }
    >
      <div className="flex-grow">
        <p className="text-gray-600 mb-4">{auction.description}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Starting Price</p>
            <p className="font-medium">{databaseService.formatCurrency(auction.startingPrice)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Price</p>
            <p className="font-medium text-green-600">{databaseService.formatCurrency(auction.currentPrice)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price Step</p>
            <p className="font-medium">{databaseService.formatCurrency(auction.bidStep)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{new Date(auction.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AuctionCard;
