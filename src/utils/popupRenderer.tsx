import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot, Root } from 'react-dom/client';

interface RenderOptions {
  onRender?: () => void;
  onCleanup?: () => void;
}

/**
 * Renders a React component in a popup window
 * @param popup Window object reference to the popup
 * @param Component React component to render
 * @param props Props to pass to the component
 * @param options Additional render options
 */
export const renderInPopup = (
  popup: Window,
  Component: React.ComponentType<any>,
  props: any,
  options: RenderOptions = {}
) => {
  if (!popup || popup.closed) {
    console.error('Cannot render in a closed or invalid popup window');
    return null;
  }

  // Wait for popup DOM to be ready
  const maxAttempts = 20;
  let attempts = 0;

  const tryRender = () => {
    attempts++;

    if (attempts > maxAttempts) {
      console.error('Failed to render in popup: Maximum attempts exceeded');
      return;
    }

    try {
      const popupDoc = popup.document;
      const container = popupDoc.getElementById('auction-popup-root');

      if (!container) {
        // Try again in a short delay if container isn't ready
        setTimeout(tryRender, 50);
        return;
      }

      // Use createRoot for React 18+
      try {
        // Check if we already have a root for this container to avoid multiple createRoot calls
        let root: Root;
        if ((popup as any).__reactRoot) {
          // Reuse existing root
          root = (popup as any).__reactRoot;
        } else {
          // Create new root and store it
          root = createRoot(container);
          (popup as any).__reactRoot = root;
        }

        // Render with the root
        root.render(<Component {...props} />);

        // Store cleanup function on popup window for later use
        (popup as any).__reactCleanup = () => {
          try {
            root.unmount();
            delete (popup as any).__reactRoot;
            if (options.onCleanup) options.onCleanup();
          } catch (error) {
            console.error('Error during React cleanup in popup:', error);
          }
        };
      } catch (e) {
        console.error('Error creating React root:', e);
        // Fallback to legacy render for older React versions
        if (!(popup as any).__reactRootLegacy) {
          // Only render if we haven't already set up a legacy render
          ReactDOM.render(<Component {...props} />, container);
          (popup as any).__reactRootLegacy = true;
        }

        // Store cleanup function on popup window for later use
        (popup as any).__reactCleanup = () => {
          try {
            if ((popup as any).__reactRootLegacy) {
              ReactDOM.unmountComponentAtNode(container);
              delete (popup as any).__reactRootLegacy;
            }
            if (options.onCleanup) options.onCleanup();
          } catch (error) {
            console.error('Error during React cleanup in popup:', error);
          }
        };
      }

      if (options.onRender) options.onRender();
    } catch (error) {
      console.error('Failed to render in popup:', error);
      setTimeout(tryRender, 50);
    }
  };

  tryRender();
};

/**
 * Cleanup rendered React component in a popup window
 * @param popup Window object reference to the popup
 */
export const cleanupPopupRendering = (popup: Window) => {
  if (!popup || popup.closed) return;

  try {
    if ((popup as any).__reactCleanup) {
      (popup as any).__reactCleanup();
      delete (popup as any).__reactCleanup;
    }
  } catch (error) {
    console.error('Error cleaning up popup rendering:', error);
  }
};

// Fix anonymous default export warning by assigning to a variable first
const popupRendererUtils = { renderInPopup, cleanupPopupRendering };
export default popupRendererUtils;
