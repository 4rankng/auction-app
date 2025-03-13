package database

import (
	"log"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"auction/common"
	"auction/internal/models"
)

func setupTestDB(t *testing.T) (*TinyDB, string) {
	// Create a temporary directory for test data
	tempDir, err := os.MkdirTemp("", "tinydb-test-")
	require.NoError(t, err)

	// Create a logger
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a TinyDB instance with the temp directory
	db, err := NewTinyDB(tempDir, logger)
	require.NoError(t, err)

	// Initialize the database
	err = db.Initialize()
	require.NoError(t, err)

	return db, tempDir
}

func cleanupTestDB(tempDir string) {
	os.RemoveAll(tempDir)
}

func TestTinyDBInitialize(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Check that data file was created
	dataFilePath := filepath.Join(tempDir, "auction_data.json")
	_, err := os.Stat(dataFilePath)
	assert.NoError(t, err, "Data file should exist after initialization")

	// Check that calling Initialize again works
	err = db.Initialize()
	assert.NoError(t, err, "Second initialization should not fail")
}

func TestTinyDBSaveData(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: common.NotStarted,
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Save the data
	err = db.SaveData()
	assert.NoError(t, err, "SaveData should not fail")

	// Close the DB
	err = db.Close()
	assert.NoError(t, err, "Close should not fail")

	// Create a logger for the new instance
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a new DB instance and load the data
	db2, err := NewTinyDB(tempDir, logger)
	require.NoError(t, err)

	err = db2.Initialize()
	require.NoError(t, err)

	// Get the auction and verify it was saved
	auctions, err := db2.GetAllAuctions()
	require.NoError(t, err)
	assert.Len(t, auctions, 1, "Should have 1 auction")

	savedAuction, exists := auctions["test-auction"]
	assert.True(t, exists, "test-auction should exist")
	assert.Equal(t, auction.Title, savedAuction.Title)
}

func TestTinyDBCreateAuction(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: common.NotStarted,
	}

	// Add the auction
	err := db.CreateAuction(auction)
	assert.NoError(t, err, "CreateAuction should not fail")

	// Try to add the same auction again
	err = db.CreateAuction(auction)
	assert.Error(t, err, "Creating auction with duplicate ID should fail")

	// Try to add a nil auction
	err = db.CreateAuction(nil)
	assert.Error(t, err, "Creating nil auction should fail")
}

func TestTinyDBGetAuction(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: common.NotStarted,
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Get the auction
	fetchedAuction, err := db.GetAuction("test-auction")
	assert.NoError(t, err, "GetAuction should not fail")
	assert.Equal(t, auction.ID, fetchedAuction.ID)
	assert.Equal(t, auction.Title, fetchedAuction.Title)

	// Try to get a non-existent auction
	_, err = db.GetAuction("non-existent")
	assert.Error(t, err, "Getting non-existent auction should fail")
}

func TestTinyDBGetAllAuctions(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Initially there should be no auctions
	auctions, err := db.GetAllAuctions()
	assert.NoError(t, err, "GetAllAuctions should not fail")
	assert.Len(t, auctions, 0, "Should have 0 auctions initially")

	// Create multiple test auctions
	auction1 := &models.Auction{
		ID:            "auction1",
		Title:         "Auction 1",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: common.NotStarted,
	}

	auction2 := &models.Auction{
		ID:            "auction2",
		Title:         "Auction 2",
		CreatedAt:     time.Now(),
		StartingPrice: 200000,
		PriceStep:     20000,
		Status: common.NotStarted,
	}

	// Add the auctions
	err = db.CreateAuction(auction1)
	require.NoError(t, err)

	err = db.CreateAuction(auction2)
	require.NoError(t, err)

	// Get all auctions
	auctions, err = db.GetAllAuctions()
	assert.NoError(t, err, "GetAllAuctions should not fail")
	assert.Len(t, auctions, 2, "Should have 2 auctions")
	assert.Contains(t, auctions, "auction1")
	assert.Contains(t, auctions, "auction2")
}

func TestTinyDBUpdateAuction(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: common.NotStarted,
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Update the auction
	updatedAuction := &models.Auction{
		ID:            "test-auction",
		Title:         "Updated Test Auction",
		CreatedAt:     auction.CreatedAt,
		StartingPrice: 150000,
		PriceStep:     15000,
		Status: common.InProgress,
	}

	err = db.UpdateAuction("test-auction", updatedAuction)
	assert.NoError(t, err, "UpdateAuction should not fail")

	// Get the updated auction
	fetchedAuction, err := db.GetAuction("test-auction")
	require.NoError(t, err)
	assert.Equal(t, "Updated Test Auction", fetchedAuction.Title)
	assert.Equal(t, 150000, fetchedAuction.StartingPrice)
	assert.Equal(t, common.InProgress, fetchedAuction.Status)

	// Try to update a non-existent auction
	err = db.UpdateAuction("non-existent", updatedAuction)
	assert.Error(t, err, "Updating non-existent auction should fail")

	// Try to update with nil auction
	err = db.UpdateAuction("test-auction", nil)
	assert.Error(t, err, "Updating with nil auction should fail")
}

func TestTinyDBDeleteAuction(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: "notStarted",
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Delete the auction
	err = db.DeleteAuction("test-auction")
	assert.NoError(t, err, "DeleteAuction should not fail")

	// Try to get the deleted auction
	_, err = db.GetAuction("test-auction")
	assert.Error(t, err, "Getting deleted auction should fail")

	// Try to delete a non-existent auction
	err = db.DeleteAuction("non-existent")
	assert.Error(t, err, "Deleting non-existent auction should fail")
}

