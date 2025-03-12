package tests

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"auction/api/handlers"
	"auction/internal/models"
)

// Tests for bidding operations

// TestPlaceBid tests the ability to place a bid on an auction
func TestPlaceBid(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "inProgress" status
	auctionID := "test-auction-1"
	bidder := models.Bidder{ID: "bidder1", Name: "Test Bidder", Address: "123 Bid St"}
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders: []models.Bidder{
			bidder,
		},
		BidHistory:    []models.Bid{},
		CurrentRound:  1,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Mock the UpdateAuction call
	mockDB.On("UpdateAuction", auctionID, mock.Anything).Return(nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auctions/:id/bids", auctionHandlers.PlaceBid)

	// Create bid request
	bidRequest := map[string]interface{}{
		"bidderId": bidder.ID,
		"amount":   150,
	}
	jsonRequest, _ := json.Marshal(bidRequest)

	// Create a test request
	req := httptest.NewRequest("POST", "/api/v1/auctions/"+auctionID+"/bids", bytes.NewBuffer(jsonRequest))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "message")
	assert.Contains(t, response["message"], "successful")
	assert.Contains(t, response, "data")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestPlaceBidInvalidAuction tests placing a bid on a non-existent auction
func TestPlaceBidInvalidAuction(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Mock the GetAuction call to return an error
	mockDB.On("GetAuction", "invalid-auction").Return(nil, &models.ErrorNotFound{Message: "Auction not found"})

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auctions/:id/bids", auctionHandlers.PlaceBid)

	// Create bid request
	bidRequest := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	jsonRequest, _ := json.Marshal(bidRequest)

	// Create a test request
	req := httptest.NewRequest("POST", "/api/v1/auctions/invalid-auction/bids", bytes.NewBuffer(jsonRequest))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusNotFound, w.Code)

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestPlaceBidAuctionNotInProgress tests placing a bid on an auction that's not in progress
func TestPlaceBidAuctionNotInProgress(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "notStarted" status
	auctionID := "test-auction-2"
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders: []models.Bidder{
			{ID: "bidder1", Name: "Test Bidder", Address: "123 Bid St"},
		},
		BidHistory:    []models.Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "notStarted", // Not in progress
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auctions/:id/bids", auctionHandlers.PlaceBid)

	// Create bid request
	bidRequest := map[string]interface{}{
		"bidderId": "bidder1",
		"amount":   150,
	}
	jsonRequest, _ := json.Marshal(bidRequest)

	// Create a test request
	req := httptest.NewRequest("POST", "/api/v1/auctions/"+auctionID+"/bids", bytes.NewBuffer(jsonRequest))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "not in progress")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestPlaceBidInvalidBidder tests placing a bid from a bidder not in the auction
func TestPlaceBidInvalidBidder(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "inProgress" status
	auctionID := "test-auction-3"
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders: []models.Bidder{
			{ID: "bidder1", Name: "Test Bidder", Address: "123 Bid St"},
		},
		BidHistory:    []models.Bid{},
		CurrentRound:  1,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auctions/:id/bids", auctionHandlers.PlaceBid)

	// Create bid request with invalid bidder
	bidRequest := map[string]interface{}{
		"bidderId": "invalid-bidder", // Not in the auction
		"amount":   150,
	}
	jsonRequest, _ := json.Marshal(bidRequest)

	// Create a test request
	req := httptest.NewRequest("POST", "/api/v1/auctions/"+auctionID+"/bids", bytes.NewBuffer(jsonRequest))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "not found")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestPlaceBidLowAmount tests placing a bid with an amount that's too low
func TestPlaceBidLowAmount(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with a previous bid
	auctionID := "test-auction-4"
	bidder := models.Bidder{ID: "bidder1", Name: "Test Bidder", Address: "123 Bid St"}
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders: []models.Bidder{
			bidder,
		},
		BidHistory: []models.Bid{
			{
				Round:      1,
				BidderID:   bidder.ID,
				BidderName: bidder.Name,
				Amount:     150,
				Timestamp:  time.Now().Add(-1 * time.Hour),
			},
		},
		CurrentRound:  1,
		HighestBid:    150, // Previous highest bid
		HighestBidder: bidder.ID,
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auctions/:id/bids", auctionHandlers.PlaceBid)

	// Create bid request with amount that's too low
	bidRequest := map[string]interface{}{
		"bidderId": bidder.ID,
		"amount":   150, // Should be at least 160 (previous bid + step)
	}
	jsonRequest, _ := json.Marshal(bidRequest)

	// Create a test request
	req := httptest.NewRequest("POST", "/api/v1/auctions/"+auctionID+"/bids", bytes.NewBuffer(jsonRequest))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "at least")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestGetCurrentBids tests retrieving current bids for an auction
func TestGetCurrentBids(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with some bids
	auctionID := "test-auction-5"
	bidders := []models.Bidder{
		{ID: "bidder1", Name: "Bidder 1", Address: "123 Bid St"},
		{ID: "bidder2", Name: "Bidder 2", Address: "456 Bid Ln"},
	}

	// Bidder 1 placed two bids, bidder 2 placed one bid
	bids := []models.Bid{
		{
			Round:      1,
			BidderID:   bidders[0].ID,
			BidderName: bidders[0].Name,
			Amount:     120,
			Timestamp:  time.Now().Add(-2 * time.Hour),
		},
		{
			Round:      1,
			BidderID:   bidders[1].ID,
			BidderName: bidders[1].Name,
			Amount:     130,
			Timestamp:  time.Now().Add(-1 * time.Hour),
		},
		{
			Round:      1,
			BidderID:   bidders[0].ID,
			BidderName: bidders[0].Name,
			Amount:     140,
			Timestamp:  time.Now(),
		},
	}

	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now().Add(-3 * time.Hour),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders:       bidders,
		BidHistory:    bids,
		CurrentRound:  1,
		HighestBid:    140,
		HighestBidder: bidders[0].ID,
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auctions/:id/bids/current", auctionHandlers.GetCurrentBids)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auctions/"+auctionID+"/bids/current", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that data contains the current bids (latest from each bidder)
	assert.Contains(t, response, "data")
	assert.Contains(t, response, "highestBid")
	assert.Contains(t, response, "highestBidder")

	data := response["data"].([]interface{})
	assert.Equal(t, 2, len(data), "Should contain 2 current bids (latest from each bidder)")

	// Verify high bid info
	assert.Equal(t, float64(140), response["highestBid"])
	assert.Equal(t, bidders[0].ID, response["highestBidder"])

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestGetAuctionHistory tests retrieving the full bid history for an auction
func TestGetAuctionHistory(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with bid history
	auctionID := "test-auction-6"
	bidders := []models.Bidder{
		{ID: "bidder1", Name: "Bidder 1", Address: "123 Bid St"},
		{ID: "bidder2", Name: "Bidder 2", Address: "456 Bid Ln"},
	}

	bids := []models.Bid{
		{
			Round:      1,
			BidderID:   bidders[0].ID,
			BidderName: bidders[0].Name,
			Amount:     120,
			Timestamp:  time.Now().Add(-2 * time.Hour),
		},
		{
			Round:      1,
			BidderID:   bidders[1].ID,
			BidderName: bidders[1].Name,
			Amount:     130,
			Timestamp:  time.Now().Add(-1 * time.Hour),
		},
		{
			Round:      1,
			BidderID:   bidders[0].ID,
			BidderName: bidders[0].Name,
			Amount:     140,
			Timestamp:  time.Now(),
		},
	}

	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now().Add(-3 * time.Hour),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders:       bidders,
		BidHistory:    bids,
		CurrentRound:  1,
		HighestBid:    140,
		HighestBidder: bidders[0].ID,
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auctions/:id/bids/history", auctionHandlers.GetAuctionHistory)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auctions/"+auctionID+"/bids/history", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that data contains all bids
	assert.Contains(t, response, "data")

	data := response["data"].([]interface{})
	assert.Equal(t, 3, len(data), "Should contain all 3 bids in history")

	// Verify auction status
	assert.Contains(t, response, "auctionStatus")
	assert.Equal(t, "inProgress", response["auctionStatus"])

	// Verify current round
	assert.Contains(t, response, "currentRound")
	assert.Equal(t, float64(1), response["currentRound"])

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestGetAuctionHistoryInvalidAuction tests retrieving history for a non-existent auction
func TestGetAuctionHistoryInvalidAuction(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Mock the GetAuction call to return an error
	mockDB.On("GetAuction", "invalid-auction").Return(nil, &models.ErrorNotFound{Message: "Auction not found"})

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auctions/:id/bids/history", auctionHandlers.GetAuctionHistory)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auctions/invalid-auction/bids/history", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusNotFound, w.Code)

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}
