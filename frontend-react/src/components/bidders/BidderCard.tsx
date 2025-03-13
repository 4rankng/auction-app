import React from 'react';
import { Bidder } from '../../models/types';
import Card from '../ui/Card';

interface BidderCardProps {
  bidder: Bidder;
  isHighestBidder?: boolean;
  onClick?: () => void;
  className?: string;
}

const BidderCard: React.FC<BidderCardProps> = ({
  bidder,
  isHighestBidder = false,
  onClick,
  className = ''
}) => {
  return (
    <Card
      className={`transition-all duration-200 ${isHighestBidder ? 'ring-2 ring-green-500' : ''} ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="relative">
          <img
            src={bidder.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(bidder.name)}&background=random&size=64`}
            alt={bidder.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          {isHighestBidder && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{bidder.name}</h3>
          {bidder.phone && (
            <p className="text-sm text-gray-600">
              <span className="inline-block mr-1">
                <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              {bidder.phone}
            </p>
          )}
          {bidder.email && (
            <p className="text-sm text-gray-600">
              <span className="inline-block mr-1">
                <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              {bidder.email}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BidderCard;
