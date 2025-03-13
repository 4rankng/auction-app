/**
 * Auction App Test Automation - Configuration
 *
 * This file contains all configuration settings for the test automation suite.
 * All endpoint URLs and other configurable parameters should be defined here.
 */

// Base URLs - can be overridden with environment variables
const BASE_FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
const BASE_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Configuration object
const config = {
  // Server URLs
  urls: {
    // Frontend URLs
    frontend: {
      base: BASE_FRONTEND_URL,
      index: `${BASE_FRONTEND_URL}/frontend/index.html`,
      setup: `${BASE_FRONTEND_URL}/frontend/setup.html`,
      bid: `${BASE_FRONTEND_URL}/frontend/bid.html`,
    },

    // Backend URLs
    backend: {
      base: BASE_BACKEND_URL,
      health: `${BASE_BACKEND_URL}/health`,

      // API endpoints
      api: {
        base: `${BASE_BACKEND_URL}/api/v1`,
        auctions: {
          base: `${BASE_BACKEND_URL}/api/v1/auctions`,
          getById: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}`,
          export: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/export/${id}`,
          start: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/start`,
          end: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/end`,
          bids: {
            place: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/bids`,
            current: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/bids/current`,
            history: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/bids/history`,
          },
          bidders: (id) => `${BASE_BACKEND_URL}/api/v1/auctions/${id}/bidders`,
        },
        bidders: {
          base: `${BASE_BACKEND_URL}/api/v1/bidders`,
          getById: (id) => `${BASE_BACKEND_URL}/api/v1/bidders/${id}`,
          delete: (id) => `${BASE_BACKEND_URL}/api/v1/bidders/${id}`,
          import: `${BASE_BACKEND_URL}/api/v1/bidders/import`,
        },
      },
    },
  },

  // Test timeouts
  timeouts: {
    defaultPageLoad: 5000,
    defaultApiResponse: 5000,
    serverStartup: 10000,
  },

  // Server ports (for programmatic starting of servers)
  ports: {
    frontend: 5500,
    backend: 8080,
  },
};

module.exports = config;
