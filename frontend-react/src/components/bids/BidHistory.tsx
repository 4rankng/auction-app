import React from 'react';
import { Bid } from '../../models/types';
import databaseService from '../../services/databaseService';

interface BidHistoryProps {
  bids: Bid[];
  className?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ bids, className = '' }) => {
  if (bids.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No bids yet</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Round
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bidder
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bids.map((bid) => (
            <tr key={bid.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {bid.round}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <img
                      className="h-8 w-8 rounded-full"
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(bid.bidderName)}&background=random&size=32`}
                      alt={bid.bidderName}
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {bid.bidderName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="font-medium text-green-600">
                  {databaseService.formatCurrency(bid.amount)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(bid.timestamp).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BidHistory;
