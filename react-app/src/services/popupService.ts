/**
 * Popup Service
 * Handles opening and managing popup windows for the auction application
 */

// Configuration for popup windows
interface PopupConfig {
  width?: number;
  height?: number;
  toolbar?: boolean;
  scrollbars?: boolean;
  resizable?: boolean;
  top?: number;
  left?: number;
  preventAutoClose?: boolean; // Added option to prevent auto-close
}

// Track active popup references with their configurations
let activePopups: Record<string, { window: Window | null, preventAutoClose?: boolean }> = {};

/**
 * Opens a popup window with the specified URL
 * @param url URL to load in the popup
 * @param name Name identifier for the popup
 * @param config Configuration options for the popup
 * @returns Reference to the opened window or null if unsuccessful
 */
export const openPopup = (url: string, name: string, config: PopupConfig = {}): Window | null => {
  // Default configuration values
  const {
    width = 800,
    height = 600,
    toolbar = false,
    scrollbars = true,
    resizable = true,
    top = window.screen.height / 2 - 300, // Center vertically
    left = window.screen.width / 2 - 400, // Center horizontally
    preventAutoClose = false // Default to false for backward compatibility
  } = config;

  // Format window features string
  const features = [
    `width=${width}`,
    `height=${height}`,
    `top=${top}`,
    `left=${left}`,
    `toolbar=${toolbar ? 'yes' : 'no'}`,
    `scrollbars=${scrollbars ? 'yes' : 'no'}`,
    `resizable=${resizable ? 'yes' : 'no'}`,
    'status=no',
    'menubar=no',
    'location=no'
  ].join(',');

  // Close existing popup with the same name
  closePopup(name);

  // Open the new popup
  try {
    const popupWindow = window.open(url, name, features);

    // Store reference to the popup with its configuration
    if (popupWindow) {
      // Store the popup reference
      activePopups[name] = {
        window: popupWindow,
        preventAutoClose
      };

      // Only set up auto-close detection if preventAutoClose is false
      if (!preventAutoClose) {
        // Set up event listener for popup close
        const checkClosed = setInterval(() => {
          if (!popupWindow || popupWindow.closed) {
            clearInterval(checkClosed);
            delete activePopups[name];
            console.log(`Popup '${name}' was closed by user`);
          }
        }, 500);

        // Attach the interval ID to the popupWindow for cleanup
        (popupWindow as any).__checkClosedInterval = checkClosed;
      }
    }

    return popupWindow;
  } catch (error) {
    console.error('Failed to open popup window:', error);
    return null;
  }
};

/**
 * Closes a specific popup window
 * @param name Name of the popup to close
 * @returns Boolean indicating success
 */
export const closePopup = (name: string): boolean => {
  const popupInfo = activePopups[name];
  if (!popupInfo || !popupInfo.window) return false;

  const popup = popupInfo.window;

  if (popup && !popup.closed) {
    // Clear any auto-close interval if it exists
    if ((popup as any).__checkClosedInterval) {
      clearInterval((popup as any).__checkClosedInterval);
      delete (popup as any).__checkClosedInterval;
    }

    // Close the popup
    try {
      popup.close();
      console.log(`Popup '${name}' closed programmatically`);
    } catch (error) {
      console.error(`Error closing popup '${name}':`, error);
    }

    // Remove from tracking
    delete activePopups[name];
    return true;
  }

  return false;
};

/**
 * Closes all active popup windows
 */
export const closeAllPopups = (includePreventAutoClose: boolean = false): void => {
  Object.entries(activePopups).forEach(([name, popupInfo]) => {
    // Skip popups with preventAutoClose=true unless explicitly requested
    if (!includePreventAutoClose && popupInfo.preventAutoClose) {
      return;
    }

    if (popupInfo.window && !popupInfo.window.closed) {
      // Clear any auto-close interval
      if ((popupInfo.window as any).__checkClosedInterval) {
        clearInterval((popupInfo.window as any).__checkClosedInterval);
        delete (popupInfo.window as any).__checkClosedInterval;
      }

      // Close the popup
      try {
        popupInfo.window.close();
      } catch (error) {
        console.error(`Error closing popup '${name}' during closeAllPopups:`, error);
      }

      delete activePopups[name];
    }
  });
};

/**
 * Checks if a specific popup is open
 * @param name Name of the popup to check
 * @returns Boolean indicating if the popup is open
 */
export const isPopupOpen = (name: string): boolean => {
  const popupInfo = activePopups[name];
  if (!popupInfo || !popupInfo.window) return false;

  return !popupInfo.window.closed;
};

/**
 * Gets the number of active popups
 * @returns Number of active popups
 */
export const getActivePopupCount = (): number => {
  return Object.keys(activePopups).length;
};

// Clean up popups when the page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Close all popups except those with preventAutoClose=true
    closeAllPopups(false);
  });
}
