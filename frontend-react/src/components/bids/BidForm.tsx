import React, { useState } from 'react';
import { Auction, Bidder } from '../../models/types';
import Button from '../ui/Button';
import databaseService from '../../services/databaseService';

interface BidFormProps {
  auction: Auction;
  selectedBidder: Bidder | null;
  onBidPlaced: () => void;
  className?: string;
}

const BidForm: React.FC<BidFormProps> = ({
  auction,
  selectedBidder,
  onBidPlaced,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const nextBidAmount = auction.currentPrice + auction.bidStep;

  const handleSubmit = async (amount: number) => {
    if (!selectedBidder) return;

    setIsSubmitting(true);

    try {
      await databaseService.bid.create({
        auctionId: auction.id,
        bidderId: selectedBidder.id,
        amount
      });

      onBidPlaced();
    } catch (error) {
      console.error('Error placing bid:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickBid = () => {
    handleSubmit(nextBidAmount);
  };

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof customAmount !== 'number' || customAmount <= auction.currentPrice) {
      return;
    }

    handleSubmit(customAmount);
  };

  if (!selectedBidder) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}>
        <p className="text-yellow-700">Please select a bidder to place a bid</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-md p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Place a Bid</h3>
        <p className="text-sm text-gray-600">
          Current price: <span className="font-medium">{databaseService.formatCurrency(auction.currentPrice)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Minimum bid: <span className="font-medium">{databaseService.formatCurrency(nextBidAmount)}</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Bidding as:</p>
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img
              className="h-10 w-10 rounded-full"
              src={selectedBidder.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedBidder.name)}&background=random&size=40`}
              alt={selectedBidder.name}
            />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {selectedBidder.name}
            </div>
            {selectedBidder.phone && (
              <div className="text-xs text-gray-500">
                {selectedBidder.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Button
            variant="success"
            fullWidth
            onClick={handleQuickBid}
            isLoading={isSubmitting && !useCustomAmount}
            disabled={isSubmitting}
          >
            Quick Bid: {databaseService.formatCurrency(nextBidAmount)}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <form onSubmit={handleCustomBid}>
          <div className="flex items-center">
            <div className="flex-grow mr-2">
              <label htmlFor="customAmount" className="sr-only">Custom Amount</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₫</span>
                </div>
                <input
                  type="number"
                  name="customAmount"
                  id="customAmount"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter amount"
                  min={nextBidAmount}
                  step={auction.bidStep}
                  value={customAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomAmount(value === '' ? '' : Number(value));
                    setUseCustomAmount(true);
                  }}
                  disabled={isSubmitting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">VND</span>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting && useCustomAmount}
              disabled={isSubmitting || typeof customAmount !== 'number' || customAmount <= auction.currentPrice}
            >
              Bid
            </Button>
          </div>
          {typeof customAmount === 'number' && customAmount <= auction.currentPrice && (
            <p className="mt-1 text-sm text-red-600">
              Bid amount must be greater than current price
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default BidForm;
