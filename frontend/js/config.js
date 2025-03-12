// Environment Configuration
const config = {
    // API Configuration
    apiBaseUrl: 'http://localhost:8080/api/v1',
    endpoints: {
        // Auction endpoints
        auctionSettings: '/auction/settings',
        auctionStatus: '/auction/status',
        auctionHistory: '/auction/history',
        auctionHistoryComplete: '/auction/history/complete',
        auctionReset: '/auction/reset',
        auctionStart: '/auction/start',
        auctionBid: '/auction/bid',

        // Bidder endpoints
        bidders: '/bidders',
        bidderById: (id) => `/bidders/${id}`,
        biddersImport: '/bidders/import'
    },

    // Page URLs
    pages: {
        index: 'index.html',
        setup: 'setup.html',
        bid: 'bid.html',
        result: 'result.html'
    },

    // Default settings
    defaultSettings: {
        startingPrice: 1000000,
        priceStep: 50000,
        auctionDuration: 300 // 5 minutes in seconds
    },

    // UI Configuration
    toastDelay: 5000,
    toastDelayError: 10000, // Longer delay for error messages
    loadingOverlayDelay: 300,
    retryInterval: 5000,

    // Debug settings
    debug: true, // Enable debug mode for verbose logging

    // Event-driven configuration
    eventSource: null,
    eventRetryInterval: 2000, // milliseconds

    // Minimum bidders required
    minBidders: 2
};

// Function to load config from .env.js if available (for production overrides)
function loadEnvConfig() {
    try {
        // Try to load environment-specific config if it exists
        if (typeof envConfig !== 'undefined') {
            // Merge environment config with default config
            for (const key in envConfig) {
                if (Object.hasOwnProperty.call(envConfig, key)) {
                    // Handle nested objects like endpoints and pages
                    if (typeof envConfig[key] === 'object' && !Array.isArray(envConfig[key]) &&
                        config[key] && typeof config[key] === 'object') {
                        // Merge nested objects
                        for (const nestedKey in envConfig[key]) {
                            if (Object.hasOwnProperty.call(envConfig[key], nestedKey)) {
                                config[key][nestedKey] = envConfig[key][nestedKey];
                            }
                        }
                    } else {
                        // Direct assignment for non-objects
                        config[key] = envConfig[key];
                    }
                }
            }
            if (config.debug) {
                console.log('Environment config loaded successfully');
            }
        }
    } catch (error) {
        console.warn('No environment config found, using defaults');
    }
}

// Call function to load environment config
loadEnvConfig();

// Export the config for use in other files
export default config;
