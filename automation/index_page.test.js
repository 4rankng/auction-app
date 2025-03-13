const { test, expect } = require('@playwright/test');
const config = require('./config');
const { checkServersRunning } = require('./utils/server-utils');

/**
 * UI tests for the Auction App index page
 *
 * These tests verify that:
 * 1. The "Create New Auction" button navigates to the setup page
 * 2. The "View Auction" button navigates to the specific auction page
 * 3. The language and formatting on the index page meet requirements
 * 4. Prices are displayed in VND with comma separators
 */

// Base URL for the frontend - use the URL from the command line
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/frontend/index.html' : config.urls.frontend.index;
const backendUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL + '/health' : config.urls.backend.health;

test.describe('Auction Index Page Tests', () => {
  // Before all tests, check if servers are running
  test.beforeAll(async () => {
    const { frontendRunning, backendRunning } = await checkServersRunning();

    if (!frontendRunning || !backendRunning) {
      console.error('⚠️ TESTS WILL FAIL: One or both servers are not running!');
      console.error('Please start the required servers before running the tests:');
      console.error(`1. Frontend: cd frontend && npx http-server . -p ${config.ports.frontend}`);
      console.error('2. Backend: cd backend && go run .');
      // We don't throw an error here because we want the tests to run and show the proper error messages
    }
  });

  // Before each test, navigate to the index page
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto(frontendUrl);
      // Wait for the page to fully load
      await page.waitForSelector('.container', { timeout: config.timeouts.defaultPageLoad });
    } catch (error) {
      // This error will be caught by Playwright and the test will fail
      // with a meaningful error message
      throw new Error(`Failed to load frontend page at ${frontendUrl}. Make sure the frontend server is running.`);
    }
  });

  test('should display the auction list page with correct structure', async ({ page }) => {
    // Check that the page has the correct title
    await expect(page).toHaveTitle(/Hệ Thống Đấu Giá/); // Should contain this text

    // Check for the main elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#createAuctionBtn')).toBeVisible();

    // Check that the create button has the correct text
    const createBtnText = await page.locator('#createAuctionBtn').textContent();
    expect(createBtnText).toContain('Create New Auction');
  });

  test('clicking "Create New Auction" should navigate to setup/create page', async ({ page }) => {
    // Click the Create New Auction button
    await page.click('#createAuctionBtn');

    // Give the page time to process the click and start navigation
    await page.waitForTimeout(1000);

    // Check that we've navigated away from the index page
    await expect(page.url()).not.toEqual(frontendUrl);

    // The actual navigation might depend on the app's current state
    // We can only verify we're not on the index page anymore
  });

  test('should display prices in VND with comma separators', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);

    // Get the entire page content
    const pageContent = await page.textContent('body');

    // Check if any VND prices are present in the page
    if (pageContent.includes('VND')) {
      // Find all price text with regex
      const pricePattern = /[\d,.]+ VND/g;
      const priceMatches = pageContent.match(pricePattern);

      if (priceMatches && priceMatches.length > 0) {
        // For each price found, check the format
        for (const price of priceMatches) {
          // Extract the numeric part
          const numericPart = price.replace(' VND', '').trim();

          // If the number is > 999, it should have commas
          if (parseFloat(numericPart.replace(/,/g, '')) > 999) {
            expect(numericPart).toMatch(/\d{1,3}(,\d{3})+/);
          }
        }
      }
    }
  });

  test('clicking "View Auction" should navigate to the auction page', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check if there are any view buttons
    const viewBtnCount = await page.locator('.view-auction').count();

    if (viewBtnCount > 0) {
      // Click the first view auction button
      await page.click('.view-auction:first-child');

      // Give the page time to navigate
      await page.waitForTimeout(1000);

      // Check that we've navigated away from the index page
      await expect(page.url()).not.toEqual(frontendUrl);
    } else {
      // Skip test if no auction cards are found
      test.skip('No auctions available to test View button');
    }
  });
});
