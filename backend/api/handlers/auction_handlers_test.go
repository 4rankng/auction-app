package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"auction/common"
	"auction/internal/models"
)

// MockDatabase implements the database.Database interface for testing
type MockDatabase struct {
	auctions    map[string]*models.Auction
	currentAuction string
}

func NewMockDatabase() *MockDatabase {
	return &MockDatabase{
		auctions:    make(map[string]*models.Auction),
		currentAuction: "",
	}
}

func (m *MockDatabase) Close() error {
	return nil
}

func (m *MockDatabase) SaveData() error {
	return nil
}

func (m *MockDatabase) Initialize() error {
	return nil
}

func (m *MockDatabase) GetBidders() ([]models.Bidder, error) {
	if m.currentAuction != "" {
		if auction, exists := m.auctions[m.currentAuction]; exists {
			return auction.Bidders, nil
		}
	}
	return []models.Bidder{}, nil
}

func (m *MockDatabase) SetBidders(bidders []models.Bidder) error {
	if m.currentAuction != "" {
		if auction, exists := m.auctions[m.currentAuction]; exists {
			auction.Bidders = bidders
			return nil
		}
		return fmt.Errorf("current auction not found")
	}
	return fmt.Errorf("no current auction set")
}

func (m *MockDatabase) GetAllAuctions() (map[string]*models.Auction, error) {
	return m.auctions, nil
}

func (m *MockDatabase) GetAuction(id string) (*models.Auction, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}
	return auction, nil
}

func (m *MockDatabase) CreateAuction(auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot create nil auction")
	}

	if _, exists := m.auctions[auction.ID]; exists {
		return fmt.Errorf("auction with ID %s already exists", auction.ID)
	}

	m.auctions[auction.ID] = auction
	return nil
}

func (m *MockDatabase) UpdateAuction(id string, auction *models.Auction) error {
	if auction == nil {
		return fmt.Errorf("cannot update with nil auction")
	}

	if _, exists := m.auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	m.auctions[id] = auction
	return nil
}

func (m *MockDatabase) DeleteAuction(id string) error {
	if _, exists := m.auctions[id]; !exists {
		return fmt.Errorf("auction with ID %s not found", id)
	}

	delete(m.auctions, id)
	return nil
}

func (m *MockDatabase) ExportAuctionData(id string) (*models.ExportData, error) {
	auction, exists := m.auctions[id]
	if !exists {
		return nil, fmt.Errorf("auction with ID %s not found", id)
	}

	if auction.AuctionStatus != common.Completed {
		return nil, fmt.Errorf("cannot export data for auction that is not completed")
	}

	// Find winner information
	var winnerName string
	for _, bidder := range auction.Bidders {
		if bidder.ID == auction.HighestBidder {
			winnerName = bidder.Name
			break
		}
	}

	return &models.ExportData{
		AuctionID:     auction.ID,
		Title:         auction.Title,
		StartingPrice: auction.StartingPrice,
		PriceStep:     auction.PriceStep,
		TotalBids:     len(auction.BidHistory),
		BidHistory:    auction.BidHistory,
		WinnerID:      auction.HighestBidder,
		WinnerName:    winnerName,
		WinningBid:    auction.HighestBid,
		EndTime:       time.Now(),
	}, nil
}

// Helper function to setup test router and handlers
func setupTestRouter() (*gin.Engine, *MockDatabase) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockDB := NewMockDatabase()
	logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
	auctionHandlers := NewAuctionHandlers(mockDB, logger)

	api := r.Group("/api/v1")
	{
		api.POST("/auctions", auctionHandlers.CreateAuction)
		api.GET("/auctions", auctionHandlers.GetAllAuctions)
		api.GET("/auctions/:id", auctionHandlers.GetAuction)
		api.GET("/auction/export/:id", auctionHandlers.ExportAuctionData)
	}

	return r, mockDB
}

