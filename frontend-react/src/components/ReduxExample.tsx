import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bidderSelected, bidderTimerTick, bidderTimerReset } from '../store/auctionSlice';
import { fetchAuctionData, placeBid, cancelBid, startNextRound, endAuction } from '../store/auctionThunks';

interface ReduxExampleProps {
  auctionId: string;
}

export const ReduxExample: React.FC<ReduxExampleProps> = ({ auctionId }) => {
  const dispatch = useAppDispatch();

  // Select data from the Redux store
  const auction = useAppSelector(state => state.auction.auction);
  const bidders = useAppSelector(state => state.auction.bidders);
  const bids = useAppSelector(state => state.auction.bids);
  const currentRound = useAppSelector(state => state.auction.currentRound);
  const endTime = useAppSelector(state => state.auction.endTime);
  const status = useAppSelector(state => state.auction.status);
  const selectedBidderId = useAppSelector(state => state.auction.selectedBidderId);
  const bidderTimeLeft = useAppSelector(state => state.auction.bidderTimeLeft);

  // Load auction data when component mounts
  useEffect(() => {
    dispatch(fetchAuctionData(auctionId));
  }, [dispatch, auctionId]);

  // Set up bidder timer
  useEffect(() => {
    if (selectedBidderId && status === 'active') {
      const timer = setInterval(() => {
        dispatch(bidderTimerTick());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [dispatch, selectedBidderId, status]);

  // Handle bidder selection
  const handleSelectBidder = (bidderId: string) => {
    dispatch(bidderSelected(bidderId));
  };

  // Handle placing a bid
  const handlePlaceBid = (amount: number) => {
    if (selectedBidderId && auction) {
      dispatch(placeBid({
        auctionId: auction.id,
        bidderId: selectedBidderId,
        amount
      }));
    }
  };

  // Handle cancelling a bid
  const handleCancelBid = (bidId: string) => {
    dispatch(cancelBid(bidId));
  };

  // Handle starting next round
  const handleStartNextRound = () => {
    if (auction) {
      dispatch(startNextRound({
        auctionId: auction.id,
        duration: 300 // 5 minutes
      }));
    }
  };

  // Handle ending the auction
  const handleEndAuction = () => {
    if (auction) {
      dispatch(endAuction(auction.id));
    }
  };

  // Calculate time remaining
  const timeRemaining = endTime ? Math.max(0, Math.floor((endTime - Date.now()) / 1000)) : 0;

  if (status === 'loading') {
    return <div>Loading auction data...</div>;
  }

  if (status === 'error') {
    return <div>Error loading auction data</div>;
  }

  if (!auction) {
    return <div>No auction found</div>;
  }

  return (
    <div className="redux-example">
      <h2>Auction: {auction.title}</h2>

      <div className="auction-info">
        <p>Current Round: {currentRound}</p>
        <p>Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</p>
        <p>Current Price: {auction.currentPrice.toLocaleString()} VND</p>
        <p>Status: {status}</p>
      </div>

      <div className="bidder-selection">
        <h3>Select Bidder</h3>
        <div className="bidder-list">
          {bidders.map(bidder => (
            <button
              key={bidder.id}
              className={selectedBidderId === bidder.id ? 'selected' : ''}
              onClick={() => handleSelectBidder(bidder.id)}
            >
              {bidder.name}
            </button>
          ))}
        </div>

        {selectedBidderId && (
          <div className="bidder-controls">
            <p>Bidder Time Left: {bidderTimeLeft} seconds</p>
            <input
              type="number"
              placeholder="Bid Amount"
              min={auction.currentPrice + auction.bidStep}
              step={auction.bidStep}
            />
            <button onClick={() => handlePlaceBid(auction.currentPrice + auction.bidStep)}>
              Place Bid
            </button>
          </div>
        )}
      </div>

      <div className="bid-history">
        <h3>Bid History</h3>
        <ul>
          {bids.map(bid => (
            <li key={bid.id}>
              {bid.bidderName}: {bid.amount.toLocaleString()} VND
              <button onClick={() => handleCancelBid(bid.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="auction-controls">
        <button onClick={handleStartNextRound}>Start Next Round</button>
        <button onClick={handleEndAuction}>End Auction</button>
      </div>
    </div>
  );
};
