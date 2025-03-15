import React, { useEffect, useRef, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import NewWindow from 'react-new-window';
import styled from 'styled-components';
import * as timerService from '../services/timerService';

interface AuctionPopupRendererProps {
  auctioneer: string;
  startingPrice: string;
  bidStep: string;
  bidNumber: number;
  bidRound: string;
  highestBidderId?: string;
  companyName: string;
  auctionTitle: string;
  highestBidAmount: string;
  isAuctionEnded: boolean;
  onClose: () => void;
  // New props for auction results
  winnerId?: string;
  finalPrice?: string;
  totalBids?: number;
  auctionDuration?: string;
}

// Define styled components for the popup
const StyledContainer = styled.div`
  /* Base styles and fonts */
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
  font-family: 'Roboto', sans-serif;

  /* Background styling for the entire popup */
  html, body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    background-color: #101010; /* Darker background color for better focus */
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
  }

  /* Full height/width container */
  #root, & {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  /* Auction container */
  .auction-container {
    width: 100%;
    max-width: 90vw;
    height: auto;
    max-height: 95vh;
    margin: 0;
    padding: 0;
    border-radius: 10px;
    overflow: hidden;
    background-color: #fff;
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  /* Company header */
  .company-header {
    text-align: center;
    padding: clamp(10px, 3vh, 25px);
    font-size: clamp(18px, 4vw, 24px);
    font-weight: bold;
    background-color: #007bff;
    color: white;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Content container */
  .auction-content {
    border: 1px solid #e9ecef;
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 0;
    overflow: auto; /* Change to auto to handle overflow content */
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0; /* Important for flex child to properly scroll */
  }

  /* Auction title */
  .auction-title {
    background-color: #f8f9fa;
    padding: clamp(10px, 2vh, 20px) clamp(15px, 3vw, 25px);
    font-size: clamp(16px, 3vw, 20px);
    font-weight: bold;
    color: #007bff;
    border-bottom: 2px solid #e9ecef;
    border-left: 4px solid #007bff;
    margin-bottom: 0;
  }

  /* Auction details section */
  .auction-details {
    background-color: #fff;
    padding: clamp(10px, 2vh, 20px);
    flex: 1;
    overflow-y: auto; /* Allow scrolling if content is too tall */
  }

  /* Row for auction details */
  .detail-row {
    display: grid;
    grid-template-columns: 130px 1fr 160px 1fr;
    border-bottom: 1px solid #e9ecef;
    padding: clamp(8px, 1.5vh, 15px) 0;
    margin-bottom: 5px;
    align-items: center;
  }

  /* Label styling */
  .detail-label {
    padding: 0 15px;
    color: #495057;
    text-align: left;
    font-weight: 500;
    font-size: clamp(13px, 2vw, 15px);
  }

  /* Value styling */
  .detail-value {
    padding: 0 15px;
    text-align: center;
    font-weight: 400;
    font-size: clamp(13px, 2vw, 15px);
  }

  /* Green text for starting price */
  .detail-value.green {
    color: #28a745;
    text-align: center;
    font-weight: 700;
  }

  /* Italic text for highest bidder */
  .detail-value.italic {
    font-style: italic;
    text-align: center;
    font-weight: 700;
    color: #17a2b8;
  }

  /* Right column label */
  .detail-label.right-column {
    padding-left: 20px;
  }

  /* Timer section */
  .timer-section {
    background-color: #f8f9fa;
    padding: clamp(15px, 2.5vh, 25px);
    margin-top: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-top: 2px solid #e9ecef;
  }

  /* Timer label */
  .timer-label {
    margin-bottom: clamp(10px, 2vh, 20px);
    color: #495057;
    width: 100%;
    text-align: center;
    font-weight: 700;
    font-size: clamp(16px, 2.5vw, 18px);
  }

  /* Timer value */
  .timer-value {
    display: inline-block;
    background-color: #dc3545;
    color: white;
    font-size: clamp(24px, 5vw, 32px);
    font-weight: bold;
    padding: clamp(8px, 1.5vh, 12px) clamp(15px, 2.5vw, 25px);
    border-radius: 8px;
    min-width: 60px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(220, 53, 69, 0.3);
  }

  /* Auction result styles */
  .result-container {
    background-color: #f8f9fa;
    padding: clamp(20px, 3vh, 30px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
  }

  .result-header {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: bold;
    color: #28a745;
    margin-bottom: clamp(20px, 3vh, 30px);
    text-transform: uppercase;
    border-bottom: 2px solid #28a745;
    padding-bottom: 10px;
    width: fit-content;
  }

  .winner-section {
    margin-bottom: clamp(20px, 3vh, 30px);
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 80%;
  }

  .winner-label {
    font-size: clamp(16px, 3vw, 20px);
    color: #6c757d;
    margin-bottom: 10px;
  }

  .winner-name {
    font-size: clamp(18px, 3.5vw, 24px);
    font-weight: bold;
    color: #17a2b8;
  }

  .price-label {
    font-size: clamp(16px, 3vw, 20px);
    color: #6c757d;
    margin-bottom: 10px;
  }

  .final-price {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: bold;
    color: #28a745;
  }

  .auction-stats {
    display: flex;
    justify-content: space-around;
    width: 80%;
    margin-top: clamp(20px, 3vh, 30px);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #fff;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    min-width: 120px;
  }

  .stat-label {
    font-size: clamp(12px, 2vw, 14px);
    color: #6c757d;
    margin-bottom: 5px;
  }

  .stat-value {
    font-size: clamp(16px, 3vw, 20px);
    font-weight: bold;
    color: #007bff;
  }

  /* Media queries for responsiveness */
  @media (max-width: 650px) {
    .detail-row {
      grid-template-columns: 120px 1fr;
      padding: 10px 0;
    }

    .detail-label {
      padding-left: 10px;
      font-size: 14px;
    }

    .detail-label.right-column {
      padding-left: 10px;
      margin-top: 10px;
    }

    .detail-value {
      font-size: 14px;
      padding: 0 10px;
    }

    .timer-value {
      font-size: 28px;
      padding: 8px 15px;
    }

    .winner-section, .auction-stats {
      width: 90%;
    }

    .auction-stats {
      flex-direction: column;
      gap: 15px;
    }

    .stat-item {
      width: 100%;
    }
  }
`;

const AuctionPopupRenderer: React.FC<AuctionPopupRendererProps> = (props) => {
  const {
    companyName,
    auctioneer,
    startingPrice,
    bidStep,
    bidNumber,
    bidRound,
    highestBidderId,
    auctionTitle,
    highestBidAmount,
    isAuctionEnded,
    onClose,
    winnerId,
    finalPrice,
    totalBids,
    auctionDuration
  } = props;

  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  // Add a ref to track if we've already created a popup window
  const popupCreatedRef = useRef<boolean>(false);

  // Timer subscription
  useEffect(() => {
    // This effect should only run once when the component mounts
    console.log("AuctionPopupRenderer: Component mounted");

    // Set a flag to track that we're rendering a popup to prevent duplicates
    popupCreatedRef.current = true;

    // Set the window title
    if (containerRef.current?.ownerDocument) {
      containerRef.current.ownerDocument.title = isAuctionEnded
        ? 'Kết Quả Đấu Giá'
        : 'Thông Tin Đấu Giá';
    }

    // Subscribe to timer updates
    const subscription = timerService.getTimerObservable().subscribe((timeLeft: number) => {
      setRemainingTime(timeLeft);
    });

    // Add resize event listener to ensure proper layout after window resize
    const handleResize = () => {
      // Force reflow by accessing offsetHeight
      if (containerRef.current) {
        const height = containerRef.current.offsetHeight;
        containerRef.current.style.height = `${height}px`;
        // Reset to auto to allow normal flow
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.height = 'auto';
          }
        }, 0);
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Clean up subscription and event listeners on unmount
    return () => {
      console.log("AuctionPopupRenderer: Component unmounting, cleanup");
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
      // Reset the flag
      popupCreatedRef.current = false;
    };
  }, [isAuctionEnded]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    return seconds.toString().padStart(2, '0');
  };

  // Handle the window close event
  const handleClose = () => {
    console.log("AuctionPopupRenderer: handleClose called");
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Render auction information content
  const renderAuctionContent = () => {
    if (isAuctionEnded) {
      return (
        <div className="result-container">
          <div className="result-header">Đấu Giá Kết Thúc</div>

          <div className="winner-section">
            <div className="winner-label">Người Trúng Đấu Giá</div>
            <div className="winner-name">
              {winnerId || highestBidderId || "Không có ID"}
            </div>

            <div className="price-label">Giá Trúng</div>
            <div className="final-price">{finalPrice || highestBidAmount || startingPrice}</div>
          </div>

          <div className="auction-stats">
            <div className="stat-item">
              <div className="stat-label">Tổng Số Lượt Đấu Giá</div>
              <div className="stat-value">{totalBids || bidNumber || 0}</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Thời Gian Diễn Ra</div>
              <div className="stat-value">{auctionDuration || "00:00:00"}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="auction-details">
          <div className="detail-row">
            <div className="detail-label">Đấu Giá Viên:</div>
            <div className="detail-value">{auctioneer}</div>
            <div className="detail-label right-column">Vòng Đấu Giá:</div>
            <div className="detail-value">{bidRound}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Giá Khởi Điểm:</div>
            <div className="detail-value green">{startingPrice}</div>
            <div className="detail-label right-column">Lần Trả Giá:</div>
            <div className="detail-value">{bidNumber}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">Bước Giá:</div>
            <div className="detail-value">{bidStep}</div>
            <div className="detail-label right-column">Người Trả Giá Cao Nhất:</div>
            <div className="detail-value italic">
              {highestBidderId || "Chưa có"}
            </div>
          </div>
        </div>

        <div className="timer-section">
          <div className="timer-label">
            Thời Gian Trả Còn Lại
          </div>
          <div className="timer-value">
            {formatTime(Math.floor(remainingTime))}
          </div>
        </div>
      </>
    );
  };

  // Only render the popup if it hasn't been created yet
  return (
    <>
      {isOpen && (
        <NewWindow
          title={isAuctionEnded ? "Kết Quả Đấu Giá" : "Thông Tin Đấu Giá"}
          features={{
            width: 750,
            height: 650,
            left: 100,
            top: 100
          }}
          onUnload={handleClose}
          onBlock={() => console.log("Popup was blocked!")}
          name="auction_display" // Use a consistent name for the popup window
        >
          <StyleSheetManager target={containerRef.current?.ownerDocument?.head || document.head}>
            <StyledContainer ref={containerRef}>
              <div className="auction-container">
                <div className="company-header">
                  {companyName}
                </div>

                <div className="auction-content">
                  <div className="auction-title">
                    {auctionTitle || "Thông Tin Đấu Giá"}
                  </div>

                  {renderAuctionContent()}
                </div>
              </div>
            </StyledContainer>
          </StyleSheetManager>
        </NewWindow>
      )}
    </>
  );
};

export default AuctionPopupRenderer;
