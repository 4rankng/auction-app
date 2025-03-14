import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BidHistoryTable from '../components/BidHistoryTable';
import BidderSelectionGrid from '../components/BidderSelectionGrid';
import BidControls from '../components/BidControls';
import AuctionSummary from '../components/AuctionSummary';
import AuctionHeader from '../components/AuctionHeader';

// We're using the Bidder interface from BidderSelectionGrid component
// This interface is used for the bidders array
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
  // participantsCount would be updated from the backend in a real application
  // keeping the setter for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [auctionId, setAuctionId] = useState<number | null>(null);

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
    const auctionIdParam = queryParams.get('id');

    if (!auctionIdParam) {
      showToast('No auction ID provided', 'error');
      navigate('/history');
      return;
    }

    const parsedAuctionId = parseInt(auctionIdParam);
    setAuctionId(parsedAuctionId);

    // In a real app, you would fetch the auction data from your backend or localStorage
    const loadAuctionData = () => {
      try {
        const storedAuctions = localStorage.getItem('auctions');
        if (storedAuctions) {
          const auctions = JSON.parse(storedAuctions);
          const auction = auctions.find((a: any) => a.id === parsedAuctionId);

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
        {/* Auction Header Component */}
        <AuctionHeader
          title={auctionTitle}
          timeLeft={timeLeft}
          onEndAuction={handleEndAuction}
        />

        <div className="card-body py-2">
          {/* Auction Summary Component */}
          <AuctionSummary
            currentRound={currentRound}
            currentPrice={currentPrice}
            bidIncrement={bidIncrement}
            participantsCount={participantsCount}
          />

          {/* Bidder Selection Grid Component */}
          <BidderSelectionGrid
            bidders={bidders}
            selectedBidder={selectedBidder}
            onBidderSelect={handleBidderSelect}
          />

          {/* Bid Controls Component */}
          <BidControls
            bidderName={selectedBidder ? `Bidder ${selectedBidder}` : ''}
            bidAmount={bidAmount}
            currentPrice={currentPrice.replace(' VND', '')}
            bidIncrement={bidIncrement.replace(' VND', '')}
            onBidAmountChange={setBidAmount}
            onPlaceBid={handlePlaceBid}
            onCancelBid={handleCancelBid}
            isPlaceBidDisabled={!selectedBidder}
          />
        </div>
      </div>

      {/* Bid History Table Component */}
      {auctionId && <BidHistoryTable
        auctionId={auctionId}
        initialData={bidHistory.map((bid, index) => ({
          id: index,
          ...bid
        }))}
        refreshInterval={10000} // Refresh every 10 seconds
      />}

      <div className="text-end">
        <button className="btn btn-secondary" onClick={handleGoBack}>
          <i className="bi bi-arrow-left me-1"></i> Quay Lại Thiết Lập
        </button>
      </div>
    </div>
  );
};
