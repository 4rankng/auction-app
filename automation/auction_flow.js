const axios = require('axios');
const chalk = require('chalk');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { startServer, waitForServer } = require('./server');
require('dotenv').config();

// Configuration
const serverUrl = process.env.SERVER_URL || 'http://localhost:8080';
const api = axios.create({
  baseURL: serverUrl,
  timeout: 10000,
});

// Utility functions
const log = {
  info: message => console.log(chalk.blue(`[INFO] ${message}`)),
  success: message => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: message => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: message => console.error(chalk.red(`[ERROR] ${message}`)),
  step: (step, message) => console.log(chalk.cyan(`[STEP ${step}] ${message}`)),
  json: obj => console.log(JSON.stringify(obj, null, 2))
};

// Sleep utility
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Auction flow steps
async function createAuction() {
  log.step(1, 'Creating a new auction');

  const auctionData = {
    title: "Luxury Watch Collection",
    startingPrice: 10000,
    priceStep: 500,
    bidders: [
      { id: "1", name: "Nguyễn Ngọc Mai", address: "Hà Nội" },
      { id: "2", name: "Đinh Thị Hường", address: "Hồ Chí Minh" },
      { id: "3", name: "Hoàng Thị Chi", address: "Đà Nẵng" }
    ]
  };

  try {
    const response = await api.post('/api/v1/auctions', auctionData);
    log.success('Auction created successfully');
    log.json(response.data);
    return response.data.data.id;
  } catch (error) {
    log.error(`Failed to create auction: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function getAuction(auctionId) {
  log.step(2, `Retrieving auction details for ID: ${auctionId}`);

  try {
    const response = await api.get(`/api/v1/auctions/${auctionId}`);
    log.success('Auction details retrieved successfully');
    log.json(response.data);
    return response.data.data;
  } catch (error) {
    log.error(`Failed to retrieve auction: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function uploadBidders(filePath, auctionId) {
  log.step(3, `Adding bidders to auction: ${auctionId}`);

  try {
    // Prepare bidders data with proper IDs
    const bidders = [
      { id: "1", name: "Nguyễn Ngọc Mai", address: "Hà Nội" },
      { id: "2", name: "Đinh Thị Hường", address: "Hồ Chí Minh" },
      { id: "3", name: "Hoàng Thị Chi", address: "Đà Nẵng" }
    ];

    // Use the new auction-specific bidders endpoint
    const response = await api.put(`/api/v1/auctions/${auctionId}/bidders`, {
      bidders: bidders
    });

    log.success('Bidders added successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to add bidders: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function startAuction(auctionId) {
  log.step(4, `Starting auction with ID: ${auctionId}`);

  try {
    const response = await api.put(`/api/v1/auctions/${auctionId}/start`);
    log.success('Auction started successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to start auction: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function placeBid(auctionId, bidderId, amount) {
  log.step(5, `Placing bid: Bidder ${bidderId}, Amount ${amount}`);

  try {
    const response = await api.post(`/api/v1/auctions/${auctionId}/bids`, {
      bidderId,
      amount
    });
    log.success('Bid placed successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.warning(`Bid placement issue: ${error.message}`);
    if (error.response) log.json(error.response.data);
    return error.response?.data;
  }
}

async function getCurrentBids(auctionId) {
  log.step(6, `Getting current bids for auction: ${auctionId}`);

  try {
    const response = await api.get(`/api/v1/auctions/${auctionId}/bids/current`);
    log.success('Current bids retrieved successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to get current bids: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function getBidHistory(auctionId) {
  log.step(7, `Getting bid history for auction: ${auctionId}`);

  try {
    const response = await api.get(`/api/v1/auctions/${auctionId}/bids/history`);
    log.success('Bid history retrieved successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to get bid history: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function endAuction(auctionId) {
  log.step(8, `Ending auction with ID: ${auctionId}`);

  try {
    const response = await api.put(`/api/v1/auctions/${auctionId}/end`);
    log.success('Auction ended successfully');
    log.json(response.data);
    return response.data;
  } catch (error) {
    log.error(`Failed to end auction: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

async function exportAuctionData(auctionId) {
  log.step(9, `Exporting data for auction: ${auctionId}`);

  try {
    const response = await api.get(`/api/v1/auctions/export/${auctionId}`, {
      responseType: 'arraybuffer'
    });

    // Save the Excel file
    const outputPath = path.join(__dirname, `auction_${auctionId}_export.xlsx`);
    fs.writeFileSync(outputPath, response.data);

    log.success(`Auction data exported successfully and saved to ${outputPath}`);
    return outputPath;
  } catch (error) {
    log.error(`Failed to export auction data: ${error.message}`);
    if (error.response) log.json(error.response.data);
    throw error;
  }
}

// Add a function to add bidders one by one
async function addBidder(auctionId, name, address = "") {
  try {
    const response = await api.post(`/api/v1/auctions/${auctionId}/bidders`, {
      name: name
    });

    log.info(`Added bidder ${name} to auction ${auctionId}`);
    return response.data;
  } catch (error) {
    log.warning(`Failed to add bidder ${name}: ${error.message}`);
    if (error.response) log.json(error.response.data);
    return null;
  }
}

// Main function to run the entire auction flow
async function runAuctionFlow() {
  try {
    // Create an auction
    const auctionId = await createAuction();
    if (!auctionId) {
      throw new Error('Failed to get auction ID');
    }

    // Get auction details
    const auctionDetails = await getAuction(auctionId);

    // Upload bidders for this auction
    await uploadBidders(null, auctionId);

    // Start the auction
    await startAuction(auctionId);

    // Simulate bidding process with multiple bids
    log.info('Starting bidding simulation...');

    // Round 1: First bidder places a bid
    await placeBid(auctionId, "1", auctionDetails.startingPrice + auctionDetails.priceStep);
    await sleep(1000); // Small delay to simulate real-world timing

    // Round 2: Second bidder outbids the first
    await placeBid(auctionId, "2", auctionDetails.startingPrice + (2 * auctionDetails.priceStep));
    await sleep(1000);

    // Round 3: Third bidder outbids everyone
    await placeBid(auctionId, "3", auctionDetails.startingPrice + (3 * auctionDetails.priceStep));
    await sleep(1000);

    // Round 4: First bidder tries again
    await placeBid(auctionId, "1", auctionDetails.startingPrice + (4 * auctionDetails.priceStep));
    await sleep(1000);

    // Round 5: Second bidder makes a big jump
    await placeBid(auctionId, "2", auctionDetails.startingPrice + (6 * auctionDetails.priceStep));
    await sleep(1000);

    // Get current bids
    await getCurrentBids(auctionId);

    // Get bid history
    await getBidHistory(auctionId);

    // End the auction
    const endResult = await endAuction(auctionId);

    // Verify the winner (Bidder 2 should win)
    log.info('Verifying auction results...');

    if (endResult.data.highestBidder === "2") {
      log.success('Auction verification successful: Bidder 2 is the winner as expected');
    } else {
      log.warning(`Auction verification warning: Expected winner to be Bidder 2, but got ${endResult.data.highestBidder}`);
    }

    // Export the auction data
    await exportAuctionData(auctionId);

    log.success('Auction flow completed successfully!');
    return true;
  } catch (error) {
    log.error(`Auction flow failed: ${error.message}`);
    return false;
  }
}

// Execute the entire process if run directly
async function main() {
  let serverProcess = null;

  try {
    // Check if the server is already running, if not start it
    if (!await isServerRunning()) {
      log.info('Starting the backend server...');
      serverProcess = startServer();
      await waitForServer();
    } else {
      log.info('Backend server is already running.');
    }

    // Run the auction flow
    await runAuctionFlow();
  } catch (error) {
    log.error(`Main process error: ${error.message}`);
    process.exit(1);
  } finally {
    // Clean up the server if we started it
    if (serverProcess) {
      log.info('Shutting down server...');
      serverProcess.kill();
    }
  }
}

// Helper function to check if server is running
async function isServerRunning() {
  try {
    const response = await axios.get(`${serverUrl}/health`);
    log.info(`Server health status: ${response.data.status}, version: ${response.data.version}`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(err => {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}
