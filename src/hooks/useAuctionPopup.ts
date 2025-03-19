import { useState, useEffect, useCallback, useRef } from 'react';
import * as popupService from '@services/popupService';

// HTML content for the popup window
const createPopupHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông Tin Đấu Giá</title>
  <link rel="stylesheet" href="${window.location.origin}/index.css">
</head>
<body>
  <div id="auction-popup-root"></div>
  <script>
    // Make parent window variables accessible
    window.parentWindow = window.opener;
  </script>
</body>
</html>
`;

interface UseAuctionPopupOptions {
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Hook for managing auction popup windows
 */
export const useAuctionPopup = (options: UseAuctionPopupOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  // Use a ref to track the lastOperation to prevent loops
  const lastOperationRef = useRef<'open' | 'close' | null>(null);

  // Clean up on unmount only - we won't automatically close on dependency changes
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };

  }, [popupWindow]); // Add popupWindow to dependency array

  // Open the popup
  const openPopup = useCallback(() => {
    // Check if we already have an open popup to prevent loops
    if (isOpen && popupWindow && !popupWindow.closed) {
      console.log("Popup already open, reusing existing window");
      return popupWindow;
    }

    console.log("Opening new popup window");
    lastOperationRef.current = 'open';

    // We're using a blank popup that we'll fill with our content
    const popup = popupService.openPopup('about:blank', 'auction_display', {
      width: 750,
      height: 600,
      resizable: true,
      preventAutoClose: true
    });

    if (popup) {
      // Write custom HTML to the popup
      popup.document.open();
      popup.document.write(createPopupHtml());
      popup.document.close();

      // Update state only after popup is fully initialized
      setPopupWindow(popup);
      setIsOpen(true);

      if (options.onOpen) {
        options.onOpen();
      }
    }

    return popup;

  }, [isOpen, popupWindow, options]); // Add options to dependencies

  // Close the popup
  const closePopup = useCallback(() => {
    // Prevent closing if we just opened (potential loop)
    if (lastOperationRef.current === 'open') {
      console.log("Skipping close as popup was just opened");
      return;
    }

    console.log("Closing popup window");
    lastOperationRef.current = 'close';

    if (popupWindow && !popupWindow.closed) {
      popupWindow.close();
    }

    setIsOpen(false);
    setPopupWindow(null);

    if (options.onClose) {
      options.onClose();
    }
  }, [popupWindow, options]); // Include options in dependencies

  return {
    isOpen,
    popupWindow,
    openPopup,
    closePopup
  };
};

export default useAuctionPopup;
