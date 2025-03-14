import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Bidder {
  id: string;
  name: string;
}

interface BidHistory {
  round: number;
  bidder: string;
  amount: string;
  timestamp: string;
}

export const BidPage: React.FC = () => {
  const [currentRound, setCurrentRound] = useState<number>(6);
  const [currentPrice, setCurrentPrice] = useState<string>('1.500.000 VND');
  const [bidIncrement, setBidIncrement] = useState<string>('100.000 VND');
  const [participantsCount, setParticipantsCount] = useState<number>(20);
  const [timeLeft, setTimeLeft] = useState<string>('04:35');
  const [selectedBidder, setSelectedBidder] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([
    { round: 5, bidder: 'Nguyễn Văn A (bidder-1)', amount: '1.500.000 VND', timestamp: '13/03/2023 10:25:30' },
    { round: 4, bidder: 'Trần Thị B (bidder-2)', amount: '1.400.000 VND', timestamp: '13/03/2023 10:24:15' },
    { round: 3, bidder: 'Lê Văn C (bidder-3)', amount: '1.300.000 VND', timestamp: '13/03/2023 10:23:05' },
    { round: 2, bidder: 'Phạm Thị D (bidder-4)', amount: '1.200.000 VND', timestamp: '13/03/2023 10:22:10' },
    { round: 1, bidder: 'Hoàng Văn E (bidder-5)', amount: '1.100.000 VND', timestamp: '13/03/2023 10:21:00' },
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [auctionTitle, setAuctionTitle] = useState<string>('Phiên Đấu Giá');
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Generate bidders (1-20)
  const bidders = Array.from({ length: 20 }, (_, i) => ({
    id: (i + 1).toString(),
    name: `Bidder ${i + 1}`
  }));

  useEffect(() => {
    // Get auction ID from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const auctionId = queryParams.get('id');

    if (!auctionId) {
      showToast('No auction ID provided', 'error');
      navigate('/history');
      return;
    }

    // In a real app, you would fetch the auction data from your backend or localStorage
    const loadAuctionData = () => {
      try {
        const storedAuctions = localStorage.getItem('auctions');
        if (storedAuctions) {
          const auctions = JSON.parse(storedAuctions);
          const auction = auctions.find((a: any) => a.id === parseInt(auctionId));

          if (auction) {
            setAuctionTitle(auction.title || 'Phiên Đấu Giá');
            setCurrentPrice(auction.currentPrice || '1.500.000 VND');
            setBidIncrement(auction.priceStep || '100.000 VND');
            // Load other auction data as needed
          } else {
            showToast('Auction not found', 'error');
            navigate('/history');
          }
        }
      } catch (error) {
        console.error('Error loading auction data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuctionData();

    // Start a timer to update the time left
    const timer = setInterval(() => {
      // This is a simple countdown timer, in a real app you would sync with the server
      setTimeLeft(prev => {
        const [minutes, seconds] = prev.split(':').map(Number);
        let newSeconds = seconds - 1;
        let newMinutes = minutes;

        if (newSeconds < 0) {
          newSeconds = 59;
          newMinutes -= 1;
        }

        if (newMinutes < 0) {
          clearInterval(timer);
          return '00:00';
        }

        return `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location.search, navigate]);

  const handleBidderSelect = (bidderId: string) => {
    setSelectedBidder(bidderId === selectedBidder ? null : bidderId);
  };

  const handlePlaceBid = () => {
    if (!selectedBidder || !bidAmount) return;

    // In a real app, you would send this to your backend
    const newBid: BidHistory = {
      round: currentRound + 1,
      bidder: `Bidder ${selectedBidder}`,
      amount: `${bidAmount} VND`,
      timestamp: new Date().toLocaleString()
    };

    setBidHistory([newBid, ...bidHistory]);
    setCurrentRound(currentRound + 1);
    setCurrentPrice(`${bidAmount} VND`);
    setSelectedBidder(null);
    setBidAmount('');
    showToast('Bid placed successfully', 'success');
  };

  const handleEndAuction = () => {
    // In a real app, you would send this to your backend
    showToast('Auction ended successfully', 'success');
    navigate('/history');
  };

  const handleCancelBid = () => {
    setSelectedBidder(null);
    setBidAmount('');
    showToast('Bid canceled', 'success');
  };

  const handleGoBack = () => {
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="container py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      {/* Toast Container */}
      <div className="toast-container position-fixed top-0 end-0 p-3">
        <div className={`toast ${toast.show ? 'show' : ''} ${toast.type === 'success' ? 'bg-success' : 'bg-danger'} text-white`} role="alert">
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header d-flex justify-content-between align-items-center py-2">
          <div className="d-flex align-items-center">
            <h5 className="mb-0 me-2">{auctionTitle}</h5>
            <span className="badge bg-success">Đang diễn ra</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="text-center me-3">
              <h2 className="text-success mb-0">{timeLeft}</h2>
            </div>
            <button className="btn btn-danger" onClick={handleEndAuction}>
              <i className="bi bi-stop-circle me-1"></i> Kết Thúc Đấu Giá
            </button>
          </div>
        </div>

        <div className="card-body py-2">
          <div className="row text-center mb-3">
            <div className="col-md-3">
              <small className="text-muted">Vòng đấu giá</small>
              <h4 className="mb-0">{currentRound}</h4>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Giá hiện tại</small>
              <h4 className="mb-0">{currentPrice}</h4>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Bước giá</small>
              <h4 className="mb-0">{bidIncrement}</h4>
            </div>
            <div className="col-md-3">
              <small className="text-muted">Người tham gia</small>
              <h4 className="mb-0">{participantsCount}</h4>
            </div>
          </div>

          <div className="mb-3">
            <h5 className="mb-2">Chọn người tham gia</h5>
            <div className="d-flex flex-wrap justify-content-center">
              {bidders.map((bidder) => (
                <button
                  key={bidder.id}
                  className={`btn ${selectedBidder === bidder.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    padding: '0',
                    borderRadius: '4px',
                    margin: '3px',
                    border: selectedBidder === bidder.id ? '2px solid #0d6efd' : '1px solid #6c757d',
                    fontWeight: 'bold'
                  }}
                  onClick={() => handleBidderSelect(bidder.id)}
                >
                  {bidder.id}
                </button>
              ))}
            </div>
          </div>

          <div className="row align-items-center mb-2">
            <div className="col-md-3">
              <label htmlFor="bidderName" className="form-label mb-0">Name</label>
              <input
                type="text"
                className="form-control"
                id="bidderName"
                value={selectedBidder ? `Bidder ${selectedBidder}` : ''}
                readOnly
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="bidAmount" className="form-label mb-0">Price</label>
              <input
                type="text"
                className="form-control"
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter bid amount"
              />
            </div>
            <div className="col-md-6 d-flex">
              <button
                className="btn fw-bold me-2"
                style={{
                  minWidth: '120px',
                  backgroundColor: '#4a86f7',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '10px 15px'
                }}
                onClick={handlePlaceBid}
                disabled={!selectedBidder || !bidAmount}
              >
                <i className="bi bi-check-circle me-1"></i> Đấu Giá
              </button>
              <button
                className="btn fw-bold"
                style={{
                  minWidth: '180px',
                  color: '#dc3545',
                  backgroundColor: 'white',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  padding: '10px 15px'
                }}
                onClick={handleCancelBid}
              >
                <i className="bi bi-x-circle me-1"></i> Hủy Đấu Giá Cuối
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header py-2">
          <h5 className="mb-0">Lịch Sử Đấu Giá</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Vòng</th>
                  <th>Người tham gia</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {bidHistory.map((bid, index) => (
                  <tr key={index}>
                    <td>{bid.round}</td>
                    <td>{bid.bidder}</td>
                    <td>{bid.amount}</td>
                    <td>{bid.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="text-end">
        <button className="btn btn-secondary" onClick={handleGoBack}>
          <i className="bi bi-arrow-left me-1"></i> Quay Lại Thiết Lập
        </button>
      </div>
    </div>
  );
};
