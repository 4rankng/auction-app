import React, { useEffect, useRef, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import NewWindow from 'react-new-window';
import logger from '../services/loggerService';
import styled from 'styled-components';
import CompanyBanner from './CompanyBanner';

interface AuctionPopupRendererProps {
  auctioneer: string;
  startingPrice: string;
  bidStep: string;
  bidNumber: number;
  highestBidderId?: string;
  bidders: Array<{
    id: string;
    name: string;
  }>;

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
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  /* Background styling for the entire popup */
  html, body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    background-color: #f8f9fa;
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
    background-color: #f8f9fa;
  }

  /* Auction container */
  .auction-container {
    width: 100%;
    max-width: 100%;
    min-height: 100vh;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
    border: none;
    background-color: #f8f9fa;
    overflow: auto;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  /* Company header */
  .company-header {
    width: 100%;
    background-color: #0080ff;
    color: white;
    padding: 2.5vh;
    font-size: calc(24px + 1vmin);
    font-weight: bold;
    text-align: center;
    border-radius: 0;
  }

  /* Auction title section */
  .auction-title-section {
    width: 100%;
    padding: 2.5vh 20px;
    margin: 0;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  /* Main title */
  .main-title {
    font-size: calc(28px + 1vmin);
    font-weight: 700;
    margin: 1.5vh 0;
    color: #0275d8;
  }

  .subtitle {
    font-size: calc(18px + 0.5vmin);
    color: #6c757d;
    margin-bottom: 1vh;
    font-weight: 500;
  }

  /* Auction auctioneer */
  .auction-auctioneer {
    font-size: calc(18px + 0.5vmin);
    margin-top: 1vh;
    color: #6c757d;
  }

  .auctioneer-label {
    font-weight: 600;
    margin-right: 0.8rem;
  }

  /* Info rows */
  .info-row {
    width: 100%;
    padding: 2vh 20px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: center;
    gap: 5vw;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .info-label {
    font-size: calc(18px + 0.5vmin);
    color: #212529;
    font-weight: 500;
    margin-bottom: 0.5vh;
  }

  .info-value {
    font-size: calc(20px + 0.5vmin);
    color: #212529;
    font-weight: 600;
  }

  /* Bid anchor section - the prominent display */
  .bid-anchor-section {
    width: 100%;
    padding: 4vh 20px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: center;
    gap: 8vw;
  }
  
  .anchor-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .anchor-label {
    font-size: calc(40px + 1.5vmin);
    font-weight: 800;
    color: #212529;
    margin-bottom: 1vh;
  }
  
  .anchor-value {
    font-size: calc(42px + 1.8vmin);
    font-weight: 800;
    color: #0275d8;
  }

  /* Highest bid section */
  .highest-bid-section {
    width: 100%;
    padding: 3vh 20px;
    background-color: #ffd6d9;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }

  .highest-bidder-column,
  .highest-bid-column {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .highest-bidder-label,
  .highest-bid-label {
    font-size: calc(18px + 0.5vmin);
    color: #721c24;
    font-weight: 600;
    margin-bottom: 1vh;
  }

  .highest-bidder-value {
    font-size: calc(24px + 0.8vmin);
    color: #212529;
    font-weight: 700;
  }

  .highest-bid-amount {
    font-size: calc(24px + 0.8vmin);
    color: #dc3545;
    font-weight: 700;
  }

  /* Timer section */
  .timer-section {
    width: 100%;
    padding: 3vh 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f8f8f8;
    flex-grow: 1;
    margin-top: auto;
    margin-bottom: 0;
  }

  .timer-label {
    font-size: calc(20px + 0.6vmin);
    color: #212529;
    font-weight: 600;
    margin-bottom: 2vh;
    text-align: center;
  }

  .timer-value {
    background-color: #dc3545;
    color: white;
    font-size: calc(32px + 1.2vmin);
    font-weight: bold;
    padding: 2vh 4vw;
    border-radius: 8px;
    min-width: 180px;
    text-align: center;
  }

  /* Result container styles */
  .result-container {
    width: 100%;
    background-color: #f8f9fa;
    padding: 3vh 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex: 1;
  }

  .result-header {
    font-size: calc(24px + 1vmin);
    font-weight: bold;
    color: #28a745;
    margin: 2vh 0;
    text-transform: uppercase;
    text-align: center;
    width: 100%;
  }

  /* Winner section */
  .winner-section {
    margin: 2vh 0 3vh 0;
    background-color: #f8f9fa;
    padding: 3vh 20px;
    border-radius: 8px;
    box-shadow: none;
    width: 90%;
    max-width: 800px;
  }

  .winner-label, .price-label {
    font-size: calc(18px + 0.6vmin);
    color: #212529;
    margin-bottom: 1vh;
    text-align: center;
  }

  .winner-name {
    font-size: calc(22px + 0.8vmin);
    font-weight: 500;
    color: #0275d8;
    margin-bottom: 2vh;
    text-align: center;
  }

  .final-price {
    font-size: calc(24px + 1vmin);
    font-weight: bold;
    color: #28a745;
    margin-bottom: 2vh;
    text-align: center;
  }

  /* Auction stats */
  .auction-stats {
    display: flex;
    justify-content: space-between;
    gap: 3vw;
    width: 90%;
    max-width: 800px;
  }

  .stat-item {
    background-color: #f0f0f0;
    padding: 2vh 15px;
    border-radius: 8px;
    box-shadow: none;
    flex: 1;
  }

  .stat-label {
    font-size: calc(16px + 0.5vmin);
    color: #212529;
    margin-bottom: 1vh;
    text-align: center;
  }

  .stat-value {
    font-size: calc(20px + 0.8vmin);
    font-weight: bold;
    color: #0275d8;
    text-align: center;
  }

  /* Responsive adjustments */
  @media (min-width: 1200px) {
    .auction-container {
      max-width: 100%;
    }

    .main-title {
      font-size: calc(32px + 1vmin);
    }

    .timer-value {
      font-size: calc(36px + 1.2vmin);
      padding: 2.5vh 5vw;
    }

    .winner-section,
    .auction-stats {
      max-width: 80%;
    }
  }

  @media (min-width: 1600px) {
    .winner-section,
    .auction-stats {
      max-width: 70%;
    }

    .anchor-label {
      font-size: calc(44px + 1.8vmin);
    }
    
    .anchor-value {
      font-size: calc(46px + 2vmin);
    }
  }

  @media (min-width: 2400px) {
    .anchor-label {
      font-size: calc(48px + 2vmin);
    }
    
    .anchor-value {
      font-size: calc(50px + 2.2vmin);
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
    background-color: #f8f9fa;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Flat design - no shadows */
  * {
    /* Pure flat design */
  }

  /* Improved scaling for different screen sizes */
  @media (min-width: 1600px) {
    body {
      font-size: 120%;
    }
  }

  @media (min-width: 2400px) {
    body {
      font-size: 140%;
    }
  }

  /* Styling for the auction ended state */
  body.auction-ended .result-container {
    background-color: #f8f9fa;
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
    background-color: #f8f9fa;
  }

  /* Add auctioneer styles */
  .auction-auctioneer {
    margin-top: 0.3rem;
    padding-left: 4px;
    font-size: 0.95rem;
    color: #6c757d;
  }

  .auctioneer-label {
    font-weight: 600;
    margin-right: 0.5rem;
  }

  .auctioneer-name {
    font-weight: 500;
  }

  /* Ensure result container has proper styling */
  .result-container {
    background-color: #f8f9fa;
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
    background-color: #f8f9fa;
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
    background-color: #f0f0f0;
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

  .bid-number {
    font-size: calc(28px + 1vmin);
    font-weight: 700;
  }

  .stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #0275d8;
    text-align: center;
  }

  /* Company header - override CompanyBanner styles for the popup */
  .company-header.company-banner {
    background-color: #0080ff;
    color: white;
    padding: 15px;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    width: 100%;
    border-radius: 8px 8px 0 0;
  }

  /* Auction title section - updated to match AuctionHeader */
  .auction-title-section {
    background-color: #f8f9fa;
    padding: 15px 20px;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .subtitle {
    font-size: 16px;
    color: #6c757d;
    margin-bottom: 10px;
    font-weight: 500;
  }

  .main-title {
    font-size: 20px;
    color: #0275d8;
    font-weight: 600;
    margin-bottom: 10px;
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
    bidders,

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
  // Add a ref to track if we've already created a popup window
  const popupCreatedRef = useRef<boolean>(false);

  // Track the previous auction end state to detect changes
  const prevEndedStateRef = useRef<boolean>(isAuctionEnded);

  // Add a ref to track if styles have been applied
  const stylesAppliedRef = useRef<boolean>(false);

  // Add a ref to track if we've handled auction end
  const endHandledRef = useRef<boolean>(false);

  // Effect to maximize the window when loaded
  useEffect(() => {
    // Function to ensure the popup window is maximized
    const maximizePopupWindow = () => {
      try {
        if (typeof window !== 'undefined' && window.opener) {
          // We are in the popup window
          window.moveTo(0, 0);
          window.resizeTo(
            window.screen.availWidth,
            window.screen.availHeight
          );

          // Wait a moment, then try one more time to ensure it's maximized
          setTimeout(() => {
            window.moveTo(0, 0);
            window.resizeTo(
              window.screen.availWidth,
              window.screen.availHeight
            );

            // Try to request fullscreen mode
            const docEl = document.documentElement;
            if (docEl.requestFullscreen) {
              docEl.requestFullscreen().catch(err => {
                logger.warn("Could not enter fullscreen mode:", err);
              });
            }

            logger.info("Maximized popup window dimensions");
          }, 500);
        }
      } catch (error) {
        logger.error("Error maximizing popup window:", error);
      }
    };

    // Call the function after a slight delay to ensure the window is already created
    setTimeout(maximizePopupWindow, 300);

    // Also set up a resize handler to ensure content looks good after resize
    const handleResize = () => {
      if (containerRef.current) {
        // Force reflow by actually using the height value
        const height = containerRef.current.offsetHeight;
        containerRef.current.style.height = `${height}px`;
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.height = '';
          }
        }, 10);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  // Remove the timer subscription which is causing conflicts
  useEffect(() => {
    // This effect should only run once when the component mounts
    logger.info("AuctionPopupRenderer: Component mounted");

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
      logger.info("AuctionPopupRenderer: Component unmounting, cleanup");

      // Remove timer cleanup since we're not using an internal timer anymore
      // if (timerRef.current) {
      //   clearInterval(timerRef.current);
      //   timerRef.current = undefined;
      // }

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

        logger.info("AuctionPopupRenderer: Applying styles to popup");

        // Check if the font link is already in the document
        const existingLink = popupDocument.querySelector('link[href*="fonts.googleapis.com"]');

        if (!existingLink) {
          // Create and append the font link
          const fontLink = popupDocument.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
          fontLink.crossOrigin = 'anonymous';

          popupDocument.head.appendChild(fontLink);
          logger.info("AuctionPopupRenderer: Font link added to popup window");
        }

        // Always add global styles directly to ensure basic styling works
        const styleTag = popupDocument.createElement('style');
        styleTag.textContent = globalStyles;
        popupDocument.head.appendChild(styleTag);
        logger.info("AuctionPopupRenderer: Global styles added to popup window");

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
        logger.info("AuctionPopupRenderer: Auction end state changed to", isAuctionEnded);
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
          logger.info("AuctionPopupRenderer: Global styles reapplied after auction end");

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
                ? '🏆 TRẢ GIÁ ĐÃ KẾT THÚC 🏆'
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
      logger.info("AuctionPopupRenderer: Received auctionEnded event", event.detail);

      // Make sure we have access to the popup document
      if (containerRef.current?.ownerDocument) {
        const popupDocument = containerRef.current.ownerDocument;
        const popupWindow = popupDocument.defaultView as Window;

        logger.info("AuctionPopupRenderer: Reapplying styles to popup after auction ended event");

        // Force reapplication of styles
        stylesAppliedRef.current = false;

        // Create a unique ID for the style tag
        const styleId = 'auction-popup-global-styles';

        // Check if a style tag with this ID already exists
        let styleTag = popupDocument.getElementById(styleId) as HTMLStyleElement;

        // If style tag exists, update content instead of creating a new one
        if (styleTag) {
          styleTag.textContent = globalStyles;
        } else {
          // Create a new style tag
          styleTag = popupDocument.createElement('style');
          styleTag.id = styleId;
          styleTag.textContent = globalStyles;
          popupDocument.head.appendChild(styleTag);
        }

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
    logger.info("AuctionPopupRenderer: handleClose called, isAuctionEnded:", isAuctionEnded, "endHandledRef:", endHandledRef.current);

    // If the auction just ended and this is the first close event, ignore it
    if (isAuctionEnded && endHandledRef.current) {
      logger.info("AuctionPopupRenderer: Ignoring close event because auction just ended");
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
    logger.info("AuctionPopupRenderer: isAuctionEnded changed to", isAuctionEnded);

    // If the auction has ended, force a content update
    if (isAuctionEnded && containerRef.current?.ownerDocument) {
      // Force any state updates that would cause a re-render
      // setRemainingTime(0);

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
    logger.info("AuctionPopupRenderer: Key props changed:", propsString);

    // Only reapply styles if the popup container exists
    if (containerRef.current?.ownerDocument) {
      // Small delay to ensure the DOM has been updated with new content
      setTimeout(() => {
        // Apply the global styles again to ensure they're correctly attached
        const popupDocument = containerRef.current!.ownerDocument;

        // Check if we need to add global styles
        if (!stylesAppliedRef.current || isAuctionEnded) {
          logger.info("AuctionPopupRenderer: Reapplying styles after props change");

          // Create a unique ID for the style tag to avoid duplicates
          const styleId = 'auction-popup-global-styles';

          // Check if a style tag with this ID already exists
          let styleTag = popupDocument.getElementById(styleId) as HTMLStyleElement;

          // If style tag exists, update content instead of creating a new one
          if (styleTag) {
            styleTag.textContent = globalStyles;
          } else {
            // Create a new style tag
            styleTag = popupDocument.createElement('style');
            styleTag.id = styleId;
            styleTag.textContent = globalStyles;
            popupDocument.head.appendChild(styleTag);
          }

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
            width: window.screen.availWidth,
            height: window.screen.availHeight,
            left: 0,
            top: 0,
            resizable: true,
            scrollbars: false,
          }}
          onUnload={handleClose}
          onBlock={() => logger.info("Popup was blocked!")}
          name="auction_display"
          center="screen"
          copyStyles={false}
        >
          <StyleSheetManager target={containerRef.current?.ownerDocument?.head || document.head}>
            <StyledContainer ref={containerRef}>
              <div className={`auction-container ${isAuctionEnded ? 'auction-ended-container' : ''}`} style={{ width: '100%', maxWidth: '100%' }}>
                <CompanyBanner className="company-header" companyName={companyName} />

                <div className="auction-title-section">
                  <div className="title-column">
                  <div className="subtitle" style={{ textAlign: 'center', width: '100%' }}>Phiên đấu giá</div>
                    <div className="main-title" style={{ textAlign: 'center', width: '100%' }}>{auctionTitle || "-"}</div>
                    <div className="auction-auctioneer" style={{ textAlign: 'center', width: '100%' }}>
                      <span className="auctioneer-label">Đấu giá viên:</span>
                      <span className="auctioneer-name">{auctioneer || "-"}</span>
                    </div>
                  </div>
                </div>
   {/* Starting price and bid step */}
   <div className="info-row">
   <div className="info-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
  <div className="info-label">Giá Khởi Điểm:</div>
  <div className="info-value">{startingPrice || ""}</div>
</div>
<div className="info-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div className="info-label">Bước Giá:</div>
                        <div className="info-value">{bidStep || ""}</div>
                      </div>
                    </div>

                    <div
  className="info-item"
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%', // Ensures it occupies the full row
  }}
>

</div>


                {isAuctionEnded ? (
                  <div className="result-container">
                    <div className="result-header">Đấu Giá Kết Thúc</div>

                    <div className="winner-section">
                      <div className="winner-label">Người Trả Giá Cao Nhất</div>
                      <div className="winner-name">
                        {winnerId ? `${winnerId} - ${bidders?.find(b => b.id === winnerId)?.name || 'Không có'}` : "Không có"}
                      </div>

                      <div className="price-label">Giá Trả Cao Nhất</div>
                      <div className="final-price">{finalPrice || highestBidAmount || "- VND"}</div>
                    </div>

                    <div className="auction-stats">
                      <div className="stat-item">
                        <div className="stat-label">Tổng Số Lượt Trả Giá</div>
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
                    {/* Prominent bid anchor section */}
                    <div className="bid-anchor-section">
                      <div className="anchor-item">
                        <div className="anchor-label">Lượt trả giá thứ:</div>
                        <div className="anchor-value">{bidNumber === 0 ? "-" : bidNumber}</div>
                      </div>
                      <div className="anchor-item">
                        <div className="anchor-label">Giá trả:</div>
                        <div className="anchor-value">{highestBidAmount || "- VND"}</div>
                      </div>
                    </div>
                    <div className="highest-bid-section">
                      <div className="highest-bidder-column">
                        <div className="highest-bidder-label">Người Trả Cao Nhất</div>
                        <div className="highest-bidder-value">
                          {highestBidderId ? `${highestBidderId} - ${bidders?.find(b => b.id === highestBidderId)?.name || ''}` : "-"}
                        </div>
                      </div>
                      <div className="highest-bid-column">
                        <div className="highest-bid-label">Giá Trả Cao Nhất</div>
                        <div className="highest-bid-amount">{highestBidAmount || "- VND"}</div>
                      </div>
                    </div>





                    {/* Timer section */}
                    <div className="timer-section">
                      <div className="timer-label">
                        Thời Gian Trả Còn Lại
                      </div>
                      <div className="timer-value">
                        {formatTime(Math.floor(isAuctionEnded ? 0 : (timerValue || 0))) || "00:00"}
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