// Helper function to make HTTP request and read response
func performRequest(r http.Handler, method, path string, body []byte) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		req, _ = http.NewRequest(method, path, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
	} else {
		req, _ = http.NewRequest(method, path, nil)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestCreateAuction(t *testing.T) {
	// Test valid auction creation
	t.Run("Valid auction creation", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction payload
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "2", Name: "Bidder 2", Address: "Address 2"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusCreated, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "Test Auction", data["title"])
		assert.Equal(t, float64(100000), data["startingPrice"])
		assert.Equal(t, float64(10000), data["priceStep"])

		// Check auction was added to mock DB
		assert.Len(t, mockDB.auctions, 1)
	})

	// Test invalid request - missing required fields
	t.Run("Invalid request - missing required fields", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with missing title
		createRequest := map[string]interface{}{
			"startingPrice": 100000,
			"priceStep":     10000,
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with invalid title (too short)
	t.Run("Invalid title - too short", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with short title
		createRequest := CreateAuctionRequest{
			Title:         "AB", // Too short
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "2", Name: "Bidder 2", Address: "Address 2"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "Title must be at least 3 characters")

		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with invalid starting price
	t.Run("Invalid starting price - negative", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with negative starting price
		createRequest := map[string]interface{}{
			"title":         "Test Auction",
			"startingPrice": -100, // Negative value
			"priceStep":     10,
			"bidders": []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "2", Name: "Bidder 2", Address: "Address 2"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with price step > starting price
	t.Run("Invalid price step - greater than starting price", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with price step > starting price
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100,
			PriceStep:     200, // Greater than starting price
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "2", Name: "Bidder 2", Address: "Address 2"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "Price step cannot be greater than starting price")

		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with not enough bidders
	t.Run("Invalid bidders - less than 2", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with only one bidder
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "At least 2 bidders are required")

		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with duplicate bidder IDs
	t.Run("Invalid bidders - duplicate IDs", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with duplicate bidder IDs
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "1", Name: "Bidder 2", Address: "Address 2"}, // Duplicate ID
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "Duplicate bidder IDs")

		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with bidder missing ID
	t.Run("Invalid bidders - missing ID", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with a bidder missing ID
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "", Name: "Bidder 2", Address: "Address 2"}, // Missing ID
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "All bidders must have an ID")

		assert.Len(t, mockDB.auctions, 0)
	})

	// Test with bidder missing name
	t.Run("Invalid bidders - missing name", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Create auction with a bidder missing name
		createRequest := CreateAuctionRequest{
			Title:         "Test Auction",
			StartingPrice: 100000,
			PriceStep:     10000,
			Bidders: []models.Bidder{
				{ID: "1", Name: "Bidder 1", Address: "Address 1"},
				{ID: "2", Name: "", Address: "Address 2"}, // Missing name
			},
		}

		jsonPayload, _ := json.Marshal(createRequest)

		// Make request
		w := performRequest(router, "POST", "/api/v1/auctions", jsonPayload)

		// Check response
		assert.Equal(t, http.StatusBadRequest, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)
		assert.Contains(t, response["error"].(string), "All bidders must have a name")

		assert.Len(t, mockDB.auctions, 0)
	})
}

func TestGetAllAuctions(t *testing.T) {
	// Test with multiple auctions
	t.Run("Multiple auctions", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add some test auctions
		auction1 := &models.Auction{
			ID:            "auction1",
			Title:         "Auction 1",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: common.NotStarted,
		}

		auction2 := &models.Auction{
			ID:            "auction2",
			Title:         "Auction 2",
			CreatedAt:     time.Now(),
			StartingPrice: 200000,
			PriceStep:     20000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: common.InProgress,
		}

		mockDB.auctions[auction1.ID] = auction1
		mockDB.auctions[auction2.ID] = auction2

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].([]interface{})
		require.True(t, ok)
		assert.Len(t, data, 2)

		// Check pagination info
		pagination, ok := response["pagination"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, float64(2), pagination["totalItems"])
		assert.Equal(t, float64(1), pagination["totalPages"])
		assert.Equal(t, float64(1), pagination["currentPage"])
	})

	// Test with no auctions
	t.Run("No auctions", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data - empty data is represented as an empty array
		data, ok := response["data"].([]interface{})
		if !ok {
			// If it's nil, that's also acceptable
			_, exists := response["data"]
			assert.True(t, exists, "Response should have a data field")
		} else {
			assert.Len(t, data, 0, "Data should be an empty array")
		}

		// Check pagination info for empty result
		pagination, ok := response["pagination"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, float64(0), pagination["totalItems"])
		assert.Equal(t, float64(1), pagination["totalPages"]) // Still 1 page even when empty
		assert.Equal(t, float64(1), pagination["currentPage"])
	})

	// Test pagination with multiple pages
	t.Run("Pagination with multiple pages", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add multiple auctions (more than the default limit)
		for i := 1; i <= 15; i++ {
			auction := &models.Auction{
				ID:            fmt.Sprintf("auction%d", i),
				Title:         fmt.Sprintf("Auction %d", i),
				CreatedAt:     time.Now().Add(time.Duration(-i) * time.Hour), // Staggered creation times
				StartingPrice: 100000,
				PriceStep:     10000,
				BidHistory:    []models.Bid{},
				CurrentRound:  0,
				AuctionStatus: common.NotStarted,
			}
			mockDB.auctions[auction.ID] = auction
		}

		// Test default pagination (page 1, limit 10)
		w1 := performRequest(router, "GET", "/api/v1/auctions", nil)
		assert.Equal(t, http.StatusOK, w1.Code)

		var response1 map[string]interface{}
		err := json.Unmarshal(w1.Body.Bytes(), &response1)
		require.NoError(t, err)

		// First page should have 10 items
		data1, ok := response1["data"].([]interface{})
		require.True(t, ok)
		assert.Len(t, data1, 10)

		pagination1, ok := response1["pagination"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, float64(15), pagination1["totalItems"])
		assert.Equal(t, float64(2), pagination1["totalPages"])
		assert.Equal(t, float64(1), pagination1["currentPage"])

		// Test page 2
		w2 := performRequest(router, "GET", "/api/v1/auctions?page=2", nil)
		assert.Equal(t, http.StatusOK, w2.Code)

		var response2 map[string]interface{}
		err = json.Unmarshal(w2.Body.Bytes(), &response2)
		require.NoError(t, err)

		// Second page should have 5 items
		data2, ok := response2["data"].([]interface{})
		require.True(t, ok)
		assert.Len(t, data2, 5)

		pagination2, ok := response2["pagination"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, float64(15), pagination2["totalItems"])
		assert.Equal(t, float64(2), pagination2["totalPages"])
		assert.Equal(t, float64(2), pagination2["currentPage"])

		// Test custom limit
		w3 := performRequest(router, "GET", "/api/v1/auctions?limit=5", nil)
		assert.Equal(t, http.StatusOK, w3.Code)

		var response3 map[string]interface{}
		err = json.Unmarshal(w3.Body.Bytes(), &response3)
		require.NoError(t, err)

		// With limit 5, first page should have 5 items
		data3, ok := response3["data"].([]interface{})
		require.True(t, ok)
		assert.Len(t, data3, 5)

		pagination3, ok := response3["pagination"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, float64(15), pagination3["totalItems"])
		assert.Equal(t, float64(3), pagination3["totalPages"]) // 15/5 = 3 pages
		assert.Equal(t, float64(1), pagination3["currentPage"])
	})
}

