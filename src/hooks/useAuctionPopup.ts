import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../services/loggerService';
import * as popupService from '@services/popupService';

// HTML content for the popup window
const createPopupHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Thông Tin Đấu Giá</title>
  <link rel="stylesheet" href="${window.location.origin}/index.css">
  <style>
    html, body {
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #404040;
    }
    #auction-popup-root {
      height: 100vh;
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    #auction-popup-root > div {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div id="auction-popup-root"></div>
  <script>
    // Make parent window variables accessible
    window.parentWindow = window.opener;

    // Maximize window when loaded
    window.addEventListener('load', function() {
      try {
        window.moveTo(0, 0);
        window.resizeTo(
          window.screen.availWidth,
          window.screen.availHeight
        );
        console.log("Window maximized on load");

        // Request fullscreen if supported
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(err => {
            console.log("Could not enter fullscreen mode:", err);
          });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          docEl.msRequestFullscreen();
        }
      } catch(e) {
        console.error("Error maximizing window:", e);
      }
    });
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

  // Add a ref to track popup creation time to prevent immediate closing
  const popupCreationTimeRef = useRef<number>(0);

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
    // More reliable check for existing popup
    if (popupWindow) {
      // If window exists but is closed, we need a new one
      const isClosed = popupWindow.closed;

      if (!isClosed) {
        logger.info("Popup already open, focusing existing window");
        try {
          // Focus the window to bring it to front
          popupWindow.focus();
          return popupWindow;
        } catch (e) {
          logger.info("Error focusing existing popup, will create new one:", e);
          // Continue to create a new popup if focusing fails
        }
      } else {
        logger.info("Existing popup reference found but window is closed, creating new one");
      }
    }

    logger.info("Opening new popup window");
    lastOperationRef.current = 'open';
    // Track creation time to prevent immediate closing
    popupCreationTimeRef.current = Date.now();

    // We're using a blank popup that we'll fill with our content
    const popup = popupService.openPopup('about:blank', 'auction_display', {
      width: window.screen.availWidth,
      height: window.screen.availHeight,
      resizable: true,
      preventAutoClose: true,
      left: 0,
      top: 0,
      fullscreen: true,
      scrollbars: true
    });

    if (popup) {
      // Write custom HTML to the popup
      popup.document.open();
      popup.document.write(createPopupHtml());
      popup.document.close();

      // Update state only after popup is fully initialized
      setPopupWindow(popup);
      setIsOpen(true);

      // Add an onbeforeunload event to detect when the popup is closed
      try {
        popup.onbeforeunload = () => {
          logger.info("Popup is being closed by user");
          // Set a timeout to update our state after the popup is closed
          setTimeout(() => {
            setIsOpen(false);
            setPopupWindow(null);
          }, 100);
        };
      } catch (e) {
        logger.warn("Could not attach onbeforeunload event to popup:", e);
      }

      // Set up polling to detect closed popup in case onbeforeunload doesn't fire
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          logger.info("Popup closed (detected by polling)");
          setIsOpen(false);
          setPopupWindow(null);
        }
      }, 1000);

      if (options.onOpen) {
        options.onOpen();
      }
    }

    return popup;

  }, [popupWindow, options]); // Add options to dependencies

  // Close the popup
  const closePopup = useCallback(() => {
    // Prevent closing if we just opened (potential loop)
    const timeSinceCreation = Date.now() - popupCreationTimeRef.current;
    if (lastOperationRef.current === 'open' && timeSinceCreation < 500) {
      logger.info(`Skipping close as popup was just opened (${timeSinceCreation}ms ago)`);
      return;
    }

    logger.info("Closing popup window");
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
