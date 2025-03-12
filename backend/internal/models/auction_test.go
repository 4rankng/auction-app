package models

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestAuctionCreation(t *testing.T) {
	// Create a new auction
	auction := &Auction{
		ID:            uuid.New().String(),
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		Bidders:       []Bidder{},
		StartingPrice: 100,
		PriceStep:     10,
		BidHistory:    []Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "notStarted",
	}

	// Assert that the auction was created with the correct values
	assert.Equal(t, "Test Auction", auction.Title)
	assert.Equal(t, 100, auction.StartingPrice)
	assert.Equal(t, 10, auction.PriceStep)
	assert.NotEmpty(t, auction.ID, "Auction ID should not be empty")
	assert.Equal(t, "notStarted", auction.AuctionStatus)
	assert.NotNil(t, auction.Bidders, "Bidders slice should be initialized")
	assert.NotNil(t, auction.BidHistory, "BidHistory slice should be initialized")
	assert.NotZero(t, auction.CreatedAt, "CreatedAt should be set")
}

func TestAuctionStatus(t *testing.T) {
	auction := &Auction{
		ID:            uuid.New().String(),
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		Bidders:       []Bidder{},
		StartingPrice: 100,
		PriceStep:     10,
		BidHistory:    []Bid{},
		AuctionStatus: "notStarted",
	}

	// Test starting the auction
	auction.AuctionStatus = "inProgress"
	assert.Equal(t, "inProgress", auction.AuctionStatus)

	// Test ending the auction
	auction.AuctionStatus = "completed"
	assert.Equal(t, "completed", auction.AuctionStatus)
}

func TestAddBidder(t *testing.T) {
	auction := &Auction{
		ID:            uuid.New().String(),
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		Bidders:       []Bidder{},
		StartingPrice: 100,
		PriceStep:     10,
		BidHistory:    []Bid{},
		AuctionStatus: "notStarted",
	}

	// Add a bidder
	bidder := Bidder{
		ID:   "bidder1",
		Name: "Test Bidder",
	}

	// Initially there should be no bidders
	assert.Equal(t, 0, len(auction.Bidders))

	// Add the bidder to the slice
	auction.Bidders = append(auction.Bidders, bidder)

	// Now there should be one bidder
	assert.Equal(t, 1, len(auction.Bidders))
	assert.Equal(t, "Test Bidder", auction.Bidders[0].Name)
}

func TestRecordBid(t *testing.T) {
	auction := &Auction{
		ID:            uuid.New().String(),
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		Bidders:       []Bidder{},
		StartingPrice: 100,
		PriceStep:     10,
		BidHistory:    []Bid{},
		AuctionStatus: "inProgress",
	}

	// Add a bidder
	bidder := Bidder{
		ID:   "bidder1",
		Name: "Test Bidder",
	}
	auction.Bidders = append(auction.Bidders, bidder)

	// Record a bid
	bid := Bid{
		BidderID:   "bidder1",
		BidderName: "Test Bidder",
		Amount:     150,
		Timestamp:  time.Now(),
		Round:      1,
	}

	// Initially there should be no bids
	assert.Equal(t, 0, len(auction.BidHistory))

	// Add the bid to history
	auction.BidHistory = append(auction.BidHistory, bid)

	// Now there should be one bid
	assert.Equal(t, 1, len(auction.BidHistory))
	assert.Equal(t, "bidder1", auction.BidHistory[0].BidderID)
	assert.Equal(t, 150, auction.BidHistory[0].Amount)

	// Update highest bid
	auction.HighestBid = bid.Amount
	auction.HighestBidder = bid.BidderID

	// Check highest bid was updated
	assert.Equal(t, 150, auction.HighestBid)
	assert.Equal(t, "bidder1", auction.HighestBidder)
}

func TestExportData(t *testing.T) {
	auction := &Auction{
		ID:            uuid.New().String(),
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		Bidders:       []Bidder{},
		StartingPrice: 100,
		PriceStep:     10,
		BidHistory:    []Bid{},
		AuctionStatus: "completed",
	}

	// Add a bidder
	bidder := Bidder{
		ID:   "bidder1",
		Name: "Test Bidder",
	}
	auction.Bidders = append(auction.Bidders, bidder)

	// Record a bid
	timeNow := time.Now()
	bid := Bid{
		BidderID:   "bidder1",
		BidderName: "Test Bidder",
		Amount:     150,
		Timestamp:  timeNow,
		Round:      1,
	}
	auction.BidHistory = append(auction.BidHistory, bid)
	auction.HighestBid = bid.Amount
	auction.HighestBidder = bid.BidderID

	// Create export data
	exportData := ExportData{
		AuctionID:     auction.ID,
		Title:         auction.Title,
		TotalBids:     len(auction.BidHistory),
		EndTime:       timeNow,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		BidHistory:    auction.BidHistory,
		WinnerID:      auction.HighestBidder,
		WinnerName:    bidder.Name,
		WinningBid:    auction.HighestBid,
	}

	// Validate export data
	assert.Equal(t, auction.ID, exportData.AuctionID)
	assert.Equal(t, "Test Auction", exportData.Title)
	assert.Equal(t, 1, exportData.TotalBids)
	assert.Equal(t, 100, exportData.StartingPrice)
	assert.Equal(t, 150, exportData.WinningBid)
	assert.Equal(t, "bidder1", exportData.WinnerID)
	assert.Equal(t, "Test Bidder", exportData.WinnerName)
}
