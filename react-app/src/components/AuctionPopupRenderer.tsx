import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import AuctionPopupPage from './AuctionPopupPage';

interface AuctionPopupRendererProps {
  auctioneer: string;
  startingPrice: string;
  bidStep: string;
  bidNumber: number;
  bidRound: string;
  highestBidder: string;
  companyName: string;
  auctionTitle: string;
  highestBidAmount: string;
  isAuctionEnded: boolean;
  onClose: () => void;
}

const AuctionPopupRenderer: React.FC<AuctionPopupRendererProps> = (props) => {
  useEffect(() => {
    // Create container div for React to render into
    const popupContainer = document.createElement('div');
    popupContainer.id = 'auction-popup-root';
    document.body.appendChild(popupContainer);

    // Apply some basic styles to the popup document
    const style = document.createElement('style');
    style.textContent = `
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
      }
      #auction-popup-root {
        height: 100vh;
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);

    // Set the document title
    document.title = 'Thông Tin Đấu Giá';

    // Render the popup content
    ReactDOM.render(
      <AuctionPopupPage {...props} />,
      popupContainer
    );

    // Clean up when component unmounts
    return () => {
      ReactDOM.unmountComponentAtNode(popupContainer);
      if (document.body.contains(popupContainer)) {
        document.body.removeChild(popupContainer);
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [props]);

  // This component doesn't render anything in the parent window
  return null;
};

export default AuctionPopupRenderer;
