// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://127.0.0.1:5500',
        /* Collect trace when retrying the failed test. */
        trace: 'on-first-retry',
        /* Take screenshot on failure */
        screenshot: 'only-on-failure',
      },
    },
  ],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
});
