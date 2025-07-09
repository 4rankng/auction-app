import React, { useEffect, useRef, useState } from 'react';
import { StyleSheetManager } from 'styled-components';
import styled from 'styled-components';

interface SimpleBidDisplayProps {
  bidNumber: number;
  currentBidAmount: string;
}

// Define styled components for the simple bid display popup
const StyledContainer = styled.div`
  /* Base styles and fonts */
  font-family: 'Roboto', sans-serif;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #495057;
  overflow: hidden;

  /* Background styling for the entire popup */
  html, body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    background-color: #495057;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    font-family: 'Roboto', sans-serif;
  }

  /* Full height/width container */
  #root, & {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #495057;
  }

  .bid-row {
    width: 100%;
    height: 50vh;  /* Each row takes exactly half the screen height */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-bottom: 2px solid #6c757d;
    padding: 2vh;
    box-sizing: border-box;
  }

  .bid-row:last-child {
    border-bottom: none;
  }

  .bid-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .bid-label {
    font-size: calc(3vw + 1.5vh);  /* Smaller label text */
    font-weight: 700;
    color: #bdc3c7;
    margin-bottom: 1vh;
    line-height: 1.2;
  }

  .bid-value {
    font-size: calc(12vw + 8vh);  /* Keep numbers massive */
    font-weight: 900;
    color: #ffffff;
    line-height: 0.9;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 1vw;
  }

  .bid-number {
    /* Font size now handled by inline styles with JavaScript calculation */
    font-weight: 900;
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bid-currency {
    font-size: calc(3vw + 1.5vh);  /* Same size as label */
    font-weight: 700;
    color: #bdc3c7;
    margin-left: 0.5vw;
  }

  .bid-row:nth-child(2) .bid-value {
    color: #0275d8;  /* Second row (price) in blue */
  }

  /* Media queries removed - font sizes now handled by JavaScript */
`;

// Global styles for the popup
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@700;800;900&display=swap');

  /* Base styles and fonts */
  body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #495057;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  /* Flat design - no shadows */
  * {
    /* Pure flat design */
  }
`;

const SimpleBidDisplay: React.FC<SimpleBidDisplayProps> = ({ bidNumber, currentBidAmount }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Text measurement utility using canvas for accurate width calculation
  const measureTextWidth = (text: string, fontSize: number, fontFamily: string = 'Roboto', fontWeight: string = '900') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    return context.measureText(text).width;
  };

  // Calculate optimal font size to fit text within target width
  const calculateOptimalFontSize = (text: string, targetWidth: number, minSize: number = 20, maxSize: number = 300) => {
    let low = minSize;
    let high = maxSize;
    let optimalSize = minSize;

    // Binary search for optimal font size
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const textWidth = measureTextWidth(text, mid);

      if (textWidth <= targetWidth) {
        optimalSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return optimalSize;
  };

  // Helper function to separate number from currency
  const parseAmount = (amount: string) => {
    if (!amount || amount === "- VND") {
      return { number: "-", currency: "VND" };
    }

    // Check if amount contains VND
    if (amount.includes("VND")) {
      const number = amount.replace("VND", "").trim();
      return { number, currency: "VND" };
    }

    // If no VND, return as is
    return { number: amount, currency: "" };
  };

  // Get container width for font size calculation
  const getContainerWidth = () => {
    if (containerRef.current) {
      const bidRow = containerRef.current.querySelector('.bid-row');
      if (bidRow) {
        // Use 85% of row width as target to ensure text fits comfortably with padding
        return bidRow.clientWidth * 0.85;
      }
    }
    // Fallback to window width if container not available
    return windowSize.width * 0.85;
  };

  // Dynamic font size calculation using actual text measurement
  const getDynamicFontSize = (numberStr: string) => {
    const targetWidth = getContainerWidth();

    // Calculate optimal font size based on actual text width
    const optimalSize = calculateOptimalFontSize(numberStr, targetWidth, 20, 300);

    // Apply height constraints to ensure text doesn't get too tall
    const maxHeightBasedSize = windowSize.height * 0.35; // Max 35% of window height

    return Math.min(optimalSize, maxHeightBasedSize);
  };


  // Handle window resize and container resize to ensure responsive scaling
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // Use ResizeObserver to detect container size changes
    let resizeObserver: ResizeObserver | null = null;

    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Additional effect to set up ResizeObserver when containerRef becomes available
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef.current]);

  // Enhanced font and style loading with delay to ensure DOM is ready
  useEffect(() => {
    const styleTimer = setTimeout(() => {
      if (containerRef.current && containerRef.current.ownerDocument) {
        const popupDocument = containerRef.current.ownerDocument;

        // Check if the font link is already in the document
        const existingLink = popupDocument.querySelector('link[href*="fonts.googleapis.com"]');

        if (!existingLink) {
          // Create and append the font link
          const fontLink = popupDocument.createElement('link');
          fontLink.rel = 'stylesheet';
          fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@700;800;900&display=swap';
          fontLink.crossOrigin = 'anonymous';

          popupDocument.head.appendChild(fontLink);
        }

        // Always add global styles directly to ensure basic styling works
        const styleTag = popupDocument.createElement('style');
        styleTag.textContent = globalStyles;
        popupDocument.head.appendChild(styleTag);
      }
    }, 200);

    return () => {
      clearTimeout(styleTimer);
    };
  }, []);

  const { number: priceNumber, currency } = parseAmount(currentBidAmount || "- VND");
  const bidNumberStr = bidNumber === 0 ? "-" : bidNumber.toString();

  // Calculate dynamic font sizes for both numbers
  const bidNumberFontSize = getDynamicFontSize(bidNumberStr);
  const priceNumberFontSize = getDynamicFontSize(priceNumber);

  return (
    <StyleSheetManager target={containerRef.current?.ownerDocument?.head || document.head}>
      <StyledContainer ref={containerRef}>
        <div className="bid-row">
          <div className="bid-content">
            <div className="bid-label">Lượt trả giá thứ</div>
            <div className="bid-value">
              <span
                className="bid-number"
                style={{
                  fontSize: `${bidNumberFontSize}px`,
                  fontWeight: 900,
                  maxWidth: '95%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#ffffff'
                }}
              >
                {bidNumberStr}
              </span>
            </div>
          </div>
        </div>

        <div className="bid-row">
          <div className="bid-content">
            <div className="bid-label">Giá trả</div>
            <div className="bid-value">
              <span
                className="bid-number"
                style={{
                  fontSize: `${priceNumberFontSize}px`,
                  fontWeight: 900,
                  maxWidth: '95%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#ffffff'
                }}
              >
                {priceNumber}
              </span>
              {currency && <span className="bid-currency">{currency}</span>}
            </div>
          </div>
        </div>
      </StyledContainer>
    </StyleSheetManager>
  );
};

export default SimpleBidDisplay;
