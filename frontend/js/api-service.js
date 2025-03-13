// API Service - Handles API calls with support for demo mode
import config from './config.js';
import * as demoApi from './demo-data.js';

// Check if demo mode is enabled
const isDemoMode = config.demoMode === true;

// Log mode for debugging
if (config.debug) {
    console.log(`API Service running in ${isDemoMode ? 'DEMO' : 'REAL'} mode`);
}

// Base API URL
const API_BASE_URL = config.apiBaseUrl;

// Helper function for API requests (used in real mode)
async function apiRequest(url, options = {}) {
    const fullUrl = `${API_BASE_URL}${url}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    const requestOptions = { ...defaultOptions, ...options };

    if (config.debug) {
        console.log(`API Request: ${fullUrl}`, requestOptions);
    }

    try {
        const response = await fetch(fullUrl, requestOptions);

        // Check if the request was successful
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: `HTTP error: ${response.status} ${response.statusText}`
            }));

            throw new Error(errorData.message || `HTTP error: ${response.status}`);
        }

        // Parse JSON response
        const data = await response.json();

        if (config.debug) {
            console.log(`API Response: ${fullUrl}`, data);
        }

        return data;
    } catch (error) {
        console.error(`API Error: ${fullUrl}`, error);
        throw error;
    }
}

// API Methods

// Auction Settings
export async function getAuctionSettings() {
    if (isDemoMode) {
        return demoApi.getAuctionSettings();
    }

    return apiRequest(config.endpoints.auctions);
}

export async function updateAuctionSettings(settings) {
    if (isDemoMode) {
        return demoApi.updateAuctionSettings(settings);
    }

    return apiRequest(config.endpoints.auctions, {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
}

// Bidders
export async function getBidders() {
    if (isDemoMode) {
        return demoApi.getBidders();
    }

    return apiRequest(config.endpoints.bidders);
}

export async function addBidder(bidder) {
    if (isDemoMode) {
        return demoApi.addBidder(bidder);
    }

    return apiRequest(config.endpoints.bidders, {
        method: 'POST',
        body: JSON.stringify(bidder)
    });
}

export async function deleteBidder(bidderId) {
    if (isDemoMode) {
        return demoApi.deleteBidder(bidderId);
    }

    return apiRequest(config.endpoints.bidderById(bidderId), {
        method: 'DELETE'
    });
}

export async function importBidders(bidders) {
    if (isDemoMode) {
        return demoApi.importBidders(bidders);
    }

    return apiRequest(config.endpoints.biddersImport, {
        method: 'POST',
        body: JSON.stringify(bidders)
    });
}

// Auction Management
export async function startAuction() {
    if (isDemoMode) {
        return demoApi.startAuction();
    }

    return apiRequest(config.endpoints.startAuction('current'), {
        method: 'POST'
    });
}

export async function getAuctionStatus() {
    if (isDemoMode) {
        return demoApi.getAuctionStatus();
    }

    return apiRequest(config.endpoints.auctionById('current'));
}

export async function endAuction() {
    if (isDemoMode) {
        return demoApi.endAuction();
    }

    return apiRequest(config.endpoints.endAuction('current'), {
        method: 'POST'
    });
}

// Bids
export async function placeBid(bid) {
    if (isDemoMode) {
        return demoApi.placeBid(bid);
    }

    return apiRequest(config.endpoints.placeBid('current'), {
        method: 'POST',
        body: JSON.stringify(bid)
    });
}

export async function getBidHistory() {
    if (isDemoMode) {
        return demoApi.getBidHistory();
    }

    return apiRequest(config.endpoints.bidHistory('current'));
}

export async function cancelLastBid() {
    if (isDemoMode) {
        return demoApi.cancelLastBid();
    }

    return apiRequest(config.endpoints.currentBids('current'), {
        method: 'DELETE'
    });
}

// Demo-specific operations
export async function resetDemo() {
    if (isDemoMode) {
        return demoApi.resetDemo();
    }

    return Promise.reject(new Error("Reset is only available in demo mode"));
}

// Health check
export async function checkHealth() {
    if (isDemoMode) {
        return Promise.resolve({ status: 'UP', mode: 'DEMO' });
    }

    return apiRequest(config.endpoints.health);
}
