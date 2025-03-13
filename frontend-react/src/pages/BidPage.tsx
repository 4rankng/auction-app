import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import { Bidder } from '../types';
import './BidPage.css';

export const BidPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    auction,
    bidders,
    bids,
    loading,
    error,
    updateAuction,
    placeBid,
    refreshData,
  } = useAuction();

  const [selectedBidder, setSelectedBidder] = useState<Bidder | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastBidderId, setLastBidderId] = useState<string | null>(null);

  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      if (!isPaused && timeLeft > 0) {
        setTimeLeft(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isPaused, auction]);

  useEffect(() => {
    if (auction?.timeLeft) {
      setTimeLeft(auction.timeLeft);
    }
  }, [auction]);

  useEffect(() => {
    if (bids.length > 0) {
      setLastBidderId(bids[bids.length - 1].bidderId);
    }
  }, [bids]);

  const handleBidderSelect = (bidder: Bidder) => {
    if (bidder.id === lastBidderId) {
      alert('This bidder cannot bid consecutively');
      return;
    }
    setSelectedBidder(bidder);
  };

  const handleBid = async (amount: number) => {
    if (!selectedBidder || !auction) return;

    try {
      await placeBid(selectedBidder.id, amount);
      setTimeLeft(30); // Reset timer to 30 seconds after each bid
      refreshData();
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid. Please try again.');
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (auction) {
      updateAuction({ ...auction, timeLeft });
    }
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleEndAuction = async () => {
    if (!auction) return;

    const highestBid = bids.reduce((max, bid) =>
      bid.amount > max.amount ? bid : max
    , bids[0]);

    const updatedAuction = {
      ...auction,
      status: 'ENDED' as const,
      endTime: Date.now(),
      finalPrice: highestBid?.amount || auction.currentPrice,
      winner: highestBid ? {
        id: highestBid.bidderId,
        name: highestBid.bidderName,
        finalBid: highestBid.amount,
      } : undefined,
    };

    await updateAuction(updatedAuction);
    navigate('/result');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !auction) {
    return <div className="error">{error || 'No active auction found'}</div>;
  }

  return (
    <div className="bid-page">
      <div className="auction-info">
        <h1>{auction.title}</h1>
        <p className="description">{auction.description}</p>

        <div className="timer-section">
          <div className="timer-display">
            <span className="time">{timeLeft}</span>
            <span className="seconds">seconds</span>
          </div>
          <div className="timer-controls">
            {isPaused ? (
              <button onClick={handleResume} className="btn btn-primary">
                Resume
              </button>
            ) : (
              <button onClick={handlePause} className="btn btn-warning">
                Pause
              </button>
            )}
          </div>
        </div>

        <div className="price-info">
          <div className="current-price">
            <span className="label">Current Price:</span>
            <span className="amount">${auction.currentPrice.toLocaleString()}</span>
          </div>
          <div className="min-bid">
            <span className="label">Minimum Bid:</span>
            <span className="amount">${(auction.currentPrice + auction.bidStep).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bidding-section">
        <h2>Select Bidder</h2>
        <div className="bidder-grid">
          {bidders.map(bidder => (
            <button
              key={bidder.id}
              className={`bidder-button ${selectedBidder?.id === bidder.id ? 'selected' : ''} ${
                bidder.id === lastBidderId ? 'disabled' : ''
              }`}
              onClick={() => handleBidderSelect(bidder)}
              disabled={bidder.id === lastBidderId}
            >
              {bidder.name}
            </button>
          ))}
        </div>

        {selectedBidder && (
          <div className="bidding-controls">
            <div className="quick-bid-buttons">
              <button
                onClick={() => handleBid(auction.currentPrice + auction.bidStep)}
                className="btn btn-primary"
              >
                Bid +${auction.bidStep}
              </button>
              <button
                onClick={() => handleBid(auction.currentPrice + auction.bidStep * 2)}
                className="btn btn-primary"
              >
                Bid +${auction.bidStep * 2}
              </button>
            </div>
            <button
              onClick={handleEndAuction}
              className="btn btn-danger end-auction-btn"
            >
              End Auction
            </button>
          </div>
        )}
      </div>

      <div className="bid-history">
        <h2>Bid History</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Round</th>
                <th>Bidder</th>
                <th>Amount</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {bids.map(bid => (
                <tr key={bid.id}>
                  <td>{bid.round}</td>
                  <td>{bid.bidderName}</td>
                  <td>${bid.amount.toLocaleString()}</td>
                  <td>{new Date(bid.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