func TestGetAuction(t *testing.T) {
	// Test with valid auction ID
	t.Run("Valid auction ID", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add test auction
		auction := &models.Auction{
			ID:            "auction1",
			Title:         "Test Auction",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: common.NotStarted,
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auctions/auction1", nil)

		// Check response
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check data
		data, ok := response["data"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "auction1", data["id"])
		assert.Equal(t, "Test Auction", data["title"])
	})

	// Test with non-existent auction ID
	t.Run("Non-existent auction ID", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request for non-existent auction
		w := performRequest(router, "GET", "/api/v1/auctions/nonexistent", nil)

		// Check response
		assert.Equal(t, http.StatusNotFound, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not found")
	})

	// Test with missing ID parameter
	t.Run("Missing ID parameter", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request with missing ID
		w := performRequest(router, "GET", "/api/v1/auctions/", nil)

		// Check response - should be 404 or 301 (redirect) as route doesn't match
		assert.True(t, w.Code == http.StatusNotFound || w.Code == http.StatusMovedPermanently,
			"Expected either 404 Not Found or 301 Moved Permanently")
	})
}

func TestExportAuctionData(t *testing.T) {
	// Test with valid completed auction
	t.Run("Valid completed auction", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add completed test auction with a bidder
		bidder := models.Bidder{ID: "bidder1", Name: "Winning Bidder"}

		auction := &models.Auction{
			ID:            "auction1",
			Title:         "Completed Auction",
			CreatedAt:     time.Now().Add(-1 * time.Hour),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory: []models.Bid{
				{
					Round:      1,
					BidderID:   bidder.ID,
					BidderName: bidder.Name,
					Amount:     150000,
					Timestamp:  time.Now().Add(-30 * time.Minute),
				},
			},
			Bidders:       []models.Bidder{bidder},
			CurrentRound:  1,
			HighestBid:    150000,
			HighestBidder: bidder.ID,
			AuctionStatus: common.Completed,
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auction/export/auction1", nil)

		// Check response status code
		assert.Equal(t, http.StatusOK, w.Code)

		// Parse response
		var response struct {
			Data models.ExportData `json:"data"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Perform assertions on the response data
		assert.Equal(t, "auction1", response.Data.AuctionID)
		assert.Equal(t, "Completed Auction", response.Data.Title)
		assert.Equal(t, 100000, response.Data.StartingPrice)
		assert.Equal(t, 10000, response.Data.PriceStep)
		assert.Equal(t, 1, response.Data.TotalBids)
		assert.Equal(t, "bidder1", response.Data.WinnerID)
		assert.Equal(t, "Winning Bidder", response.Data.WinnerName)
		assert.Equal(t, 150000, response.Data.WinningBid)
		assert.NotZero(t, response.Data.EndTime)
	})

	// Test with non-existent auction ID
	t.Run("Non-existent auction ID", func(t *testing.T) {
		router, _ := setupTestRouter()

		// Make request for non-existent auction
		w := performRequest(router, "GET", "/api/v1/auction/export/nonexistent", nil)

		// Check response
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not found")
	})

	// Test with non-completed auction
	t.Run("Non-completed auction", func(t *testing.T) {
		router, mockDB := setupTestRouter()

		// Add non-completed test auction
		auction := &models.Auction{
			ID:            "auction1",
			Title:         "In-progress Auction",
			CreatedAt:     time.Now(),
			StartingPrice: 100000,
			PriceStep:     10000,
			BidHistory:    []models.Bid{},
			CurrentRound:  0,
			AuctionStatus: common.InProgress,
		}

		mockDB.auctions[auction.ID] = auction

		// Make request
		w := performRequest(router, "GET", "/api/v1/auction/export/auction1", nil)

		// Check response
		assert.Equal(t, http.StatusInternalServerError, w.Code)

		// Parse response
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		require.NoError(t, err)

		// Check error message
		assert.Contains(t, response["error"], "not completed")
	})
}

// TestStartAuction tests the handler for starting an auction
func TestStartAuction(t *testing.T) {
	t.Run("Start an auction", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the start auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/start", auctionHandlers.StartAuction)

		// Create a test auction with "notStarted" status
		auctionID := "test-auction-start"
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
			AuctionStatus: common.NotStarted,
		}

		// Add auction to the mock database
		err := mockDB.CreateAuction(auction)
		require.NoError(t, err)

		// Make the request
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/start", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "message")
		assert.Contains(t, response["message"], "started")

		// Check that the auction status was updated
		updatedAuction, err := mockDB.GetAuction(auctionID)
		assert.NoError(t, err)
		assert.Equal(t, common.InProgress, updatedAuction.AuctionStatus)
		assert.Equal(t, 1, updatedAuction.CurrentRound)
	})

	t.Run("Auction already started", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the start auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/start", auctionHandlers.StartAuction)

		// Create a test auction with "inProgress" status
		auctionID := "test-auction-inprogress"
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
			AuctionStatus: common.InProgress, // already started
		}

		// Add auction to the mock database
		err := mockDB.CreateAuction(auction)
		require.NoError(t, err)

		// Make the request
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/start", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "error")
		assert.Contains(t, response["error"].(string), "already")
	})

	t.Run("Auction not found", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the start auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/start", auctionHandlers.StartAuction)

		// Make the request for a non-existent auction
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/nonexistent-auction/start", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "error")
		assert.Contains(t, response["error"].(string), "not found")
	})
}

// TestEndAuction tests the handler for ending an auction
func TestEndAuction(t *testing.T) {
	t.Run("End an auction", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the end auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/end", auctionHandlers.EndAuction)

		// Create a test auction with "inProgress" status
		auctionID := "test-auction-end"
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
			AuctionStatus: common.InProgress,
		}

		// Add auction to the mock database
		err := mockDB.CreateAuction(auction)
		require.NoError(t, err)

		// Make the request
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/end", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "message")
		assert.Contains(t, response["message"], "ended")

		// Check that the auction status was updated
		updatedAuction, err := mockDB.GetAuction(auctionID)
		assert.NoError(t, err)
		assert.Equal(t, common.Completed, updatedAuction.AuctionStatus)
	})

	t.Run("Auction not in progress", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the end auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/end", auctionHandlers.EndAuction)

		// Create a test auction with "notStarted" status
		auctionID := "test-auction-notstarted"
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
			AuctionStatus: common.NotStarted, // not started
		}

		// Add auction to the mock database
		err := mockDB.CreateAuction(auction)
		require.NoError(t, err)

		// Make the request
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/"+auctionID+"/end", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "error")
		assert.Contains(t, response["error"].(string), "not in progress")
	})

	t.Run("Auction not found", func(t *testing.T) {
		// Setup
		router, mockDB := setupTestRouter()

		// Add the end auction route to the router
		logger := log.New(os.Stdout, "[TEST] ", log.LstdFlags)
		auctionHandlers := NewAuctionHandlers(mockDB, logger)
		router.PUT("/api/v1/auctions/:id/end", auctionHandlers.EndAuction)

		// Make the request for a non-existent auction
		req, _ := http.NewRequest("PUT", "/api/v1/auctions/nonexistent-auction/end", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusNotFound, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.Contains(t, response, "error")
		assert.Contains(t, response["error"].(string), "not found")
	})
}
