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
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const storedAuctions = localStorage.getItem('auctions');
    if (storedAuctions) {
      setAuctions(JSON.parse(storedAuctions));
    }
  }, []);

  const handleRemoveAllAuctions = () => {
    localStorage.removeItem('auctions');
    setAuctions([]);
    showToast('All auctions have been removed', 'success');
  };

  const handleCreateNewAuction = () => {
    navigate('/setup');
  };

  return (
    <div className="container py-4">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

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
              <AuctionCard auction={auction} showToast={showToast} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionHistory;
