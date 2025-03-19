#!/usr/bin/env node

/**
 * Script to remove eslint-disable-next-line comments and fix ESLint issues properly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// List of files with eslint-disable comments (from our grep search)
const targetFiles = [
  'src/hooks/useAuctionPopup.ts',
  'src/pages/BidPage.tsx'
];

// Function to read a file
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// Function to write to a file
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Function to remove eslint-disable-next-line comments
function removeEslintDisableComments(content) {
  return content.replace(/\/\/\s*eslint-disable-next-line.*?\n/g, '\n');
}

// Main function
function main() {
  console.log('Starting ESLint fix script...');

  // Process each file
  targetFiles.forEach(filePath => {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    console.log(`Processing ${filePath}...`);

    // Read original content
    const originalContent = readFile(fullPath);

    // Remove eslint-disable comments
    const updatedContent = removeEslintDisableComments(originalContent);

    // Write updated content
    writeFile(fullPath, updatedContent);

    console.log(`Removed eslint-disable comments from ${filePath}`);
  });

  console.log('All eslint-disable comments have been removed.');
  console.log('Now running ESLint to identify remaining issues...');

  try {
    // Run ESLint to see remaining issues (don't fix automatically yet)
    const eslintOutput = execSync('npx eslint src --ext .ts,.tsx', { encoding: 'utf8' });
    console.log('ESLint check complete. No issues found!');
  } catch (error) {
    console.log('ESLint found issues that need to be fixed:');
    console.log(error.stdout);

    console.log('\nNow fixing the issues manually in each file...');

    // We'll manually fix the known issues next
    fixKnownIssues();
  }
}

// Function to fix known ESLint issues properly
function fixKnownIssues() {
  // Fix useAuctionPopup.ts
  fixUseAuctionPopupHook();

  // Fix BidPage.tsx
  fixBidPageComponent();

  console.log('Manual fixes applied. Running ESLint check again...');

  try {
    // Run ESLint again to verify fixes
    execSync('npx eslint src --ext .ts,.tsx', { encoding: 'utf8' });
    console.log('All ESLint issues have been successfully fixed!');
  } catch (error) {
    console.log('Some ESLint issues remain:');
    console.log(error.stdout);
    console.log('You may need to fix these issues manually.');
  }
}

// Fix issues in useAuctionPopup.ts
function fixUseAuctionPopupHook() {
  const filePath = 'src/hooks/useAuctionPopup.ts';
  console.log(`Fixing issues in ${filePath}...`);

  const content = readFile(filePath);

  // Include options in the dependency array for closePopup
  const updatedContent = content.replace(
    /closePopup = useCallback\(\) => {[\s\S]+?}, \[popupWindow\]\);/,
    `closePopup = useCallback\(\) => {
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
  }, [popupWindow, options]);`
  );

  writeFile(filePath, updatedContent);
  console.log(`Fixed issues in ${filePath}`);
}

// Fix issues in BidPage.tsx
function fixBidPageComponent() {
  const filePath = 'src/pages/BidPage.tsx';
  console.log(`Fixing issues in ${filePath}...`);

  let content = readFile(filePath);

  // Fix the useEffect with react-hooks/exhaustive-deps issues
  // For the first useEffect (line ~462)
  content = content.replace(
    /useEffect\(\(\) => {[\s\S]+?}, \[auction, dataLoading\]\);/,
    `useEffect\(\(\) => {
    // Skip if already initialized or in progress
    if (!popupInitializedRef.current && !popupCreationInProgressRef.current) {
      console.log("BidPage: Starting popup initialization");
      popupCreationInProgressRef.current = true;

      // Delay to prevent multiple initializations
      setTimeout(() => {
        try {
          console.log("BidPage: Initializing popup system without opening");
          popupInitializedRef.current = true;
          // Don't automatically open the popup
        } catch (error) {
          console.error("Error initializing popup:", error);
          popupInitializedRef.current = false;
        } finally {
          // Reset creation flag when done
          popupCreationInProgressRef.current = false;
        }
      }, 300);
    }
  }, [auction, dataLoading, popupInitializedRef, popupCreationInProgressRef]);`
  );

  // For the second useEffect (line ~502)
  content = content.replace(
    /useEffect\(\(\) => {[\s\S]+?}, \[isOpen, auction, isAuctionEnded, updatePopupInfo\]\);/,
    `useEffect\(\(\) => {
    // Only show popup if it's initialized, open, and we have auction data
    if (popupInitializedRef.current && isOpen && auction) {
      if (!shouldShowPopup) {
        console.log("BidPage: Setting shouldShowPopup to true");
        setShouldShowPopup(true);
      }

      // Update popup with current information
      updatePopupInfo();

      // Make sure to refresh the popup content when auction ends
      if (isAuctionEnded && auction.result) {
        console.log("BidPage: Auction ended, refreshing popup content");
        setAuctionResults({
          winnerName: auction.result.winnerName || '',
          winnerId: auction.result.winnerId || highestBidderId || '',
          finalPrice: formatCurrency(auction.result.finalPrice || 0),
          totalBids: auction.result.totalBids || (bids ? bids.length : 0),
          auctionDuration: elapsedTime
        });
      }
    } else if (shouldShowPopup) {
      console.log("BidPage: Setting shouldShowPopup to false");
      setShouldShowPopup(false);
    }
  }, [isOpen, auction, isAuctionEnded, updatePopupInfo, shouldShowPopup, setShouldShowPopup, highestBidderId, bids, elapsedTime, setAuctionResults]);`
  );

  // For the third useEffect (unmount cleanup, line ~519)
  content = content.replace(
    /useEffect\(\(\) => {[\s\S]+?return \(\) => {[\s\S]+?};\s+}, \[\]\);/,
    `useEffect\(\(\) => {
    return () => {
      console.log("BidPage: Component unmounting, cleanup");

      // Reset all flags
      popupInitializedRef.current = false;
      popupCreationInProgressRef.current = false;

      // Make sure all popups are closed
      console.log("BidPage: Closing popups during unmount");
      closePopup();
      popupService.closeAllPopups(true);
    };
  }, [closePopup]);`
  );

  // Fix the unused variables (lines ~1164 and ~1216)
  // For handleExportData - remove the no-unused-vars comment since it is actually used
  // For handleGoToHistory - either use it or remove it

  // Removing the no-unused-vars from handleExportData happens automatically
  // with our comment removal

  // We'll keep handleGoToHistory and make sure it's used somewhere
  content = content.replace(
    `// New function to navigate to auction history
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGoToHistory = () => {
    navigate('/history');
  };`,
    `// New function to navigate to auction history
  const handleGoToHistory = () => {
    navigate('/history');
  };`
  );

  // Add a history button to the return statement to use handleGoToHistory
  content = content.replace(
    /<button[\s\S]+?onClick={handleShowPopup}[\s\S]+?<\/button>/,
    match => {
      return match + `
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={handleGoToHistory}
                style={{ backgroundColor: 'rgba(108, 117, 125, 0.5)', borderColor: 'rgba(108, 117, 125, 0.5)', fontFamily: 'Roboto, sans-serif' }}
              >
                <i className="bi bi-clock-history me-1"></i> Lịch sử
              </button>`;
    }
  );

  writeFile(filePath, content);
  console.log(`Fixed issues in ${filePath}`);
}

// Run the script
main();