func TestTinyDBExportAuctionData(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a completed test auction with bidders and bid history
	bidder1 := models.Bidder{ID: "bidder1", Name: "Bidder 1"}
	bidder2 := models.Bidder{ID: "bidder2", Name: "Bidder 2"}

	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now().Add(-1 * time.Hour),
		StartingPrice: 100000,
		PriceStep:     10000,
		Bidders:       []models.Bidder{bidder1, bidder2},
		BidHistory: []models.Bid{
			{
				Round:      1,
				BidderID:   bidder1.ID,
				BidderName: bidder1.Name,
				Amount:     120000,
				Timestamp:  time.Now().Add(-45 * time.Minute),
			},
			{
				Round:      2,
				BidderID:   bidder2.ID,
				BidderName: bidder2.Name,
				Amount:     130000,
				Timestamp:  time.Now().Add(-30 * time.Minute),
			},
			{
				Round:      3,
				BidderID:   bidder1.ID,
				BidderName: bidder1.Name,
				Amount:     150000,
				Timestamp:  time.Now().Add(-15 * time.Minute),
			},
		},
		CurrentRound:  3,
		HighestBid:    150000,
		HighestBidder: bidder1.ID,
		Status: common.Completed,
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Export the auction data
	exportData, err := db.ExportAuctionData("test-auction")
	assert.NoError(t, err, "ExportAuctionData should not fail")

	// Verify export data
	assert.Equal(t, "test-auction", exportData.AuctionID)
	assert.Equal(t, "Test Auction", exportData.Title)
	assert.Equal(t, 3, exportData.TotalBids)
	assert.Equal(t, bidder1.ID, exportData.WinnerID)
	assert.Equal(t, bidder1.Name, exportData.WinnerName)
	assert.Equal(t, 150000, exportData.WinningBid)

	// Try to export a non-existent auction
	_, err = db.ExportAuctionData("non-existent")
	assert.Error(t, err, "Exporting non-existent auction should fail")

	// Try to export a non-completed auction
	nonCompletedAuction := &models.Auction{
		ID:            "non-completed",
		Title:         "Non-Completed Auction",
		CreatedAt:     time.Now(),
		Status: common.InProgress,
	}

	err = db.CreateAuction(nonCompletedAuction)
	require.NoError(t, err)

	_, err = db.ExportAuctionData("non-completed")
	assert.Error(t, err, "Exporting non-completed auction should fail")
}

func TestTinyDBBidderOperations(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create a test auction
	auction := &models.Auction{
		ID:            "test-auction",
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Bidders:       []models.Bidder{},
		Status: "notStarted",
	}

	// Add the auction
	err := db.CreateAuction(auction)
	require.NoError(t, err)

	// Set the test-auction as the current auction
	db.auctionData.CurrentAuction = "test-auction"

	// Initially there should be no bidders
	bidders, err := db.GetBidders()
	assert.NoError(t, err, "GetBidders should not fail")
	assert.Len(t, bidders, 0, "Should have 0 bidders initially")

	// Add bidders
	testBidders := []models.Bidder{
		{ID: "bidder1", Name: "Bidder 1"},
		{ID: "bidder2", Name: "Bidder 2"},
	}

	err = db.SetBidders(testBidders)
	assert.NoError(t, err, "SetBidders should not fail")

	// Get bidders
	fetchedBidders, err := db.GetBidders()
	assert.NoError(t, err, "GetBidders should not fail")
	assert.Len(t, fetchedBidders, 2, "Should have 2 bidders")
	assert.Equal(t, "Bidder 1", fetchedBidders[0].Name)
	assert.Equal(t, "Bidder 2", fetchedBidders[1].Name)

	// Test with no current auction set
	db.auctionData.CurrentAuction = ""

	// Get bidders with no current auction
	fetchedBiddersEmpty, err := db.GetBidders()
	assert.NoError(t, err, "GetBidders with no current auction should return empty list without error")
	assert.Empty(t, fetchedBiddersEmpty, "Should have 0 bidders when no current auction")

	err = db.SetBidders(testBidders)
	assert.Error(t, err, "SetBidders with no current auction should fail")
}

func TestTinyDBCurrentAuction(t *testing.T) {
	db, tempDir := setupTestDB(t)
	defer cleanupTestDB(tempDir)

	// Create two test auctions
	auction1 := &models.Auction{
		ID:            "auction1",
		Title:         "Auction 1",
		CreatedAt:     time.Now(),
		StartingPrice: 100000,
		PriceStep:     10000,
		Status: "notStarted",
	}

	auction2 := &models.Auction{
		ID:            "auction2",
		Title:         "Auction 2",
		CreatedAt:     time.Now(),
		StartingPrice: 200000,
		PriceStep:     20000,
		Status: "notStarted",
	}

	// Add the auctions
	err := db.CreateAuction(auction1)
	require.NoError(t, err)

	err = db.CreateAuction(auction2)
	require.NoError(t, err)

	// Set the current auction
	db.auctionData.CurrentAuction = "auction1"

	// Verify the current auction
	assert.Equal(t, "auction1", db.auctionData.CurrentAuction)

	// Change the current auction
	db.auctionData.CurrentAuction = "auction2"

	// Verify the current auction
	assert.Equal(t, "auction2", db.auctionData.CurrentAuction)
}
