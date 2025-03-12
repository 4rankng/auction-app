package tests

import (
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

// TestStartAuction tests the functionality to start an auction
func TestStartAuction(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "notStarted" status
	auctionID := "test-auction-1"
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders:       []models.Bidder{},
		BidHistory:    []models.Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "notStarted",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Mock the UpdateAuction call to verify status change
	mockDB.On("UpdateAuction", auctionID, mock.MatchedBy(func(a *models.Auction) bool {
		return a.AuctionStatus == "inProgress"
	})).Return(nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/v1/auctions/:id/start", auctionHandlers.StartAuction)

	// Create a test request
	req := httptest.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/start", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "message")
	assert.Contains(t, response["message"], "started")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestStartAuctionAlreadyStarted tests trying to start an auction that's already in progress
func TestStartAuctionAlreadyStarted(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "inProgress" status
	auctionID := "test-auction-2"
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders:       []models.Bidder{},
		BidHistory:    []models.Bid{},
		CurrentRound:  1,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "inProgress", // Already started
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/v1/auctions/:id/start", auctionHandlers.StartAuction)

	// Create a test request
	req := httptest.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/start", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "already")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestEndAuction tests the functionality to end an auction
func TestEndAuction(t *testing.T) {
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
			{ID: "bidder1", Name: "Bidder 1", Address: "Address 1"},
		},
		BidHistory: []models.Bid{
			{
				Round:      1,
				BidderID:   "bidder1",
				BidderName: "Bidder 1",
				Amount:     120,
				Timestamp:  time.Now(),
			},
		},
		CurrentRound:  1,
		HighestBid:    120,
		HighestBidder: "bidder1",
		AuctionStatus: "inProgress",
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Mock the UpdateAuction call to verify status change
	mockDB.On("UpdateAuction", auctionID, mock.MatchedBy(func(a *models.Auction) bool {
		return a.AuctionStatus == "completed"
	})).Return(nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/v1/auctions/:id/end", auctionHandlers.EndAuction)

	// Create a test request
	req := httptest.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/end", nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "message")
	assert.Contains(t, response["message"], "ended")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestEndAuctionNotInProgress tests trying to end an auction that's not in progress
func TestEndAuctionNotInProgress(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create a test auction with "notStarted" status
	auctionID := "test-auction-4"
	auction := &models.Auction{
		ID:            auctionID,
		Title:         "Test Auction",
		CreatedAt:     time.Now(),
		StartingPrice: 100,
		PriceStep:     10,
		Bidders:       []models.Bidder{},
		BidHistory:    []models.Bid{},
		CurrentRound:  0,
		HighestBid:    0,
		HighestBidder: "",
		AuctionStatus: "notStarted", // Not started yet
	}

	// Mock the GetAuction call
	mockDB.On("GetAuction", auctionID).Return(auction, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PUT("/api/v1/auctions/:id/end", auctionHandlers.EndAuction)

	// Create a test request
	req := httptest.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/end", nil)
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

// TestExportAuctionData tests the functionality to export auction data
func TestExportAuctionData(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	// Create test auction and export data
	auctionID := "test-auction-5"
	exportData := &models.ExportData{
		AuctionID:     auctionID,
		Title:         "Test Auction",
		StartingPrice: 100,
		PriceStep:     10,
		TotalBids:     2,
		BidHistory: []models.Bid{
			{
				Round:      1,
				BidderID:   "bidder1",
				BidderName: "Bidder 1",
				Amount:     110,
				Timestamp:  time.Now(),
			},
			{
				Round:      2,
				BidderID:   "bidder2",
				BidderName: "Bidder 2",
				Amount:     120,
				Timestamp:  time.Now(),
			},
		},
		WinnerID:   "bidder2",
		WinnerName: "Bidder 2",
		WinningBid: 120,
		EndTime:    time.Now(),
	}

	// Mock the ExportAuctionData call
	mockDB.On("ExportAuctionData", auctionID).Return(exportData, nil)

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auction/export/:id", auctionHandlers.ExportAuctionData)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auction/export/"+auctionID, nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Check that data is returned
	assert.Contains(t, response, "data")
	data := response["data"].(map[string]interface{})
	assert.Equal(t, auctionID, data["auctionId"])
	assert.Equal(t, "Test Auction", data["title"])
	assert.Equal(t, float64(120), data["winningBid"])
	assert.Equal(t, "bidder2", data["winnerId"])

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestExportAuctionDataWithError tests exporting auction data with an error
func TestExportAuctionDataWithError(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	auctionID := "non-existent-auction"

	// Mock the ExportAuctionData call to return an error
	mockDB.On("ExportAuctionData", auctionID).Return(nil,
		&models.ErrorNotFound{Message: "Auction not found"})

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auction/export/:id", auctionHandlers.ExportAuctionData)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auction/export/"+auctionID, nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "not found")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}

// TestExportAuctionDataNotCompleted tests that data can't be exported for an auction that's not completed
func TestExportAuctionDataNotCompleted(t *testing.T) {
	// Setup
	mockDB := new(MockDatabase)
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)

	auctionID := "incomplete-auction"

	// Mock the ExportAuctionData call to return an error
	mockDB.On("ExportAuctionData", auctionID).Return(nil,
		&models.ErrorValidation{Message: "Cannot export data for auction that is not completed"})

	// Create handler and router
	auctionHandlers := handlers.NewAuctionHandlers(mockDB, logger)

	// Create a new Gin router
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/v1/auction/export/:id", auctionHandlers.ExportAuctionData)

	// Create a test request
	req := httptest.NewRequest("GET", "/api/v1/auction/export/"+auctionID, nil)
	w := httptest.NewRecorder()

	// Serve the request
	router.ServeHTTP(w, req)

	// Assertions
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "error")
	assert.Contains(t, response["error"].(string), "not completed")

	// Verify that all expected method calls were made
	mockDB.AssertExpectations(t)
}
