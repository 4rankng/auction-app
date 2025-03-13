import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../hooks/useAuction';
import './ResultPage.css';

export const ResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { auction, bids, loading, error } = useAuction();

  useEffect(() => {
    if (auction?.status !== 'ENDED') {
      navigate('/bid');
    }
  }, [auction, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !auction) {
    return <div className="error">{error || 'No auction found'}</div>;
  }

  return (
    <div className="result-page">
      <div className="result-card">
        <h1>Auction Results</h1>

        <div className="auction-summary">
          <h2>{auction.title}</h2>
          <p className="description">{auction.description}</p>

          <div className="result-details">
            <div className="detail-item">
              <span className="label">Starting Price</span>
              <span className="value">${auction.startingPrice.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Final Price</span>
              <span className="value">${auction.finalPrice?.toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="label">Total Bids</span>
              <span className="value">{bids.length}</span>
            </div>
            <div className="detail-item">
              <span className="label">Duration</span>
              <span className="value">
                {Math.floor((auction.endTime! - auction.startTime!) / 1000)} seconds
              </span>
            </div>
          </div>

          {auction.winner && (
            <div className="winner-section">
              <h3>Winner</h3>
              <div className="winner-info">
                <p className="winner-name">{auction.winner.name}</p>
                <p className="winner-bid">Final Bid: ${auction.winner.finalBid.toLocaleString()}</p>
              </div>
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

        <div className="action-buttons">
          <button
            onClick={() => navigate('/setup')}
            className="btn btn-primary"
          >
            Start New Auction
          </button>
          <button
            onClick={() => navigate('/bid')}
            className="btn btn-secondary"
          >
            View Bidding Page
          </button>
        </div>
      </div>
    </div>
  );
};
