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
  timerValue?: number;
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

  /* Additional styles */
  .hidden {
    display: none;
  }

  .unified-auction-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
  }
`;

// Define a string with global styles to ensure they get applied correctly
const globalStyles = `
  /* Base styles and fonts */
  body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #101010;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  /* Styling for the auction ended state */
  body.auction-ended .result-container {
    background-color: #f8f9fa;
    padding: 20px;
  }

  /* Hidden elements */
  .hidden {
    display: none !important;
  }

  /* Unified container for both states */
  .unified-auction-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
  }

  /* Ensure result container has proper styling */
  .result-container {
    background-color: #f8f9fa;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
  }

  .result-header {
    font-size: 28px;
    font-weight: bold;
    color: #28a745;
    margin-bottom: 30px;
    text-transform: uppercase;
    border-bottom: 2px solid #28a745;
    padding-bottom: 10px;
    width: fit-content;
  }

  .winner-section {
    margin-bottom: 30px;
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    width: 80%;
  }

  .winner-label {
    font-size: 20px;
    color: #6c757d;
    margin-bottom: 10px;
  }

  .winner-name {
    font-size: 24px;
    font-weight: bold;
    color: #17a2b8;
    margin-bottom: 15px;
  }

  .price-label {
    font-size: 20px;
    color: #6c757d;
    margin-bottom: 10px;
  }

  .final-price {
    font-size: 28px;
    font-weight: bold;
    color: #28a745;
    margin-bottom: 5px;
  }

  .auction-stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    width: 100%;
  }

  .stat-item {
    background-color: #fff;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    min-width: 200px;
    flex: 1;
  }

  .stat-label {
    font-size: 16px;
    color: #6c757d;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 22px;
    font-weight: bold;
    color: #007bff;
  }

  /* Additional animation for auction end transition */
  .auction-ended-transition {
    animation: fadeInOut 0.3s ease-in-out;
  }

  @keyframes fadeInOut {
    0% { opacity: 0.8; }
    50% { opacity: 0.9; }
    100% { opacity: 1; }
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
    timerValue,
    onClose,
    winnerId,
    finalPrice,
    totalBids,
    auctionDuration
  } = props;

  const [isOpen, setIsOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [remainingTime, setRemainingTime] = useState<number>(timerValue || 0);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Add a ref to track if we've already created a popup window
  const popupCreatedRef = useRef<boolean>(false);
  // Add ref to track previous timer value
  const prevTimerValueRef = useRef<number>(timerValue || 0);

  // Track the previous auction end state to detect changes
  const prevEndedStateRef = useRef<boolean>(isAuctionEnded);

  // Add a ref to track if styles have been applied
  const stylesAppliedRef = useRef<boolean>(false);

  // Add a ref to track if we've handled auction end
  const endHandledRef = useRef<boolean>(false);

  // Timer subscription
  useEffect(() => {
    // This effect should only run once when the component mounts
    console.log("AuctionPopupRenderer: Component mounted");

    // Set a flag to track that we're rendering a popup to prevent duplicates
    popupCreatedRef.current = true;

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
  }, []);

  // Enhanced font and style loading with delay to ensure DOM is ready
  useEffect(() => {
    // Add a small delay to ensure the popup window is fully initialized
    const styleTimer = setTimeout(() => {
      if (containerRef.current && containerRef.current.ownerDocument) {
        const popupDocument = containerRef.current.ownerDocument;

        console.log("AuctionPopupRenderer: Applying styles to popup");

        // Check if the font link is already in the document
        const existingLink = popupDocument.querySelector('link[href*="fonts.googleapis.com"]');

        if (!existingLink) {
          // Create and append the font link
          const fontLink = popupDocument.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
          fontLink.crossOrigin = 'anonymous';

          popupDocument.head.appendChild(fontLink);
          console.log("AuctionPopupRenderer: Font link added to popup window");
        }

        // Always add global styles directly to ensure basic styling works
        const styleTag = popupDocument.createElement('style');
        styleTag.textContent = globalStyles;
        popupDocument.head.appendChild(styleTag);
        console.log("AuctionPopupRenderer: Global styles added to popup window");

        // Mark styles as applied
        stylesAppliedRef.current = true;
      }
    }, 200); // Short delay to ensure DOM is ready

    return () => {
      clearTimeout(styleTimer);
    };
  }, [isOpen]); // Run when the popup is opened

  // Update the window title when the auction status changes
  useEffect(() => {
    if (containerRef.current?.ownerDocument) {
      // Set the window title based on auction state
      const popupWindow = containerRef.current.ownerDocument.defaultView as Window;
      popupWindow.document.title = isAuctionEnded
        ? 'Kết Quả Đấu Giá'
        : 'Thông Tin Đấu Giá';

      // Check if the auction end state has changed
      if (isAuctionEnded !== prevEndedStateRef.current) {
        console.log("AuctionPopupRenderer: Auction end state changed to", isAuctionEnded);
        prevEndedStateRef.current = isAuctionEnded;

        // If the auction just ended, reapply styles to ensure they persist
        if (isAuctionEnded) {
          // Add a ref to track if we've handled auction end
          endHandledRef.current = true;

          // Force reapplication of styles
          stylesAppliedRef.current = false;

          // Directly inject styles again when auction ends
          const styleTag = popupWindow.document.createElement('style');
          styleTag.textContent = globalStyles;
          popupWindow.document.head.appendChild(styleTag);
          console.log("AuctionPopupRenderer: Global styles reapplied after auction end");

          // Add class to body for auction-ended state
          popupWindow.document.body.classList.add('auction-ended');

          const flashTitleBar = (window: Window) => {
            const originalTitle = window.document.title;
            let count = 0;
            const interval = setInterval(() => {
              if (count >= 10) {
                clearInterval(interval);
                window.document.title = originalTitle;
                return;
              }

              window.document.title = count % 2 === 0
                ? '🏆 ĐẤU GIÁ ĐÃ KẾT THÚC 🏆'
                : 'Kết Quả Đấu Giá';
              count++;
            }, 500);
          };

          flashTitleBar(popupWindow);
        }
      }
    }
  }, [isAuctionEnded]);

  // Add timer synchronization effect with improved logic
  useEffect(() => {
    // Only sync when timerValue changes and if it's not an ended auction
    if (timerValue !== undefined && !isAuctionEnded) {
      // Get previous timer value from ref
      const prevTimerValue = prevTimerValueRef.current;

      // Only update timer if there's a significant change
      // This could be:
      // 1. The difference is more than 2 seconds (to avoid regular countdown updates)
      // 2. The timer increased (bidder selection changed)
      // 3. The timer was reset to 0
      if (Math.abs(prevTimerValue - timerValue) > 2 ||
          timerValue > prevTimerValue ||
          timerValue === 0) {

        console.log("AuctionPopupRenderer: Syncing timer with parent", timerValue);
        setRemainingTime(timerValue);

        // Clear existing timer if any
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Start local countdown if time is greater than 0
        if (timerValue > 0) {
          timerRef.current = setInterval(() => {
            setRemainingTime(prev => {
              const newValue = Math.max(prev - 1, 0);
              return newValue;
            });
          }, 1000);
        }
      }

      // Update the ref with current value
      prevTimerValueRef.current = timerValue;
    }

    // Clean up timer on unmount or when auction ends
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerValue, isAuctionEnded]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    return seconds.toString().padStart(2, '0');
  };

  // Add an effect to listen for the custom auctionEnded event
  useEffect(() => {
    // Function to handle the auction ended event
    const handleAuctionEnded = (event: any) => {
      console.log("AuctionPopupRenderer: Received auctionEnded event", event.detail);

      // Make sure we have access to the popup document
      if (containerRef.current?.ownerDocument) {
        const popupDocument = containerRef.current.ownerDocument;
        const popupWindow = popupDocument.defaultView as Window;

        console.log("AuctionPopupRenderer: Reapplying styles to popup after auction ended event");

        // Force reapplication of styles
        stylesAppliedRef.current = false;

        // Directly inject styles again
        const styleTag = popupDocument.createElement('style');
        styleTag.textContent = globalStyles;
        popupDocument.head.appendChild(styleTag);

        // Add class to body for auction-ended state if not already present
        if (!popupDocument.body.classList.contains('auction-ended')) {
          popupDocument.body.classList.add('auction-ended');
        }

        // Set flag to indicate we've handled the auction end
        endHandledRef.current = true;

        // Update title to reflect auction ended state
        popupWindow.document.title = 'Kết Quả Đấu Giá';

        // Force a repaint of the content to ensure styles are applied
        const contentElement = popupDocument.querySelector('.auction-content');
        if (contentElement) {
          (contentElement as HTMLElement).style.opacity = '0.99';
          setTimeout(() => {
            if (contentElement) {
              (contentElement as HTMLElement).style.opacity = '1';
            }
          }, 50);
        }
      }
    };

    // Add the event listener
    window.addEventListener('auctionEnded', handleAuctionEnded);

    // Clean up on unmount
    return () => {
      window.removeEventListener('auctionEnded', handleAuctionEnded);
    };
  }, []);

  // Update the handleClose function to be more robust when auction ends
  const handleClose = () => {
    console.log("AuctionPopupRenderer: handleClose called, isAuctionEnded:", isAuctionEnded, "endHandledRef:", endHandledRef.current);

    // If the auction just ended and this is the first close event, ignore it
    if (isAuctionEnded && endHandledRef.current) {
      console.log("AuctionPopupRenderer: Ignoring close event because auction just ended");
      // Reset the flag so future close events work
      endHandledRef.current = false;
      return;
    }

    // Regular close behavior
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Render auction information content
  const renderAuctionContent = () => {
    return (
      <div className="unified-auction-content">
        {/* Auction details section - only visible when auction is active */}
        <div className={`auction-details ${isAuctionEnded ? 'hidden' : ''}`}>
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

        {/* Timer section - only visible when auction is active */}
        <div className={`timer-section ${isAuctionEnded ? 'hidden' : ''}`}>
          <div className="timer-label">
            Thời Gian Trả Còn Lại
          </div>
          <div className="timer-value">
            {formatTime(Math.floor(remainingTime))}
          </div>
        </div>

        {/* Results section - only visible when auction is ended */}
        <div className={`result-container ${!isAuctionEnded ? 'hidden' : ''}`}>
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
      </div>
    );
  };

  // Add a specific effect to handle changes to isAuctionEnded that forces a re-render
  useEffect(() => {
    console.log("AuctionPopupRenderer: isAuctionEnded changed to", isAuctionEnded);

    // If the auction has ended, force a content update
    if (isAuctionEnded && containerRef.current?.ownerDocument) {
      // Force any state updates that would cause a re-render
      setRemainingTime(0);

      const popupDocument = containerRef.current.ownerDocument;
      const popupWindow = popupDocument.defaultView as Window;

      // Ensure the document has the auction-ended class
      popupDocument.body.classList.add('auction-ended');

      // Force a re-render by slightly modifying a style and then restoring it
      const contentElement = popupDocument.querySelector('.auction-content');
      if (contentElement) {
        // Trigger a repaint by slightly modifying and restoring style
        contentElement.classList.add('auction-ended-transition');
        setTimeout(() => {
          contentElement?.classList.remove('auction-ended-transition');
        }, 50);
      }

      // Directly modify the document title
      popupWindow.document.title = 'Kết Quả Đấu Giá';
    }
  }, [isAuctionEnded]);

  // Also add a useEffect to ensure styles are updated when any important props change
  useEffect(() => {
    // Combine all key props that might affect styling into a dependency string
    const propsString = `${isAuctionEnded}-${highestBidderId}-${winnerId}-${finalPrice}-${totalBids}`;
    console.log("AuctionPopupRenderer: Key props changed:", propsString);

    // Only reapply styles if the popup container exists
    if (containerRef.current?.ownerDocument) {
      // Small delay to ensure the DOM has been updated with new content
      setTimeout(() => {
        // Apply the global styles again to ensure they're correctly attached
        const popupDocument = containerRef.current!.ownerDocument;

        // Check if we need to add global styles
        if (!stylesAppliedRef.current || isAuctionEnded) {
          console.log("AuctionPopupRenderer: Reapplying styles after props change");

          // Add a style tag with the global styles
          const styleTag = popupDocument.createElement('style');
          styleTag.textContent = globalStyles;
          popupDocument.head.appendChild(styleTag);

          // Mark styles as applied
          stylesAppliedRef.current = true;
        }
      }, 100);
    }
  }, [isAuctionEnded, highestBidderId, winnerId, finalPrice, totalBids]);

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
          center="parent"
          copyStyles={false} // Disable style copying to prevent security issues
        >
          <StyleSheetManager target={containerRef.current?.ownerDocument?.head || document.head}>
            <StyledContainer ref={containerRef}>
              <div className={`auction-container ${isAuctionEnded ? 'auction-ended-container' : ''}`}>
                <div className="company-header">
                  {companyName}
                </div>

                <div className={`auction-content ${isAuctionEnded ? 'auction-ended-content' : ''}`}>
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
