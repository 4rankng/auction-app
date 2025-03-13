// Demo Data for Auction App
// This file provides mock data and API functionality for demo mode

// In-memory database for demo mode
const demoDb = {
    auction: {
        id: "demo-auction-1",
        status: "setup", // Can be: setup, active, ended
        startingPrice: 1000000,
        priceStep: 50000,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        startedAt: null,
        endedAt: null,
        currentRound: 0,
        timeRemaining: 60,
        auctionDuration: 60, // Default 60 seconds per round
        winningBid: null,
        winningBidder: null
    },
    bidders: [
        { id: "B001", name: "Nguyễn Văn A", address: "123 Đường Lê Lợi, Hà Nội" },
        { id: "B002", name: "Trần Thị B", address: "456 Đường Nguyễn Huệ, TP.HCM" },
        { id: "B003", name: "Lê Văn C", address: "789 Đường Trần Phú, Đà Nẵng" }
    ],
    bids: []
};

// Timer for auction
let demoTimer = null;

// Mock API functions

// Get auction settings
export function getAuctionSettings() {
    return Promise.resolve({
        initialPrice: demoDb.auction.startingPrice,
        priceIncrement: demoDb.auction.priceStep,
        auctionDuration: demoDb.auction.auctionDuration
    });
}

// Update auction settings
export function updateAuctionSettings(settings) {
    demoDb.auction.startingPrice = settings.initialPrice || demoDb.auction.startingPrice;
    demoDb.auction.priceStep = settings.priceIncrement || demoDb.auction.priceStep;
    demoDb.auction.auctionDuration = settings.auctionDuration || demoDb.auction.auctionDuration;

    return Promise.resolve({
        initialPrice: demoDb.auction.startingPrice,
        priceIncrement: demoDb.auction.priceStep,
        auctionDuration: demoDb.auction.auctionDuration
    });
}

// Get all bidders
export function getBidders() {
    return Promise.resolve([...demoDb.bidders]);
}

// Add new bidder
export function addBidder(bidder) {
    // Check for duplicate ID
    const existingBidder = demoDb.bidders.find(b => b.id === bidder.id);
    if (existingBidder) {
        return Promise.reject({ message: "Bidder ID already exists" });
    }

    demoDb.bidders.push(bidder);
    return Promise.resolve(bidder);
}

// Delete bidder
export function deleteBidder(bidderId) {
    const initialLength = demoDb.bidders.length;
    demoDb.bidders = demoDb.bidders.filter(b => b.id !== bidderId);

    if (demoDb.bidders.length === initialLength) {
        return Promise.reject({ message: "Bidder not found" });
    }

    return Promise.resolve({ message: "Bidder deleted successfully" });
}

// Import bidders
export function importBidders(bidders) {
    // Filter out bidders with duplicate IDs
    const existingIds = new Set(demoDb.bidders.map(b => b.id));
    const newBidders = bidders.filter(b => !existingIds.has(b.id));

    demoDb.bidders.push(...newBidders);
    return Promise.resolve({
        imported: newBidders.length,
        total: bidders.length
    });
}

// Start auction
export function startAuction() {
    if (demoDb.bidders.length < 2) {
        return Promise.reject({ message: "At least 2 bidders are required to start the auction" });
    }

    demoDb.auction.status = "active";
    demoDb.auction.startedAt = new Date().toISOString();
    demoDb.auction.currentRound = 1;
    demoDb.auction.timeRemaining = demoDb.auction.auctionDuration;

    // Start timer
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = setInterval(() => {
        if (demoDb.auction.timeRemaining > 0 && demoDb.auction.status === "active") {
            demoDb.auction.timeRemaining--;
        } else if (demoDb.auction.status === "active") {
            // Time expired, but auction still active
            clearInterval(demoTimer);
        }
    }, 1000);

    return Promise.resolve({
        status: "active",
        startedAt: demoDb.auction.startedAt
    });
}

