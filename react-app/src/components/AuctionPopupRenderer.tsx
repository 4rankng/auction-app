import React, { useEffect, useRef, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import NewWindow from 'react-new-window';
import styled from 'styled-components';

interface AuctionPopupRendererProps {
  auctioneer: string;
  startingPrice: string;
  bidStep: string;
  bidNumber: number;
  highestBidderId?: string;
  selectedBidderId?: string;
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
    background-color: #ffffff;
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
    background-color: #404040;
  }

  /* Auction container */
  .auction-container {
    max-width: 750px;
    min-width: 750px;
    width: 100%;
    border-radius: 8px;
    box-shadow: none;
    border: none;
    background-color: #ffffff;
    overflow: hidden;
    margin: 0 auto;
  }

  /* Company header */
  .company-header {
    background-color: #0080ff;
    color: white;
    padding: 15px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    border-radius: 8px 8px 0 0;
  }

  /* Auction title section */
  .auction-title-section {
    background-color: #f8f9fa;
    padding: 10px 15px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
  }

  .main-title {
    font-size: 18px;
    color: #0275d8;
    font-weight: 600;
  }

  /* Update auctioneer column alignment */
  .auctioneer-column {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .auctioneer-label {
    font-size: 14px;
    color: #6c757d;
    font-weight: 500;
    text-align: center;
  }

  .auctioneer-name {
    font-size: 16px;
    color: #6c757d;
    font-weight: 600;
    text-align: center;
  }

  /* Highest bid section */
  .highest-bid-section {
    background-color: #ffd6d9;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid #e9ecef;
  }

  .highest-bidder-column {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .highest-bidder-label {
    font-size: 16px;
    color: #721c24;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .highest-bidder-value {
    font-size: 24px;
    color: #212529;
    font-weight: 700;
  }

  .highest-bid-column {
    text-align: center;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .highest-bid-label {
    font-size: 16px;
    color: #721c24;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .highest-bid-amount {
    font-size: 24px;
    color: #dc3545;
    font-weight: 700;
  }

  /* Info sections with simple labeled rows */
  .info-row {
    display: flex;
    padding: 12px 20px;
    border-bottom: 1px solid #e9ecef;
  }

  .info-item {
    display: flex;
    flex: 1;
  }

  .info-label {
    font-size: 16px;
    color: #212529;
    font-weight: 500;
    margin-right: 8px;
  }

  .info-value {
    font-size: 16px;
    color: #212529;
    font-weight: 500;
  }

  /* Timer section */
  .timer-section {
    padding: 15px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .timer-label {
    font-size: 18px;
    color: #212529;
    font-weight: 600;
    margin-bottom: 15px;
    text-align: center;
  }

  .timer-value {
    background-color: #dc3545;
    color: white;
    font-size: 30px;
    font-weight: bold;
    padding: 10px 35px;
    border-radius: 5px;
    min-width: 120px;
    text-align: center;
  }

  /* Results styles */
  .result-container {
    background-color: #ffffff;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
    margin: 0;
    box-shadow: none;
    border-radius: 0 0 8px 8px;
    min-height: 380px;
  }

  .result-header {
    font-size: 22px;
    font-weight: bold;
    color: #28a745;
    margin: 20px 0;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
    border-radius: 8px;
  }

  .winner-section {
    margin: 10px 0 20px 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: none;
    width: 90%;
  }

  .winner-label {
    font-size: 18px;
    color: #212529;
    margin-bottom: 10px;
    text-align: center;
  }

  .winner-name {
    font-size: 18px;
    font-weight: 500;
    color: #0275d8;
    margin-bottom: 15px;
    text-align: center;
  }

  .price-label {
    font-size: 18px;
    color: #212529;
    margin-bottom: 10px;
    text-align: center;
  }

  .final-price {
    font-size: 22px;
    font-weight: bold;
    color: #28a745;
    margin-bottom: 15px;
    text-align: center;
  }

  .auction-stats {
    display: flex;
    justify-content: space-between;
    gap: 2px;
    width: 90%;
  }

  .stat-item {
    background-color: #fff;
    padding: 15px;
    border-radius: 8px;
    box-shadow: none;
    flex: 1;
    margin: 0;
  }

  .stat-label {
    font-size: 16px;
    color: #212529;
    margin-bottom: 8px;
    text-align: center;
  }

  .stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #0275d8;
    text-align: center;
  }

  /* Hide elements when auction is ended */
  .hidden {
    display: none;
  }

  /* Ensure bidding view has consistent height */
  .auction-details {
    display: flex;
    flex-direction: column;
    min-height: 380px;
  }

  /* Responsive adjustments */
  @media (max-width: 500px) {
    .auction-container {
      max-width: 95%;
    }

    .highest-bid-section {
      flex-direction: column;
      gap: 10px;
    }

    .info-row {
      flex-direction: column;
      gap: 10px;
    }

    .info-item {
      margin-bottom: 8px;
    }
  }
`;

// Define a string with global styles to ensure they get applied correctly
const globalStyles = `
  /* Base styles and fonts */
  body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #000000;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  /* Styling for the auction ended state */
  body.auction-ended .result-container {
    background-color: #ffffff;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
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
    background-color: #ffffff;
  }

  /* Ensure result container has proper styling */
  .result-container {
    background-color: #ffffff;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
  }

  .result-header {
    font-size: 22px;
    font-weight: bold;
    color: #28a745;
    margin: 20px 0;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
  }

  .winner-section {
    margin: 10px 0 20px 0;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: none;
    width: 90%;
  }

  .winner-label {
    font-size: 18px;
    color: #212529;
    margin-bottom: 10px;
    text-align: center;
  }

  .winner-name {
    font-size: 18px;
    font-weight: 500;
    color: #0275d8;
    margin-bottom: 15px;
    text-align: center;
  }

  .price-label {
    font-size: 18px;
    color: #212529;
    margin-bottom: 10px;
    text-align: center;
  }

  .final-price {
    font-size: 22px;
    font-weight: bold;
    color: #28a745;
    margin-bottom: 5px;
    text-align: center;
  }

  .auction-stats {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    width: 90%;
  }

  .stat-item {
    background-color: #fff;
    padding: 15px;
    border-radius: 8px;
    box-shadow: none;
    flex: 1;
    width: 100%;
  }

  .stat-label {
    font-size: 16px;
    color: #212529;
    margin-bottom: 8px;
    text-align: center;
  }

  .stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #0275d8;
    text-align: center;
  }

  /* Company header - updated to match screenshot */
  .company-header {
    background-color: #0080ff;
    color: white;
    padding: 15px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
  }

  /* Auction title section - updated to match screenshot */
  .auction-title-section {
    background-color: #f8f9fa;
    padding: 10px 15px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .subtitle {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
  }

  .main-title {
    font-size: 18px;
    color: #0275d8;
    font-weight: 600;
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

  /* Reset some container styles to match screenshot */
  .auction-container {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }
`;

const AuctionPopupRenderer: React.FC<AuctionPopupRendererProps> = (props) => {
  const {
    companyName,
    auctioneer,
    startingPrice,
    bidStep,
    bidNumber,
    highestBidderId,
    selectedBidderId,
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
  // Add ref to track previous timer value to detect real changes
  const prevTimerValueRef = useRef<number>(timerValue || 0);

  // Track the previous auction end state to detect changes
  const prevEndedStateRef = useRef<boolean>(isAuctionEnded);

  // Add a ref to track if styles have been applied
  const stylesAppliedRef = useRef<boolean>(false);

  // Add a ref to track if we've handled auction end
  const endHandledRef = useRef<boolean>(false);

  // Simplified timer handling - only reset when timerValue actually changes
  useEffect(() => {
    // For ended auctions, ensure timer is stopped and shows 0
    if (isAuctionEnded) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      setRemainingTime(0);
      return;
    }

    // Check if timerValue has changed - this is the key optimization
    if (timerValue !== undefined && timerValue !== prevTimerValueRef.current) {
      console.log("AuctionPopupRenderer: New timer value received:", timerValue);

      // Update the state and ref with new value
      setRemainingTime(timerValue);
      prevTimerValueRef.current = timerValue;

      // Clear existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }

      // Start a new countdown if value is > 0
      if (timerValue > 0) {
        console.log("AuctionPopupRenderer: Starting new countdown");
        timerRef.current = setInterval(() => {
          setRemainingTime(prev => {
            const newValue = Math.max(0, prev - 1);
            if (newValue === 0 && timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = undefined;
            }
            return newValue;
          });
        }, 1000);
      }
    }

    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [timerValue, isAuctionEnded]);

  // Remove the timer subscription which is causing conflicts
  useEffect(() => {
    // This effect should only run once when the component mounts
    console.log("AuctionPopupRenderer: Component mounted");

    // Set a flag to track that we're rendering a popup to prevent duplicates
    popupCreatedRef.current = true;

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

      // Clear any running timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }

      window.removeEventListener('resize', handleResize);
      // Reset the flag
      popupCreatedRef.current = false;
    };
  }, []);

  // Format time for display (show minutes:seconds format)
  const formatTime = (seconds: number): string => {
    // Format as MM:SS
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            height: 550,
            left: 100,
            top: 100,
            resizable: false
          }}
          onUnload={handleClose}
          onBlock={() => console.log("Popup was blocked!")}
          name="auction_display"
          center="parent"
          copyStyles={false}
        >
          <StyleSheetManager target={containerRef.current?.ownerDocument?.head || document.head}>
            <StyledContainer ref={containerRef}>
              <div className={`auction-container ${isAuctionEnded ? 'auction-ended-container' : ''}`}>
                <div className="company-header">
                  {companyName || "Công Ty Đấu Giá HP.AUSERCO"}
                </div>

                <div className="auction-title-section">
                  <div className="title-column">
                    <div className="subtitle">Phiên Đấu Giá Tài Sản</div>
                    <div className="main-title">{auctionTitle || "Tài Sản XYZ"}</div>
                  </div>
                  <div className="auctioneer-column">
                    <div className="auctioneer-label">Đấu Giá Viên</div>
                    <div className="auctioneer-name">{auctioneer || "-"}</div>
                  </div>
                </div>

                {/* Results section - updated to match screenshot */}
                {isAuctionEnded ? (
                  <div className="result-container">
                    <div className="result-header">Đấu Giá Kết Thúc</div>

                    <div className="winner-section">
                      <div className="winner-label">Người Trả Giá Cao Nhất</div>
                      <div className="winner-name">
                        {winnerId || highestBidderId || "Không có ID"}
                      </div>

                      <div className="price-label">Giá Trả Cao Nhất</div>
                      <div className="final-price">{finalPrice || highestBidAmount || "1.000.000.000 VND"}</div>
                    </div>

                    <div className="auction-stats">
                      <div className="stat-item">
                        <div className="stat-label">Tổng Số Lượt Đấu Giá</div>
                        <div className="stat-value">{totalBids || bidNumber || "0"}</div>
                      </div>

                      <div className="stat-item">
                        <div className="stat-label">Thời Gian Diễn Ra</div>
                        <div className="stat-value">{auctionDuration || "00:00:10"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="auction-details">
                    {/* Highest bidder and highest bid section */}
                    <div className="highest-bid-section">
                      <div className="highest-bidder-column">
                        <div className="highest-bidder-label">Người Trả Cao Nhất</div>
                        <div className="highest-bidder-value">
                          {highestBidderId || "2"}
                        </div>
                      </div>
                      <div className="highest-bid-column">
                        <div className="highest-bid-label">Giá Trả Cao Nhất</div>
                        <div className="highest-bid-amount">{highestBidAmount || "1.030.000.000 VND"}</div>
                      </div>
                    </div>

                    {/* Starting price and bid step */}
                    <div className="info-row">
                      <div className="info-item">
                        <div className="info-label">Giá Khởi Điểm:</div>
                        <div className="info-value">{startingPrice || "1.000.000.000 VND"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Bước Giá:</div>
                        <div className="info-value">{bidStep || "10.000.000 VND"}</div>
                      </div>
                    </div>

                    {/* Bidder info and bid count */}
                    <div className="info-row">
                      <div className="info-item">
                        <div className="info-label">Người Trả Giá:</div>
                        <div className="info-value">{selectedBidderId || "4"}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Lượt Trả Giá:</div>
                        <div className="info-value">{bidNumber || "4"}</div>
                      </div>
                    </div>

                    {/* Timer section */}
                    <div className="timer-section">
                      <div className="timer-label">
                        Thời Gian Trả Còn Lại
                      </div>
                      <div className="timer-value">
                        {formatTime(Math.floor(remainingTime)) || "00:00"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </StyledContainer>
          </StyleSheetManager>
        </NewWindow>
      )}
    </>
  );
};

export default AuctionPopupRenderer;
