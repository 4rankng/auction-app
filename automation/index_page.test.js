const { test, expect } = require('@playwright/test');
const config = require('./config');
const { checkServersRunning } = require('./utils/server-utils');

/**
 * UI tests for the Auction App index page
 *
 * These tests verify that:
 * 1. The page uses Vietnamese language for all UI elements
 * 2. All numeric values are properly formatted with VND currency and comma separators
 * 3. The "Create New Auction" button navigates to the setup page
 * 4. The "View Auction" button navigates to the specific auction page
 */

// Base URL for the frontend - use the URL from the command line
const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL + '/frontend/index.html' : config.urls.frontend.index;
const backendUrl = process.env.BACKEND_URL ? process.env.BACKEND_URL + '/health' : config.urls.backend.health;

// Vietnamese text constants for verification
const VI_TEXTS = {
  pageTitle: 'Hệ Thống Đấu Giá',
  createButton: 'Tạo Phiên Đấu Giá Mới',
  viewButton: 'Xem Chi Tiết',
  statusLabels: {
    notStarted: 'Chưa Bắt Đầu',
    inProgress: 'Đang Diễn Ra',
    completed: 'Đã Kết Thúc'
  },
  headers: {
    title: 'Tên Phiên',
    status: 'Trạng Thái',
    startingPrice: 'Giá Khởi Điểm',
    currentPrice: 'Giá Hiện Tại',
    bidders: 'Người Tham Gia'
  }
};

test.describe('Auction Index Page Tests', () => {
  // Before all tests, check if servers are running
  test.beforeAll(async () => {
    const { frontendRunning, backendRunning } = await checkServersRunning();

    if (!frontendRunning || !backendRunning) {
      console.error('⚠️ TESTS WILL FAIL: One or both servers are not running!');
      console.error('Please start the required servers before running the tests:');
      console.error(`1. Frontend: cd frontend && npx http-server . -p ${config.ports.frontend}`);
      console.error('2. Backend: cd backend && go run .');
    }
  });

  // Before each test, navigate to the index page
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto(frontendUrl);
      // Wait for the page to fully load
      await page.waitForSelector('.container', { timeout: config.timeouts.defaultPageLoad });
    } catch (error) {
      throw new Error(`Failed to load frontend page at ${frontendUrl}. Make sure the frontend server is running.`);
    }
  });

  test('should display the auction list page with correct Vietnamese text', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(VI_TEXTS.pageTitle);

    // Check main heading
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain(VI_TEXTS.pageTitle);

    // Check create button text
    const createBtnText = await page.locator('#createAuctionBtn').textContent();
    expect(createBtnText).toContain(VI_TEXTS.createButton);

    // Check table headers
    for (const [key, value] of Object.entries(VI_TEXTS.headers)) {
      const headerText = await page.locator(`th:has-text("${value}")`).textContent();
      expect(headerText).toContain(value);
    }

    // Check status labels if any auctions exist
    const statusCells = await page.locator('td.status').all();
    for (const cell of statusCells) {
      const status = await cell.textContent();
      expect(Object.values(VI_TEXTS.statusLabels)).toContain(status.trim());
    }
  });

  test('should format all numeric values as VND with comma separators', async ({ page }) => {
    // Wait for auction data to load
    await page.waitForTimeout(1000);

    // Check starting prices
    const startingPrices = await page.locator('td.starting-price').all();
    for (const price of startingPrices) {
      const priceText = await price.textContent();
      expect(priceText).toMatch(/^\d{1,3}(\.\d{3})*(\s)?VND$/);

      // Verify dot formatting for numbers > 999
      const numericValue = parseInt(priceText.replace(/[^\d]/g, ''));
      if (numericValue > 999) {
        expect(priceText).toMatch(/\d{1,3}(\.\d{3})+(\s)?VND$/);
      }
    }

    // Check current prices
    const currentPrices = await page.locator('td.current-price').all();
    for (const price of currentPrices) {
      const priceText = await price.textContent();
      if (priceText !== '0 VND') { // Skip if no bids
        expect(priceText).toMatch(/^\d{1,3}(\.\d{3})*(\s)?VND$/);

        // Verify dot formatting for numbers > 999
        const numericValue = parseInt(priceText.replace(/[^\d]/g, ''));
        if (numericValue > 999) {
          expect(priceText).toMatch(/\d{1,3}(\.\d{3})+(\s)?VND$/);
        }
      }
    }
  });

  test('clicking "Create New Auction" should navigate to setup page', async ({ page }) => {
    // Wait for response from creating auction
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/auctions') && response.request().method() === 'POST'
    );

    // Click the Create New Auction button
    await page.click('#createAuctionBtn');

    // Wait for the response
    await responsePromise;

    // Wait for navigation to complete
    await page.waitForTimeout(1000);

    // Verify navigation
    expect(page.url()).toContain('setup.html');

    // Verify the setup page is in Vietnamese
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Tạo Phiên Đấu Giá');
  });

  test('clicking "View Auction" should navigate to auction details', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check if there are any view buttons
    const viewBtnCount = await page.locator('.view-auction').count();

    if (viewBtnCount > 0) {
      // Get the first view button
      const viewBtn = await page.locator('.view-auction').first();

      // Verify view button text
      const viewBtnText = await viewBtn.textContent();
      expect(viewBtnText.trim()).toBe(VI_TEXTS.viewButton);

      // Click the first view auction button
      await viewBtn.click();
      await page.waitForTimeout(1000);

      // Verify navigation
      expect(page.url()).toContain('bid.html');

      // Verify the auction page is in Vietnamese
      const pageTitle = await page.title();
      expect(pageTitle).toContain('Chi Tiết Phiên Đấu Giá');
    } else {
      test.skip('No auctions available to test View button');
    }
  });
});