// Get auction status
export function getAuctionStatus() {
    // Calculate highest bid
    let highestBid = 0;
    let highestBidder = null;

    if (demoDb.bids.length > 0) {
        const highest = demoDb.bids.reduce((prev, current) =>
            (prev.amount > current.amount) ? prev : current);
        highestBid = highest.amount;
        highestBidder = highest.bidderName;
    }

    return Promise.resolve({
        status: demoDb.auction.status,
        round: demoDb.auction.currentRound,
        highestBid: highestBid,
        highestBidder: highestBidder,
        timeRemaining: demoDb.auction.timeRemaining,
        startTime: demoDb.auction.startedAt,
        endTime: demoDb.auction.endedAt
    });
}

// Place bid
export function placeBid(bid) {
    if (demoDb.auction.status !== "active") {
        return Promise.reject({ message: "Auction is not active" });
    }

    // Validate bidder exists
    const bidder = demoDb.bidders.find(b => b.id === bid.bidderId);
    if (!bidder) {
        return Promise.reject({ message: "Bidder not found" });
    }

    // Get highest bid
    let currentHighestBid = demoDb.auction.startingPrice;
    if (demoDb.bids.length > 0) {
        currentHighestBid = Math.max(...demoDb.bids.map(b => b.amount));
    }

    // Validate bid amount
    if (bid.amount <= currentHighestBid) {
        return Promise.reject({ message: "Bid amount must be higher than current highest bid" });
    }

    // Create bid object
    const newBid = {
        id: `bid-${Date.now()}`,
        bidderId: bid.bidderId,
        bidderName: bidder.name,
        amount: bid.amount,
        timestamp: new Date().toISOString(),
        round: demoDb.auction.currentRound
    };

    demoDb.bids.push(newBid);

    // Reset timer for new round
    demoDb.auction.currentRound++;
    demoDb.auction.timeRemaining = demoDb.auction.auctionDuration;

    return Promise.resolve(newBid);
}

// Get bid history
export function getBidHistory() {
    return Promise.resolve([...demoDb.bids]);
}

// Cancel last bid
export function cancelLastBid() {
    if (demoDb.bids.length === 0) {
        return Promise.reject({ message: "No bids to cancel" });
    }

    const lastBid = demoDb.bids.pop();
    demoDb.auction.currentRound = Math.max(1, demoDb.auction.currentRound - 1);

    return Promise.resolve({
        cancelled: lastBid,
        message: "Last bid cancelled successfully"
    });
}

// End auction
export function endAuction() {
    if (demoDb.auction.status !== "active") {
        return Promise.reject({ message: "Auction is not active" });
    }

    demoDb.auction.status = "ended";
    demoDb.auction.endedAt = new Date().toISOString();

    // Set winning bid if any
    if (demoDb.bids.length > 0) {
        const highestBid = demoDb.bids.reduce((prev, current) =>
            (prev.amount > current.amount) ? prev : current);
        demoDb.auction.winningBid = highestBid.amount;
        demoDb.auction.winningBidder = highestBid.bidderName;
    }

    // Clear timer
    if (demoTimer) {
        clearInterval(demoTimer);
        demoTimer = null;
    }

    return Promise.resolve({
        status: "ended",
        endedAt: demoDb.auction.endedAt,
        winningBid: demoDb.auction.winningBid,
        winningBidder: demoDb.auction.winningBidder
    });
}

// Reset demo data - useful for testing
export function resetDemo() {
    demoDb.auction = {
        id: "demo-auction-1",
        status: "setup",
        startingPrice: 1000000,
        priceStep: 50000,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        startedAt: null,
        endedAt: null,
        currentRound: 0,
        timeRemaining: 60,
        auctionDuration: 60,
        winningBid: null,
        winningBidder: null
    };

    demoDb.bidders = [
        { id: "B001", name: "Nguyễn Văn A", address: "123 Đường Lê Lợi, Hà Nội" },
        { id: "B002", name: "Trần Thị B", address: "456 Đường Nguyễn Huệ, TP.HCM" },
        { id: "B003", name: "Lê Văn C", address: "789 Đường Trần Phú, Đà Nẵng" }
    ];

    demoDb.bids = [];

    if (demoTimer) {
        clearInterval(demoTimer);
        demoTimer = null;
    }

    return Promise.resolve({ message: "Demo data reset successfully" });
}
