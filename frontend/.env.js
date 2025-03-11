// Environment-specific configuration
// This file is meant to be customized for each environment (dev, staging, production)
// It will override any default settings in config.js

const envConfig = {
    // API URL - Change this to match your environment
    apiBaseUrl: 'http://localhost:8080/api/v1',

    // Debug mode - Should be false in production
    debug: true

    // Add any other environment-specific settings here
};

// In production, you might want:
// apiBaseUrl: 'https://your-production-api.com/api/v1',
// debug: false
